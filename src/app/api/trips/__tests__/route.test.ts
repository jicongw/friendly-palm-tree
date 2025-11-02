/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { POST, GET } from "../route"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Mock the auth module
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}))

// Mock the prisma module
jest.mock("@/lib/db", () => ({
  prisma: {
    trip: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe("/api/trips", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("POST", () => {
    it("should create a trip with destinations", async () => {
      // Mock authenticated session
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      // Mock trip creation
      const mockTrip = {
        id: "trip-123",
        title: "Summer Vacation",
        description: "A fun trip",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        homeCity: "New York",
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        destinations: [
          {
            id: "dest-1",
            city: "Paris",
            daysToStay: 5,
            order: 0,
            tripId: "trip-123",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "dest-2",
            city: "London",
            daysToStay: 3,
            order: 1,
            tripId: "trip-123",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        itineraryItems: [],
      }

      mockPrisma.trip.create.mockResolvedValue(mockTrip)

      // Create request
      const requestBody = {
        title: "Summer Vacation",
        description: "A fun trip",
        startDate: "2025-06-01T00:00:00.000Z",
        endDate: "2025-06-15T00:00:00.000Z",
        homeCity: "New York",
        destinations: [
          { city: "Paris", daysToStay: 5 },
          { city: "London", daysToStay: 3 },
        ],
      }

      const request = new NextRequest("http://localhost:3000/api/trips", {
        method: "POST",
        body: JSON.stringify(requestBody),
      })

      // Call the handler
      const response = await POST(request)
      const data = await response.json()

      // Assertions
      expect(response.status).toBe(201)
      expect(data.title).toBe("Summer Vacation")
      expect(data.homeCity).toBe("New York")
      expect(data.destinations).toHaveLength(2)
      expect(data.destinations[0].city).toBe("Paris")
      expect(data.destinations[0].daysToStay).toBe(5)
      expect(data.destinations[1].city).toBe("London")
      expect(data.destinations[1].daysToStay).toBe(3)

      // Verify prisma was called correctly
      expect(mockPrisma.trip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Summer Vacation",
            description: "A fun trip",
            startDate: new Date("2025-06-01T00:00:00.000Z"),
            endDate: new Date("2025-06-15T00:00:00.000Z"),
            homeCity: "New York",
            userId: "user-123",
            destinations: {
              create: [
                { city: "Paris", daysToStay: 5, order: 0 },
                { city: "London", daysToStay: 3, order: 1 },
              ],
            },
          }),
          include: expect.objectContaining({
            destinations: {
              orderBy: {
                order: "asc",
              },
            },
          }),
        })
      )
    })

    it("should return 400 if destinations array is empty", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const requestBody = {
        title: "Quick Trip",
        startDate: "2025-07-01T00:00:00.000Z",
        endDate: "2025-07-05T00:00:00.000Z",
        homeCity: "New York",
        destinations: [],
      }

      const request = new NextRequest("http://localhost:3000/api/trips", {
        method: "POST",
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid request data")
    })

    it("should return 401 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null)

      const requestBody = {
        title: "Unauthorized Trip",
        startDate: "2025-06-01T00:00:00.000Z",
        endDate: "2025-06-15T00:00:00.000Z",
        homeCity: "New York",
        destinations: [
          { city: "Paris", daysToStay: 5 },
        ],
      }

      const request = new NextRequest("http://localhost:3000/api/trips", {
        method: "POST",
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
      expect(mockPrisma.trip.create).not.toHaveBeenCalled()
    })

    it("should return 400 if required fields are missing", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const requestBody = {
        // Missing title
        startDate: "2025-06-01T00:00:00.000Z",
        endDate: "2025-06-15T00:00:00.000Z",
        homeCity: "New York",
        destinations: [
          { city: "Paris", daysToStay: 5 },
        ],
      }

      const request = new NextRequest("http://localhost:3000/api/trips", {
        method: "POST",
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Invalid request data")
      expect(mockPrisma.trip.create).not.toHaveBeenCalled()
    })

    it("should return 500 if database error occurs", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      mockPrisma.trip.create.mockRejectedValue(new Error("Database error"))

      const requestBody = {
        title: "Error Trip",
        startDate: "2025-06-01T00:00:00.000Z",
        endDate: "2025-06-15T00:00:00.000Z",
        homeCity: "New York",
        destinations: [
          { city: "Paris", daysToStay: 5 },
        ],
      }

      const request = new NextRequest("http://localhost:3000/api/trips", {
        method: "POST",
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Internal server error")
    })
  })

  describe("GET", () => {
    it("should return all trips for authenticated user", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const mockTrips = [
        {
          id: "trip-1",
          title: "Trip 1",
          description: "First trip",
          startDate: new Date("2025-06-01"),
          endDate: new Date("2025-06-10"),
          homeCity: "New York",
          userId: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          destinations: [
            {
              id: "dest-1",
              city: "Paris",
              daysToStay: 5,
              order: 0,
              tripId: "trip-1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          itineraryItems: [],
        },
        {
          id: "trip-2",
          title: "Trip 2",
          description: null,
          startDate: new Date("2025-07-01"),
          endDate: new Date("2025-07-15"),
          homeCity: "Los Angeles",
          userId: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
          destinations: [
            {
              id: "dest-2",
              city: "Tokyo",
              daysToStay: 7,
              order: 0,
              tripId: "trip-2",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          itineraryItems: [],
        },
      ]

      mockPrisma.trip.findMany.mockResolvedValue(mockTrips)

      const request = new NextRequest("http://localhost:3000/api/trips", {
        method: "GET",
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      expect(data[0].title).toBe("Trip 1")
      expect(data[1].title).toBe("Trip 2")

      expect(mockPrisma.trip.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-123",
        },
        include: {
          destinations: {
            orderBy: {
              order: "asc",
            },
          },
          itineraryItems: {
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      })
    })

    it("should return 401 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/trips", {
        method: "GET",
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
      expect(mockPrisma.trip.findMany).not.toHaveBeenCalled()
    })

    it("should return empty array if user has no trips", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      mockPrisma.trip.findMany.mockResolvedValue([])

      const request = new NextRequest("http://localhost:3000/api/trips", {
        method: "GET",
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(0)
    })

    it("should return 500 if database error occurs", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      mockPrisma.trip.findMany.mockRejectedValue(new Error("Database error"))

      const request = new NextRequest("http://localhost:3000/api/trips", {
        method: "GET",
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Internal server error")
    })
  })
})
