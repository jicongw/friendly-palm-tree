/**
 * @jest-environment node
 */
import { NextRequest } from "next/server"
import { GET, PATCH, DELETE } from "../route"
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
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    destination: {
      deleteMany: jest.fn(),
    },
  },
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe("/api/trips/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET", () => {
    it("should return a trip with destinations", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const mockTrip = {
        id: "trip-123",
        title: "Summer Vacation",
        description: "A fun trip",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        destinations: [
          {
            id: "dest-1",
            name: "Paris",
            daysToStay: 5,
            order: 0,
            tripId: "trip-123",
            description: null,
            latitude: null,
            longitude: null,
            address: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "GET",
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe("trip-123")
      expect(data.title).toBe("Summer Vacation")
      expect(data.destinations).toHaveLength(1)
      expect(data.destinations[0].name).toBe("Paris")
    })

    it("should return 401 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "GET",
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
      expect(mockPrisma.trip.findUnique).not.toHaveBeenCalled()
    })

    it("should return 404 if trip does not exist", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      mockPrisma.trip.findUnique.mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-999", {
        method: "GET",
      })

      const params = Promise.resolve({ id: "trip-999" })
      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Trip not found")
    })

    it("should return 403 if user does not own the trip", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const mockTrip = {
        id: "trip-123",
        title: "Someone else's trip",
        description: null,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        userId: "other-user",
        createdAt: new Date(),
        updatedAt: new Date(),
        destinations: [],
      }

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "GET",
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Forbidden")
    })
  })

  describe("PATCH", () => {
    it("should update trip title and description", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const existingTrip = {
        id: "trip-123",
        title: "Old Title",
        description: "Old description",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedTrip = {
        ...existingTrip,
        title: "New Title",
        description: "New description",
        destinations: [],
      }

      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)
      mockPrisma.trip.update.mockResolvedValue(updatedTrip)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "PATCH",
        body: JSON.stringify({
          title: "New Title",
          description: "New description",
        }),
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).toBe("New Title")
      expect(data.description).toBe("New description")
    })

    it("should update trip dates", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const existingTrip = {
        id: "trip-123",
        title: "Trip",
        description: null,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedTrip = {
        ...existingTrip,
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-07-20"),
        destinations: [],
      }

      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)
      mockPrisma.trip.update.mockResolvedValue(updatedTrip)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "PATCH",
        body: JSON.stringify({
          startDate: "2025-07-01T00:00:00.000Z",
          endDate: "2025-07-20T00:00:00.000Z",
        }),
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(new Date(data.startDate)).toEqual(new Date("2025-07-01"))
      expect(new Date(data.endDate)).toEqual(new Date("2025-07-20"))
    })

    it("should update trip with destinations", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const existingTrip = {
        id: "trip-123",
        title: "Trip",
        description: null,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedTrip = {
        ...existingTrip,
        destinations: [
          {
            id: "dest-new-1",
            name: "Paris",
            daysToStay: 5,
            order: 0,
            tripId: "trip-123",
            description: null,
            latitude: null,
            longitude: null,
            address: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "dest-new-2",
            name: "London",
            daysToStay: 3,
            order: 1,
            tripId: "trip-123",
            description: null,
            latitude: null,
            longitude: null,
            address: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }

      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)
      mockPrisma.destination.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.trip.update.mockResolvedValue(updatedTrip)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "PATCH",
        body: JSON.stringify({
          destinations: [
            { name: "Paris", daysToStay: 5, order: 0 },
            { name: "London", daysToStay: 3, order: 1 },
          ],
        }),
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.destinations).toHaveLength(2)
      expect(data.destinations[0].name).toBe("Paris")
      expect(data.destinations[1].name).toBe("London")
      expect(mockPrisma.destination.deleteMany).toHaveBeenCalledWith({
        where: { tripId: "trip-123" },
      })
    })

    it("should return 400 if title is empty", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const existingTrip = {
        id: "trip-123",
        title: "Old Title",
        description: null,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "PATCH",
        body: JSON.stringify({
          title: "   ",
        }),
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Title cannot be empty")
      expect(mockPrisma.trip.update).not.toHaveBeenCalled()
    })

    it("should return 400 if start date is after end date", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const existingTrip = {
        id: "trip-123",
        title: "Trip",
        description: null,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "PATCH",
        body: JSON.stringify({
          startDate: "2025-07-20T00:00:00.000Z",
          endDate: "2025-07-01T00:00:00.000Z",
        }),
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Start date must be before end date")
      expect(mockPrisma.trip.update).not.toHaveBeenCalled()
    })

    it("should return 401 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "PATCH",
        body: JSON.stringify({
          title: "New Title",
        }),
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
      expect(mockPrisma.trip.findUnique).not.toHaveBeenCalled()
    })

    it("should return 404 if trip does not exist", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      mockPrisma.trip.findUnique.mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-999", {
        method: "PATCH",
        body: JSON.stringify({
          title: "New Title",
        }),
      })

      const params = Promise.resolve({ id: "trip-999" })
      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Trip not found")
      expect(mockPrisma.trip.update).not.toHaveBeenCalled()
    })

    it("should return 403 if user does not own the trip", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const existingTrip = {
        id: "trip-123",
        title: "Someone else's trip",
        description: null,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        userId: "other-user",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "PATCH",
        body: JSON.stringify({
          title: "New Title",
        }),
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Forbidden")
      expect(mockPrisma.trip.update).not.toHaveBeenCalled()
    })
  })

  describe("DELETE", () => {
    it("should delete a trip", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const existingTrip = {
        id: "trip-123",
        title: "Trip to delete",
        description: null,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)
      mockPrisma.trip.delete.mockResolvedValue(existingTrip)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "DELETE",
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.trip.delete).toHaveBeenCalledWith({
        where: { id: "trip-123" },
      })
    })

    it("should return 401 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "DELETE",
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
      expect(mockPrisma.trip.delete).not.toHaveBeenCalled()
    })

    it("should return 404 if trip does not exist", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      mockPrisma.trip.findUnique.mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-999", {
        method: "DELETE",
      })

      const params = Promise.resolve({ id: "trip-999" })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Trip not found")
      expect(mockPrisma.trip.delete).not.toHaveBeenCalled()
    })

    it("should return 403 if user does not own the trip", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const existingTrip = {
        id: "trip-123",
        title: "Someone else's trip",
        description: null,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        userId: "other-user",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "DELETE",
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("Forbidden")
      expect(mockPrisma.trip.delete).not.toHaveBeenCalled()
    })

    it("should return 500 if database error occurs", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-123", name: "Test User", email: "test@example.com" },
        expires: new Date().toISOString(),
      })

      const existingTrip = {
        id: "trip-123",
        title: "Trip",
        description: null,
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        userId: "user-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.trip.findUnique.mockResolvedValue(existingTrip)
      mockPrisma.trip.delete.mockRejectedValue(new Error("Database error"))

      const request = new NextRequest("http://localhost:3000/api/trips/trip-123", {
        method: "DELETE",
      })

      const params = Promise.resolve({ id: "trip-123" })
      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Internal server error")
    })
  })
})
