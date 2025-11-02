import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { generateItineraryItems } from "@/lib/itinerary-generator"

interface DestinationInput {
  city: string
  daysToStay: number | null // null for last destination (return destination)
}

interface CreateTripRequest {
  title: string
  description?: string
  startDate: string
  endDate: string
  homeCity: string
  destinations: DestinationInput[]
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json() as CreateTripRequest
    const { title, description, startDate, endDate, homeCity, destinations } = body

    // Validate required fields
    if (!title || !startDate || !endDate || !homeCity || !destinations) {
      return NextResponse.json(
        { error: "Missing required fields: title, startDate, endDate, homeCity, and destinations are required" },
        { status: 400 }
      )
    }

    // Validate title is not empty
    if (!title.trim()) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      )
    }

    // Validate homeCity is not empty
    if (!homeCity.trim()) {
      return NextResponse.json(
        { error: "Home city cannot be empty" },
        { status: 400 }
      )
    }

    // Validate destinations array is not empty
    if (destinations.length === 0) {
      return NextResponse.json(
        { error: "At least one destination is required" },
        { status: 400 }
      )
    }

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
