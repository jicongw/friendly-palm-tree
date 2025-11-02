import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { ItineraryType } from "@prisma/client"
import { z } from "zod"

const CreateItineraryItemSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required"),
  type: z.nativeEnum(ItineraryType),
  order: z.number().int().min(0).optional(),

  // Common fields
  description: z.string().max(5000).optional(),
  confirmationEmailLink: z.string().url().max(500).optional().or(z.literal("")),
  cost: z.number().min(0).max(1000000).optional(),

  // Transportation fields
  transportationType: z.string().max(50).optional(),
  departTime: z.string().datetime().optional().or(z.literal("")),
  arriveTime: z.string().datetime().optional().or(z.literal("")),
  departCity: z.string().max(100).optional(),
  arriveCity: z.string().max(100).optional(),

  // Lodging fields
  lodgingName: z.string().max(200).optional(),
  checkinTime: z.string().datetime().optional().or(z.literal("")),
  checkoutTime: z.string().datetime().optional().or(z.literal("")),
  lodgingAddress: z.string().max(500).optional(),

  // Activity fields
  activityName: z.string().max(200).optional(),
  startTime: z.string().datetime().optional().or(z.literal("")),
  duration: z.number().int().min(1).max(1440).optional(), // Max 24 hours
  activityAddress: z.string().max(500).optional(),
  activityDescription: z.string().max(5000).optional(),
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
    const validationResult = CreateItineraryItemSchema.safeParse(rawBody)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const body = validationResult.data

    // Verify trip exists and user owns it
    const trip = await prisma.trip.findUnique({
      where: { id: body.tripId },
      include: { itineraryItems: true }
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    if (trip.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // If no order specified, put it at the end
    const order = body.order ?? trip.itineraryItems.length

    // Create itinerary item
    const item = await prisma.itineraryItem.create({
      data: {
        tripId: body.tripId,
        type: body.type,
        order,
        description: body.description,
        confirmationEmailLink: body.confirmationEmailLink,
        cost: body.cost,
        transportationType: body.transportationType,
        departTime: body.departTime && body.departTime !== "" ? new Date(body.departTime) : null,
        arriveTime: body.arriveTime && body.arriveTime !== "" ? new Date(body.arriveTime) : null,
        departCity: body.departCity,
        arriveCity: body.arriveCity,
        lodgingName: body.lodgingName,
        checkinTime: body.checkinTime && body.checkinTime !== "" ? new Date(body.checkinTime) : null,
        checkoutTime: body.checkoutTime && body.checkoutTime !== "" ? new Date(body.checkoutTime) : null,
        lodgingAddress: body.lodgingAddress,
        activityName: body.activityName,
        startTime: body.startTime && body.startTime !== "" ? new Date(body.startTime) : null,
        duration: body.duration,
        activityAddress: body.activityAddress,
        activityDescription: body.activityDescription,
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Error creating itinerary item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
