import { calculateDestinationDates, formatDateRange, getDaysBetween } from '../date-utils'

describe('date-utils', () => {
  describe('calculateDestinationDates', () => {
    it('should calculate dates for a single destination', () => {
      const tripStartDate = new Date(2025, 5, 1) // June 1, 2025
      const destinations = [
        { id: '1', name: 'Paris', daysToStay: 3, order: 0 }
      ]

      const result = calculateDestinationDates(tripStartDate, destinations)

      expect(result).toHaveLength(1)
      expect(result[0].startDate).toEqual(new Date(2025, 5, 1))
      expect(result[0].endDate).toEqual(new Date(2025, 5, 3))
    })

    it('should calculate dates for multiple destinations in order', () => {
      const tripStartDate = new Date(2025, 5, 1) // June 1, 2025
      const destinations = [
        { id: '1', name: 'Paris', daysToStay: 3, order: 0 },
        { id: '2', name: 'Rome', daysToStay: 4, order: 1 },
        { id: '3', name: 'Barcelona', daysToStay: 2, order: 2 }
      ]

      const result = calculateDestinationDates(tripStartDate, destinations)

      expect(result).toHaveLength(3)

      // Paris: June 1-3
      expect(result[0].startDate).toEqual(new Date(2025, 5, 1))
      expect(result[0].endDate).toEqual(new Date(2025, 5, 3))

      // Rome: June 4-7
      expect(result[1].startDate).toEqual(new Date(2025, 5, 4))
      expect(result[1].endDate).toEqual(new Date(2025, 5, 7))

      // Barcelona: June 8-9
      expect(result[2].startDate).toEqual(new Date(2025, 5, 8))
      expect(result[2].endDate).toEqual(new Date(2025, 5, 9))
    })

    it('should handle single day stays correctly', () => {
      const tripStartDate = new Date(2025, 5, 1) // June 1, 2025
      const destinations = [
        { id: '1', name: 'Paris', daysToStay: 1, order: 0 },
        { id: '2', name: 'Rome', daysToStay: 1, order: 1 }
      ]

      const result = calculateDestinationDates(tripStartDate, destinations)

      // Paris: June 1 only
      expect(result[0].startDate).toEqual(new Date(2025, 5, 1))
      expect(result[0].endDate).toEqual(new Date(2025, 5, 1))

      // Rome: June 2 only
      expect(result[1].startDate).toEqual(new Date(2025, 5, 2))
      expect(result[1].endDate).toEqual(new Date(2025, 5, 2))
    })

    it('should sort destinations by order before calculating', () => {
      const tripStartDate = new Date(2025, 5, 1) // June 1, 2025
      const destinations = [
        { id: '2', name: 'Rome', daysToStay: 2, order: 1 },
        { id: '1', name: 'Paris', daysToStay: 3, order: 0 },
        { id: '3', name: 'Barcelona', daysToStay: 2, order: 2 }
      ]

      const result = calculateDestinationDates(tripStartDate, destinations)

      // Should be sorted by order
      expect(result[0].name).toBe('Paris')
      expect(result[1].name).toBe('Rome')
      expect(result[2].name).toBe('Barcelona')

      // Dates should be calculated in correct order
      expect(result[0].startDate).toEqual(new Date(2025, 5, 1))
      expect(result[1].startDate).toEqual(new Date(2025, 5, 4))
      expect(result[2].startDate).toEqual(new Date(2025, 5, 6))
    })

    it('should preserve transportation details in result', () => {
      const tripStartDate = new Date(2025, 5, 1) // June 1, 2025
      const destinations = [
        {
          id: '1',
          name: 'Paris',
          daysToStay: 3,
          order: 0,
          transportationType: 'flight',
          transportationDetails: 'AA123',
          transportationNotes: 'Departs 10am'
        }
      ]

      const result = calculateDestinationDates(tripStartDate, destinations)

      expect(result[0].transportationType).toBe('flight')
      expect(result[0].transportationDetails).toBe('AA123')
      expect(result[0].transportationNotes).toBe('Departs 10am')
    })
  })

  describe('formatDateRange', () => {
    it('should format same month date range correctly', () => {
      const startDate = new Date(2025, 5, 1) // June 1, 2025
      const endDate = new Date(2025, 5, 5) // June 5, 2025

      const result = formatDateRange(startDate, endDate)

      expect(result).toBe('Jun 1-5, 2025')
    })

    it('should format different month date range correctly', () => {
      const startDate = new Date(2025, 5, 28) // June 28, 2025
      const endDate = new Date(2025, 6, 5) // July 5, 2025

      const result = formatDateRange(startDate, endDate)

      expect(result).toBe('Jun 28 - Jul 5, 2025')
    })

    it('should format single day correctly', () => {
      const startDate = new Date(2025, 5, 1) // June 1, 2025
      const endDate = new Date(2025, 5, 1) // June 1, 2025

      const result = formatDateRange(startDate, endDate)

      expect(result).toBe('Jun 1-1, 2025')
    })

    it('should handle year boundary correctly', () => {
      const startDate = new Date(2025, 11, 28) // December 28, 2025
      const endDate = new Date(2026, 0, 5) // January 5, 2026

      const result = formatDateRange(startDate, endDate)

      expect(result).toBe('Dec 28 - Jan 5, 2026')
    })
  })

  describe('getDaysBetween', () => {
    it('should calculate days between two dates correctly', () => {
      const startDate = new Date(2025, 5, 1) // June 1, 2025
      const endDate = new Date(2025, 5, 5) // June 5, 2025

      const result = getDaysBetween(startDate, endDate)

      expect(result).toBe(5) // June 1, 2, 3, 4, 5 = 5 days
    })

    it('should return 1 for same date', () => {
      const date = new Date(2025, 5, 1) // June 1, 2025

      const result = getDaysBetween(date, date)

      expect(result).toBe(1)
    })

    it('should handle dates in reverse order', () => {
      const startDate = new Date(2025, 5, 5) // June 5, 2025
      const endDate = new Date(2025, 5, 1) // June 1, 2025

      const result = getDaysBetween(startDate, endDate)

      expect(result).toBe(5)
    })

    it('should calculate across months correctly', () => {
      const startDate = new Date(2025, 4, 28) // May 28, 2025
      const endDate = new Date(2025, 5, 3) // June 3, 2025

      const result = getDaysBetween(startDate, endDate)

      expect(result).toBe(7) // May 28, 29, 30, 31, June 1, 2, 3 = 7 days
    })
  })
})
