import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, startDate, endDate, destinations } = body

    // Validate required fields
    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create trip with destinations
    const trip = await prisma.trip.create({
      data: {
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId: session.user.id,
        destinations: {
          create: destinations?.map((dest: any, index: number) => ({
            name: dest.name,
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
