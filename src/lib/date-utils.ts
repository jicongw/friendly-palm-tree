import { addDays, format } from "date-fns"

export interface DestinationWithDates {
  id: string
  name: string
  daysToStay: number
  order: number
  startDate: Date
  endDate: Date
  transportationNotes?: string | null
  transportationType?: string | null
  transportationDetails?: string | null
}

/**
 * Calculate start and end dates for each destination based on trip start date and order
 */
export function calculateDestinationDates(
  tripStartDate: Date,
  destinations: Array<{
    id: string
    name: string
    daysToStay: number
    order: number
    transportationNotes?: string | null
    transportationType?: string | null
    transportationDetails?: string | null
  }>
): DestinationWithDates[] {
  // Sort destinations by order
  const sortedDestinations = [...destinations].sort((a, b) => a.order - b.order)

  let currentDate = new Date(tripStartDate)

  return sortedDestinations.map((destination) => {
    const startDate = new Date(currentDate)
    // End date is start date + (daysToStay - 1) days
    // Example: If staying 3 days starting June 1, you're there June 1, 2, 3 (end date is June 3)
    const endDate = addDays(startDate, destination.daysToStay - 1)

    // Move current date to the day after this destination ends
    currentDate = addDays(endDate, 1)

    return {
      ...destination,
      startDate,
      endDate,
    }
  })
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const start = format(startDate, "MMM d")
  const end = format(endDate, "MMM d, yyyy")

  // If same month, show: "Jun 1-5, 2025"
  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    return `${start}-${format(endDate, "d, yyyy")}`
  }

  // If different months: "Jun 28 - Jul 5, 2025"
  return `${start} - ${end}`
}

/**
 * Calculate the number of days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Include both start and end day
}
