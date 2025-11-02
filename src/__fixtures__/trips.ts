/**
 * Shared test fixtures for Trip-related tests
 * Centralized location to avoid duplication across test files
 */

export const mockTripBasic = {
  id: "trip-123",
  title: "Summer Vacation",
  description: "A fun trip to Europe",
  startDate: "2025-06-01T00:00:00.000Z",
  endDate: "2025-06-15T00:00:00.000Z",
  homeCity: "New York",
  userId: "user-123",
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
}

export const mockDestinations = [
  {
    id: "dest-1",
    city: "Paris",
    daysToStay: 5,
    order: 0,
    tripId: "trip-123",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  },
  {
    id: "dest-2",
    city: "London",
    daysToStay: 3,
    order: 1,
    tripId: "trip-123",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  },
]

export const mockItineraryItems = [
  {
    id: "item-1",
    type: "TRANSPORTATION" as const,
    order: 0,
    tripId: "trip-123",
    transportationType: "flight",
    departCity: "New York",
    arriveCity: "Paris",
    departTime: "2025-06-01T10:00:00.000Z",
    arriveTime: "2025-06-01T22:00:00.000Z",
    description: "AF456 - Check-in 2 hours early",
    cost: 800,
    confirmationEmailLink: null,
    lodgingName: null,
    checkinTime: null,
    checkoutTime: null,
    lodgingAddress: null,
    activityName: null,
    startTime: null,
    duration: null,
    activityAddress: null,
    activityDescription: null,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  },
  {
    id: "item-2",
    type: "TRANSPORTATION" as const,
    order: 1,
    tripId: "trip-123",
    transportationType: "train",
    departCity: "Paris",
    arriveCity: "London",
    departTime: "2025-06-06T09:00:00.000Z",
    arriveTime: "2025-06-06T11:30:00.000Z",
    description: "Eurostar 9012",
    cost: 150,
    confirmationEmailLink: null,
    lodgingName: null,
    checkinTime: null,
    checkoutTime: null,
    lodgingAddress: null,
    activityName: null,
    startTime: null,
    duration: null,
    activityAddress: null,
    activityDescription: null,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  },
]

export const mockTripComplete = {
  ...mockTripBasic,
  destinations: mockDestinations,
  itineraryItems: mockItineraryItems,
}

export const mockUser = {
  id: "user-123",
  name: "Test User",
  email: "test@example.com",
}

export const mockSession = {
  user: mockUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
}
