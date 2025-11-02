/**
 * @jest-environment node
 */
import { PATCH, DELETE } from '../route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ItineraryType } from '@prisma/client'

// Mock the auth module
jest.mock('@/lib/auth')
const mockAuth = auth as jest.MockedFunction<typeof auth>

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    itineraryItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

describe('PATCH /api/itinerary-items/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/itinerary-items/item-123', {
      method: 'PATCH',
      body: JSON.stringify({ cost: 100 }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'item-123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 404 if item does not exist', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.itineraryItem.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/itinerary-items/non-existent', {
      method: 'PATCH',
      body: JSON.stringify({ cost: 100 }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'non-existent' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Itinerary item not found')
  })

  it('should return 403 if user does not own the trip', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.itineraryItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-123',
      tripId: 'trip-123',
      trip: { userId: 'different-user' },
    })

    const request = new Request('http://localhost:3000/api/itinerary-items/item-123', {
      method: 'PATCH',
      body: JSON.stringify({ cost: 100 }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'item-123' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('should update itinerary item successfully', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.itineraryItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-123',
      tripId: 'trip-123',
      type: ItineraryType.ACTIVITY,
      activityName: 'Visit Museum',
      cost: 25,
      trip: { userId: 'user-123' },
    })

    const mockUpdatedItem = {
      id: 'item-123',
      tripId: 'trip-123',
      type: ItineraryType.ACTIVITY,
      activityName: 'Visit Museum',
      cost: 30,
      description: 'Updated description',
    }

    ;(prisma.itineraryItem.update as jest.Mock).mockResolvedValue(mockUpdatedItem)

    const request = new Request('http://localhost:3000/api/itinerary-items/item-123', {
      method: 'PATCH',
      body: JSON.stringify({
        cost: 30,
        description: 'Updated description',
      }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'item-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.cost).toBe(30)
    expect(data.description).toBe('Updated description')
  })

  it('should update activity-specific fields', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.itineraryItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-123',
      type: ItineraryType.ACTIVITY,
      trip: { userId: 'user-123' },
    })

    const mockUpdatedItem = {
      id: 'item-123',
      type: ItineraryType.ACTIVITY,
      activityName: 'Updated Activity',
      duration: 180,
      activityAddress: 'New Address',
    }

    ;(prisma.itineraryItem.update as jest.Mock).mockResolvedValue(mockUpdatedItem)

    const request = new Request('http://localhost:3000/api/itinerary-items/item-123', {
      method: 'PATCH',
      body: JSON.stringify({
        activityName: 'Updated Activity',
        duration: 180,
        activityAddress: 'New Address',
      }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'item-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.activityName).toBe('Updated Activity')
    expect(data.duration).toBe(180)
  })
})

describe('DELETE /api/itinerary-items/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/itinerary-items/item-123', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: 'item-123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 404 if item does not exist', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.itineraryItem.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/itinerary-items/non-existent', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: 'non-existent' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Itinerary item not found')
  })

  it('should return 403 if user does not own the trip', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.itineraryItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-123',
      trip: { userId: 'different-user' },
    })

    const request = new Request('http://localhost:3000/api/itinerary-items/item-123', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: 'item-123' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('should delete itinerary item successfully', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.itineraryItem.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-123',
      trip: { userId: 'user-123' },
    })

    ;(prisma.itineraryItem.delete as jest.Mock).mockResolvedValue({
      id: 'item-123',
    })

    const request = new Request('http://localhost:3000/api/itinerary-items/item-123', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: 'item-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.itineraryItem.delete).toHaveBeenCalledWith({
      where: { id: 'item-123' },
    })
  })
})
