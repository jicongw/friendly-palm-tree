/**
 * @jest-environment node
 */
import { POST } from '../route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ItineraryType } from '@prisma/client'

// Mock the auth module
jest.mock('@/lib/auth')
const mockAuth = auth as jest.MockedFunction<typeof auth>

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    trip: {
      findUnique: jest.fn(),
    },
    itineraryItem: {
      create: jest.fn(),
    },
  },
}))

describe('POST /api/itinerary-items', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/itinerary-items', {
      method: 'POST',
      body: JSON.stringify({
        tripId: 'trip-123',
        type: ItineraryType.ACTIVITY,
        activityName: 'Test Activity',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 404 if trip does not exist', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/itinerary-items', {
      method: 'POST',
      body: JSON.stringify({
        tripId: 'non-existent-trip',
        type: ItineraryType.ACTIVITY,
        activityName: 'Test Activity',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Trip not found')
  })

  it('should return 403 if user does not own the trip', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 'trip-123',
      userId: 'different-user',
      itineraryItems: [],
    })

    const request = new Request('http://localhost:3000/api/itinerary-items', {
      method: 'POST',
      body: JSON.stringify({
        tripId: 'trip-123',
        type: ItineraryType.ACTIVITY,
        activityName: 'Test Activity',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('should create an activity itinerary item successfully', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 'trip-123',
      userId: 'user-123',
      itineraryItems: [],
    })

    const mockCreatedItem = {
      id: 'item-123',
      tripId: 'trip-123',
      type: ItineraryType.ACTIVITY,
      order: 0,
      activityName: 'Visit Museum',
      startTime: new Date('2025-01-15T10:00:00Z'),
      duration: 120,
      activityAddress: '123 Museum St',
      activityDescription: 'Art museum visit',
      cost: 25.50,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    ;(prisma.itineraryItem.create as jest.Mock).mockResolvedValue(mockCreatedItem)

    const request = new Request('http://localhost:3000/api/itinerary-items', {
      method: 'POST',
      body: JSON.stringify({
        tripId: 'trip-123',
        type: ItineraryType.ACTIVITY,
        activityName: 'Visit Museum',
        startTime: '2025-01-15T10:00:00Z',
        duration: 120,
        activityAddress: '123 Museum St',
        activityDescription: 'Art museum visit',
        cost: 25.50,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.id).toBe('item-123')
    expect(data.activityName).toBe('Visit Museum')
    expect(data.cost).toBe(25.50)
  })

  it('should create a transportation itinerary item successfully', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 'trip-123',
      userId: 'user-123',
      itineraryItems: [{ id: 'existing-1' }],
    })

    const mockCreatedItem = {
      id: 'item-456',
      tripId: 'trip-123',
      type: ItineraryType.TRANSPORTATION,
      order: 1,
      transportationType: 'train',
      departCity: 'Tokyo',
      arriveCity: 'Kyoto',
      departTime: new Date('2025-01-15T08:00:00Z'),
      arriveTime: new Date('2025-01-15T10:30:00Z'),
      cost: 150,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    ;(prisma.itineraryItem.create as jest.Mock).mockResolvedValue(mockCreatedItem)

    const request = new Request('http://localhost:3000/api/itinerary-items', {
      method: 'POST',
      body: JSON.stringify({
        tripId: 'trip-123',
        type: ItineraryType.TRANSPORTATION,
        transportationType: 'train',
        departCity: 'Tokyo',
        arriveCity: 'Kyoto',
        departTime: '2025-01-15T08:00:00Z',
        arriveTime: '2025-01-15T10:30:00Z',
        cost: 150,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.type).toBe(ItineraryType.TRANSPORTATION)
    expect(data.transportationType).toBe('train')
    expect(data.departCity).toBe('Tokyo')
    expect(data.arriveCity).toBe('Kyoto')
  })

  it('should create a lodging itinerary item successfully', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 'trip-123',
      userId: 'user-123',
      itineraryItems: [],
    })

    const mockCreatedItem = {
      id: 'item-789',
      tripId: 'trip-123',
      type: ItineraryType.LODGING,
      order: 0,
      lodgingName: 'Grand Tokyo Hotel',
      lodgingAddress: '456 Tokyo St',
      checkinTime: new Date('2025-01-15T15:00:00Z'),
      checkoutTime: new Date('2025-01-18T11:00:00Z'),
      cost: 450,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    ;(prisma.itineraryItem.create as jest.Mock).mockResolvedValue(mockCreatedItem)

    const request = new Request('http://localhost:3000/api/itinerary-items', {
      method: 'POST',
      body: JSON.stringify({
        tripId: 'trip-123',
        type: ItineraryType.LODGING,
        lodgingName: 'Grand Tokyo Hotel',
        lodgingAddress: '456 Tokyo St',
        checkinTime: '2025-01-15T15:00:00Z',
        checkoutTime: '2025-01-18T11:00:00Z',
        cost: 450,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.type).toBe(ItineraryType.LODGING)
    expect(data.lodgingName).toBe('Grand Tokyo Hotel')
    expect(data.cost).toBe(450)
  })

  it('should set order to end of list if not specified', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    const existingItems = [
      { id: 'item-1' },
      { id: 'item-2' },
      { id: 'item-3' },
    ]

    ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 'trip-123',
      userId: 'user-123',
      itineraryItems: existingItems,
    })

    const mockCreatedItem = {
      id: 'item-new',
      tripId: 'trip-123',
      type: ItineraryType.ACTIVITY,
      order: 3, // Should be length of existing items
      activityName: 'New Activity',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    ;(prisma.itineraryItem.create as jest.Mock).mockResolvedValue(mockCreatedItem)

    const request = new Request('http://localhost:3000/api/itinerary-items', {
      method: 'POST',
      body: JSON.stringify({
        tripId: 'trip-123',
        type: ItineraryType.ACTIVITY,
        activityName: 'New Activity',
        // No order specified
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.order).toBe(3)

    // Verify create was called with correct order
    expect(prisma.itineraryItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          order: 3,
        }),
      })
    )
  })

  it('should use specified order when provided', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      expires: new Date().toISOString(),
    })

    ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 'trip-123',
      userId: 'user-123',
      itineraryItems: [{ id: 'item-1' }],
    })

    const mockCreatedItem = {
      id: 'item-new',
      tripId: 'trip-123',
      type: ItineraryType.ACTIVITY,
      order: 5,
      activityName: 'New Activity',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    ;(prisma.itineraryItem.create as jest.Mock).mockResolvedValue(mockCreatedItem)

    const request = new Request('http://localhost:3000/api/itinerary-items', {
      method: 'POST',
      body: JSON.stringify({
        tripId: 'trip-123',
        type: ItineraryType.ACTIVITY,
        activityName: 'New Activity',
        order: 5,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.order).toBe(5)
  })
})
