import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

interface DestinationInput {
  name: string
  daysToStay?: number
  order?: number
}

interface CreateTripRequest {
  title: string
  description?: string
  startDate: string
  endDate: string
  destinations?: DestinationInput[]
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
    const { title, description, startDate, endDate, destinations } = body

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Create trip with destinations
    const trip = await prisma.trip.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        startDate: start,
        endDate: end,
        userId: session.user.id,
        destinations: {
          create: destinations?.map((dest: DestinationInput, index: number) => ({
            name: dest.name.trim(),
            daysToStay: dest.daysToStay || 1,
            order: dest.order ?? index,
          })) || []
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
