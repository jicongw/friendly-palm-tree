import { addDays, setHours } from "date-fns"
import { ItineraryType } from "@prisma/client"

export interface DestinationInput {
  city: string
  daysToStay: number | null // null for last destination (return)
}

export interface ItineraryItemInput {
  type: ItineraryType
  order: number

  // Common fields
  description?: string
  confirmationEmailLink?: string
  cost?: number

  // Transportation fields
  transportationType?: string
  departTime?: Date
  arriveTime?: Date
  departCity?: string
  arriveCity?: string

  // Lodging fields
  lodgingName?: string
  checkinTime?: Date
  checkoutTime?: Date
  lodgingAddress?: string

  // Activity fields
  activityName?: string
  startTime?: Date
  duration?: number
  activityAddress?: string
  activityDescription?: string
}

/**
 * Generate itinerary items (transportation and lodging) for a trip
 *
 * @param homeCity - The starting/ending city
 * @param destinations - List of destination cities with duration
 * @param startDate - Trip start date
 * @param endDate - Trip end date
 * @returns Array of itinerary items to create
 */
export function generateItineraryItems(
  homeCity: string,
  destinations: DestinationInput[],
  startDate: Date,
  endDate: Date
): ItineraryItemInput[] {
  const items: ItineraryItemInput[] = []
  let orderCounter = 0
  let currentDate = new Date(startDate)

  // Generate transportation and lodging for each destination
  destinations.forEach((destination, index) => {
    const isFirstDestination = index === 0
    const isLastDestination = index === destinations.length - 1
    const departCity = isFirstDestination ? homeCity : destinations[index - 1].city

    // Add transportation TO this destination
    const departureTime = setHours(currentDate, 8) // Default 8 AM departure
    const arrivalTime = setHours(currentDate, 12) // Default 12 PM arrival

    items.push({
      type: ItineraryType.TRANSPORTATION,
      order: orderCounter++,
      transportationType: "flight",
      departCity: departCity,
      arriveCity: destination.city,
      departTime: departureTime,
      arriveTime: arrivalTime,
      description: `Transportation from ${departCity} to ${destination.city}`,
    })

    // Add lodging if not the last destination
    if (!isLastDestination && destination.daysToStay) {
      const checkinDate = new Date(currentDate)
      const checkoutDate = addDays(currentDate, destination.daysToStay)

      items.push({
        type: ItineraryType.LODGING,
        order: orderCounter++,
        lodgingName: `Hotel in ${destination.city}`,
        checkinTime: setHours(checkinDate, 15), // 3 PM check-in
        checkoutTime: setHours(checkoutDate, 11), // 11 AM check-out
        lodgingAddress: destination.city,
        description: `Accommodation in ${destination.city}`,
      })

      // Move to next destination date (overlap day)
      currentDate = checkoutDate
    }
  })

  // Add return transportation from last destination to home
  if (destinations.length > 0) {
    const lastDestination = destinations[destinations.length - 1]
    const returnDepartTime = setHours(endDate, 10) // 10 AM departure
    const returnArriveTime = setHours(endDate, 14) // 2 PM arrival

    items.push({
      type: ItineraryType.TRANSPORTATION,
      order: orderCounter++,
      transportationType: "flight",
      departCity: lastDestination.city,
      arriveCity: homeCity,
      departTime: returnDepartTime,
      arriveTime: returnArriveTime,
      description: `Return transportation from ${lastDestination.city} to ${homeCity}`,
    })
  }

  return items
}

/**
 * Generate a default name for a lodging
 */
export function generateLodgingName(city: string): string {
  const prefixes = ["Grand", "Central", "Royal", "Plaza", "Downtown", "Luxury"]
  const suffixes = ["Hotel", "Inn", "Suites", "Resort"]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
  return `${prefix} ${city} ${suffix}`
}

/**
 * Generate a default name for an activity
 */
export function generateActivityName(): string {
  const activities = [
    "City Tour",
    "Museum Visit",
    "Local Restaurant",
    "Shopping District",
    "Cultural Experience",
    "Sightseeing",
    "Guided Tour",
    "Local Cuisine Tasting"
  ]
  return activities[Math.floor(Math.random() * activities.length)]
}
