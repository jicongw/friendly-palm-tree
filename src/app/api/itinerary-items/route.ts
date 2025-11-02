import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { ItineraryType } from "@prisma/client"

interface CreateItineraryItemRequest {
  tripId: string
  type: ItineraryType
  order?: number

  // Common fields
  description?: string
  confirmationEmailLink?: string
  cost?: number

  // Transportation fields
  transportationType?: string
  departTime?: string
  arriveTime?: string
  departCity?: string
  arriveCity?: string

  // Lodging fields
  lodgingName?: string
  checkinTime?: string
  checkoutTime?: string
  lodgingAddress?: string

  // Activity fields
  activityName?: string
  startTime?: string
  duration?: number
  activityAddress?: string
  activityDescription?: string
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

    const body = await request.json() as CreateItineraryItemRequest

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
        departTime: body.departTime ? new Date(body.departTime) : null,
        arriveTime: body.arriveTime ? new Date(body.arriveTime) : null,
        departCity: body.departCity,
        arriveCity: body.arriveCity,
        lodgingName: body.lodgingName,
        checkinTime: body.checkinTime ? new Date(body.checkinTime) : null,
        checkoutTime: body.checkoutTime ? new Date(body.checkoutTime) : null,
        lodgingAddress: body.lodgingAddress,
        activityName: body.activityName,
        startTime: body.startTime ? new Date(body.startTime) : null,
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
