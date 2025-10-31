import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

interface DestinationInput {
  id?: string
  name: string
  daysToStay?: number
  order?: number
}

interface UpdateTripRequest {
  title?: string
  description?: string
  startDate?: string
  endDate?: string
  destinations?: DestinationInput[]
}

export async function GET(
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

    const trip = await prisma.trip.findUnique({
      where: {
        id,
      },
      include: {
        destinations: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    // Ensure user owns this trip
    if (trip.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error("Error fetching trip:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
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

    // Check if trip exists and user owns it
    const existingTrip = await prisma.trip.findUnique({
      where: { id }
    })

    if (!existingTrip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    if (existingTrip.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const body = await request.json() as UpdateTripRequest
    const { title, description, startDate, endDate, destinations } = body

    // Validate title if provided
    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 }
        )
      }
    }

    // Validate dates if provided
    let start: Date | undefined
    let end: Date | undefined

    if (startDate) {
      start = new Date(startDate)
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date format" },
          { status: 400 }
        )
      }
    }

    if (endDate) {
      end = new Date(endDate)
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date format" },
          { status: 400 }
        )
      }
    }

    // Validate date range
    const finalStart = start || existingTrip.startDate
    const finalEnd = end || existingTrip.endDate

    if (finalStart > finalEnd) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      )
    }

    // Validate destinations if provided
    if (destinations && destinations.length > 0) {
      const hasEmptyName = destinations.some(d => !d.name?.trim())
      if (hasEmptyName) {
        return NextResponse.json(
          { error: "Destination names cannot be empty" },
          { status: 400 }
        )
      }

      const hasInvalidDays = destinations.some(d => d.daysToStay !== undefined && d.daysToStay < 1)
      if (hasInvalidDays) {
        return NextResponse.json(
          { error: "Days to stay must be at least 1" },
          { status: 400 }
        )
      }
    }

    // Update trip
    const updateData: {
      title?: string
      description?: string | null
      startDate?: Date
      endDate?: Date
    } = {}

    if (title !== undefined) {
      updateData.title = title.trim()
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }
    if (start) {
      updateData.startDate = start
    }
    if (end) {
      updateData.endDate = end
    }

    // Handle destinations update if provided
    if (destinations !== undefined) {
      // Delete all existing destinations and create new ones
      // This is simpler than trying to update/delete/create individually
      await prisma.destination.deleteMany({
        where: { tripId: id }
      })

      const trip = await prisma.trip.update({
        where: { id },
        data: {
          ...updateData,
          destinations: {
            create: destinations.map((dest: DestinationInput, index: number) => ({
              name: dest.name.trim(),
              daysToStay: dest.daysToStay || 1,
              order: dest.order ?? index,
            }))
          }
        },
        include: {
          destinations: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      })

      return NextResponse.json(trip)
    } else {
      // Just update trip fields without touching destinations
      const trip = await prisma.trip.update({
        where: { id },
        data: updateData,
        include: {
          destinations: {
            orderBy: {
              order: 'asc'
            }
          }
        }
      })

      return NextResponse.json(trip)
    }
  } catch (error) {
    console.error("Error updating trip:", error)
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

    // Check if trip exists and user owns it
    const existingTrip = await prisma.trip.findUnique({
      where: { id }
    })

    if (!existingTrip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      )
    }

    if (existingTrip.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Delete trip (destinations will be cascade deleted)
    await prisma.trip.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting trip:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
