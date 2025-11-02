import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const UpdateItineraryItemSchema = z.object({
  description: z.string().max(5000).optional(),
  confirmationEmailLink: z.string().url().max(2000).optional().nullable().or(z.literal("")),
  cost: z.number().min(0).optional().nullable(),

  // Transportation fields
  transportationType: z.enum(["flight", "train", "bus", "car", "ferry", "other"]).optional().nullable(),
  departTime: z.string().datetime().optional().nullable(),
  arriveTime: z.string().datetime().optional().nullable(),
  departCity: z.string().max(100).optional().nullable(),
  arriveCity: z.string().max(100).optional().nullable(),

  // Lodging fields
  lodgingName: z.string().max(200).optional().nullable(),
  checkinTime: z.string().datetime().optional().nullable(),
  checkoutTime: z.string().datetime().optional().nullable(),
  lodgingAddress: z.string().max(500).optional().nullable(),

  // Activity fields
  activityName: z.string().max(200).optional().nullable(),
  startTime: z.string().datetime().optional().nullable(),
  duration: z.number().min(0).max(1440).optional().nullable(), // Max 1440 minutes (24 hours)
  activityAddress: z.string().max(500).optional().nullable(),
  activityDescription: z.string().max(5000).optional().nullable(),
}).strict() // Reject unknown fields

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

    const rawBody = await request.json()

    // Validate request body
    const validationResult = UpdateItineraryItemSchema.safeParse(rawBody)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const body = validationResult.data

    // Validate dates if provided
    const dates = [
      body.departTime,
      body.arriveTime,
      body.checkinTime,
      body.checkoutTime,
      body.startTime
    ].filter(Boolean)

    for (const dateStr of dates) {
      const date = new Date(dateStr as string)
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        )
      }
    }

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
