import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

interface UpdateItineraryItemRequest {
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if item exists and user owns the associated trip
    const existingItem = await prisma.itineraryItem.findUnique({
      where: { id },
      include: { trip: true }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "Itinerary item not found" },
        { status: 404 }
      )
    }

    if (existingItem.trip.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const body = await request.json() as UpdateItineraryItemRequest

    // Update itinerary item
    const item = await prisma.itineraryItem.update({
      where: { id },
      data: {
        description: body.description,
        confirmationEmailLink: body.confirmationEmailLink,
        cost: body.cost,
        transportationType: body.transportationType,
        departTime: body.departTime ? new Date(body.departTime) : undefined,
        arriveTime: body.arriveTime ? new Date(body.arriveTime) : undefined,
        departCity: body.departCity,
        arriveCity: body.arriveCity,
        lodgingName: body.lodgingName,
        checkinTime: body.checkinTime ? new Date(body.checkinTime) : undefined,
        checkoutTime: body.checkoutTime ? new Date(body.checkoutTime) : undefined,
        lodgingAddress: body.lodgingAddress,
        activityName: body.activityName,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        duration: body.duration,
        activityAddress: body.activityAddress,
        activityDescription: body.activityDescription,
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error updating itinerary item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if item exists and user owns the associated trip
    const existingItem = await prisma.itineraryItem.findUnique({
      where: { id },
      include: { trip: true }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "Itinerary item not found" },
        { status: 404 }
      )
    }

    if (existingItem.trip.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    await prisma.itineraryItem.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting itinerary item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
