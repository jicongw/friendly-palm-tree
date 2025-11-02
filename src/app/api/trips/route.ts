import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { generateItineraryItems } from "@/lib/itinerary-generator"
import { z } from "zod"

const CreateTripSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(5000, "Description is too long").optional(),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  homeCity: z.string().min(1, "Home city is required").max(100, "Home city name is too long"),
  destinations: z.array(
    z.object({
      city: z.string().min(1, "City name is required").max(100, "City name is too long"),
      daysToStay: z.number().int().min(1).max(365).nullable(),
    })
  ).min(1, "At least one destination is required"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const rawBody = await request.json()

    // Validate request body
    const validationResult = CreateTripSchema.safeParse(rawBody)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { title, description, startDate, endDate, homeCity, destinations } = validationResult.data

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      )
    }

    if (start > end) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      )
    }

    // Validate destinations
    const hasEmptyCity = destinations.some(d => !d.city?.trim())
    if (hasEmptyCity) {
      return NextResponse.json(
        { error: "Destination cities cannot be empty" },
        { status: 400 }
      )
    }

    // Validate all but last destination have daysToStay
    destinations.forEach((dest, index) => {
      const isLastDestination = index === destinations.length - 1
      if (!isLastDestination && (dest.daysToStay === null || dest.daysToStay === undefined)) {
        throw new Error("All destinations except the last must have daysToStay")
      }
      if (!isLastDestination && dest.daysToStay! < 1) {
        throw new Error("Days to stay must be at least 1")
      }
    })

    // Generate itinerary items (transportation and lodging)
    const itineraryItems = generateItineraryItems(
      homeCity.trim(),
      destinations.map(d => ({
        city: d.city.trim(),
        daysToStay: d.daysToStay
      })),
      start,
      end
    )

    // Create trip with destinations and itinerary items
    const trip = await prisma.trip.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        startDate: start,
        endDate: end,
        homeCity: homeCity.trim(),
        userId: session.user.id,
        destinations: {
          create: destinations.map((dest, index) => ({
            city: dest.city.trim(),
            daysToStay: dest.daysToStay,
            order: index,
          }))
        },
        itineraryItems: {
          create: itineraryItems.map(item => ({
            type: item.type,
            order: item.order,
            description: item.description,
            confirmationEmailLink: item.confirmationEmailLink,
            cost: item.cost,
            transportationType: item.transportationType,
            departTime: item.departTime,
            arriveTime: item.arriveTime,
            departCity: item.departCity,
            arriveCity: item.arriveCity,
            lodgingName: item.lodgingName,
            checkinTime: item.checkinTime,
            checkoutTime: item.checkoutTime,
            lodgingAddress: item.lodgingAddress,
            activityName: item.activityName,
            startTime: item.startTime,
            duration: item.duration,
            activityAddress: item.activityAddress,
            activityDescription: item.activityDescription,
          }))
        }
      },
      include: {
        destinations: {
          orderBy: {
            order: 'asc'
          }
        },
        itineraryItems: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    console.error("Error creating trip:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const trips = await prisma.trip.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        destinations: {
          orderBy: {
            order: 'asc'
          }
        },
        itineraryItems: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    return NextResponse.json(trips)
  } catch (error) {
    console.error("Error fetching trips:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
