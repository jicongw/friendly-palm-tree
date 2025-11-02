import { generateItineraryItems, generateLodgingName, generateActivityName } from '../itinerary-generator'
import { ItineraryType } from '@prisma/client'

describe('itinerary-generator', () => {
  describe('generateItineraryItems', () => {
    it('should generate transportation and lodging for a single destination trip', () => {
      const homeCity = 'San Francisco'
      const destinations = [
        { city: 'Tokyo', daysToStay: null } // Just Tokyo as return destination
      ]
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-04')

      const items = generateItineraryItems(homeCity, destinations, startDate, endDate)

      // Should have: 1 outbound flight, 1 return flight (no lodging for return destination)
      expect(items).toHaveLength(2)

      // Check outbound transportation
      expect(items[0].type).toBe(ItineraryType.TRANSPORTATION)
      expect(items[0].departCity).toBe('San Francisco')
      expect(items[0].arriveCity).toBe('Tokyo')
      expect(items[0].transportationType).toBe('flight')

      // Check return transportation
      expect(items[1].type).toBe(ItineraryType.TRANSPORTATION)
      expect(items[1].departCity).toBe('Tokyo')
      expect(items[1].arriveCity).toBe('San Francisco')
    })

    it('should generate transportation and lodging when destination has nights', () => {
      const homeCity = 'San Francisco'
      const destinations = [
        { city: 'Tokyo', daysToStay: 3 },
        { city: 'Tokyo', daysToStay: null } // Return from Tokyo
      ]
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-04')

      const items = generateItineraryItems(homeCity, destinations, startDate, endDate)

      // Should have: outbound flight, lodging, transport to next (Tokyo->Tokyo), return flight
      expect(items).toHaveLength(4)

      // Check outbound transportation
      expect(items[0].type).toBe(ItineraryType.TRANSPORTATION)
      expect(items[0].departCity).toBe('San Francisco')
      expect(items[0].arriveCity).toBe('Tokyo')

      // Check lodging
      expect(items[1].type).toBe(ItineraryType.LODGING)
      expect(items[1].lodgingName).toContain('Tokyo')
      expect(items[1].checkinTime).toBeDefined()
      expect(items[1].checkoutTime).toBeDefined()

      // Check transition transportation (Tokyo to Tokyo - edge case)
      expect(items[2].type).toBe(ItineraryType.TRANSPORTATION)
      expect(items[2].departCity).toBe('Tokyo')
      expect(items[2].arriveCity).toBe('Tokyo')

      // Check return transportation
      expect(items[3].type).toBe(ItineraryType.TRANSPORTATION)
      expect(items[3].departCity).toBe('Tokyo')
      expect(items[3].arriveCity).toBe('San Francisco')
    })

    it('should generate correct itinerary for multi-destination trip with overlap days', () => {
      const homeCity = 'San Francisco'
      const destinations = [
        { city: 'Tokyo', daysToStay: 3 },
        { city: 'Kyoto', daysToStay: null } // Return destination
      ]
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-10')

      const items = generateItineraryItems(homeCity, destinations, startDate, endDate)

      // Should have: SF->Tokyo, Tokyo lodging, Tokyo->Kyoto, Kyoto lodging, Kyoto->SF
      // But Kyoto is return destination (no lodging), so: SF->Tokyo, Tokyo lodging, Tokyo->Kyoto, Kyoto->SF
      expect(items).toHaveLength(4)

      // Outbound from home to Tokyo
      expect(items[0].type).toBe(ItineraryType.TRANSPORTATION)
      expect(items[0].departCity).toBe('San Francisco')
      expect(items[0].arriveCity).toBe('Tokyo')

      // Tokyo lodging
      expect(items[1].type).toBe(ItineraryType.LODGING)
      expect(items[1].lodgingAddress).toBe('Tokyo')

      // Tokyo to Kyoto (overlap day transportation)
      expect(items[2].type).toBe(ItineraryType.TRANSPORTATION)
      expect(items[2].departCity).toBe('Tokyo')
      expect(items[2].arriveCity).toBe('Kyoto')

      // Return from Kyoto to home
      expect(items[3].type).toBe(ItineraryType.TRANSPORTATION)
      expect(items[3].departCity).toBe('Kyoto')
      expect(items[3].arriveCity).toBe('San Francisco')
    })

    it('should handle three destination trip correctly', () => {
      const homeCity = 'New York'
      const destinations = [
        { city: 'Paris', daysToStay: 3 },
        { city: 'Rome', daysToStay: 4 },
        { city: 'Barcelona', daysToStay: null } // Return destination
      ]
      const startDate = new Date('2025-06-01')
      const endDate = new Date('2025-06-15')

      const items = generateItineraryItems(homeCity, destinations, startDate, endDate)

      // Should have:
      // NY->Paris, Paris lodging, Paris->Rome, Rome lodging, Rome->Barcelona, Barcelona->NY
      expect(items).toHaveLength(6)

      // Verify order
      expect(items[0].order).toBe(0)
      expect(items[1].order).toBe(1)
      expect(items[2].order).toBe(2)
      expect(items[3].order).toBe(3)
      expect(items[4].order).toBe(4)
      expect(items[5].order).toBe(5)

      // Verify transportation chain
      const transportationItems = items.filter(i => i.type === ItineraryType.TRANSPORTATION)
      expect(transportationItems).toHaveLength(4)
      expect(transportationItems[0].arriveCity).toBe('Paris')
      expect(transportationItems[1].departCity).toBe('Paris')
      expect(transportationItems[1].arriveCity).toBe('Rome')
      expect(transportationItems[2].departCity).toBe('Rome')
      expect(transportationItems[2].arriveCity).toBe('Barcelona')
      expect(transportationItems[3].departCity).toBe('Barcelona')
      expect(transportationItems[3].arriveCity).toBe('New York')

      // Verify lodging
      const lodgingItems = items.filter(i => i.type === ItineraryType.LODGING)
      expect(lodgingItems).toHaveLength(2) // Only Paris and Rome, not Barcelona (return)
      expect(lodgingItems[0].lodgingAddress).toBe('Paris')
      expect(lodgingItems[1].lodgingAddress).toBe('Rome')
    })

    it('should set correct default times for transportation', () => {
      const homeCity = 'San Francisco'
      const destinations = [
        { city: 'Tokyo', daysToStay: null }
      ]
      const startDate = new Date('2025-01-01T00:00:00')
      const endDate = new Date('2025-01-01T23:59:59')

      const items = generateItineraryItems(homeCity, destinations, startDate, endDate)

      const outbound = items.find(i => i.departCity === 'San Francisco')
      expect(outbound).toBeDefined()
      expect(outbound!.departTime).toBeDefined()

      // Should be 8 AM on start date
      const departTime = new Date(outbound!.departTime!)
      expect(departTime.getHours()).toBe(8)

      // Should be 12 PM on start date
      const arriveTime = new Date(outbound!.arriveTime!)
      expect(arriveTime.getHours()).toBe(12)
    })

    it('should set correct check-in and check-out times for lodging', () => {
      const homeCity = 'San Francisco'
      const destinations = [
        { city: 'Tokyo', daysToStay: 3 },
        { city: 'Tokyo', daysToStay: null }
      ]
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-04')

      const items = generateItineraryItems(homeCity, destinations, startDate, endDate)

      const lodging = items.find(i => i.type === ItineraryType.LODGING)
      expect(lodging).toBeDefined()

      // Check-in should be 3 PM
      const checkinTime = new Date(lodging!.checkinTime!)
      expect(checkinTime.getHours()).toBe(15)

      // Check-out should be 11 AM
      const checkoutTime = new Date(lodging!.checkoutTime!)
      expect(checkoutTime.getHours()).toBe(11)
    })

    it('should calculate lodging duration based on daysToStay', () => {
      const homeCity = 'San Francisco'
      const destinations = [
        { city: 'Tokyo', daysToStay: 5 },
        { city: 'Tokyo', daysToStay: null }
      ]
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-06')

      const items = generateItineraryItems(homeCity, destinations, startDate, endDate)

      const lodging = items.find(i => i.type === ItineraryType.LODGING)
      expect(lodging).toBeDefined()

      const checkinTime = new Date(lodging!.checkinTime!)
      const checkoutTime = new Date(lodging!.checkoutTime!)

      // 5 days stay means check-out is 5 days after check-in
      const daysDiff = Math.round((checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60 * 60 * 24))
      expect(daysDiff).toBe(5)
    })

    it('should handle single night stay correctly', () => {
      const homeCity = 'San Francisco'
      const destinations = [
        { city: 'Tokyo', daysToStay: 1 },
        { city: 'Tokyo', daysToStay: null }
      ]
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-02')

      const items = generateItineraryItems(homeCity, destinations, startDate, endDate)

      const lodging = items.find(i => i.type === ItineraryType.LODGING)
      expect(lodging).toBeDefined()

      const checkinTime = new Date(lodging!.checkinTime!)
      const checkoutTime = new Date(lodging!.checkoutTime!)

      // 1 night stay
      const daysDiff = Math.round((checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60 * 60 * 24))
      expect(daysDiff).toBe(1)
    })

    it('should include descriptions for all items', () => {
      const homeCity = 'San Francisco'
      const destinations = [
        { city: 'Tokyo', daysToStay: 3 },
        { city: 'Tokyo', daysToStay: null }
      ]
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-04')

      const items = generateItineraryItems(homeCity, destinations, startDate, endDate)

      items.forEach(item => {
        expect(item.description).toBeDefined()
        expect(item.description).not.toBe('')
      })
    })
  })

  describe('generateLodgingName', () => {
    it('should generate a lodging name with city', () => {
      const name = generateLodgingName('Tokyo')
      expect(name).toContain('Tokyo')
    })

    it('should generate different names (probabilistic)', () => {
      const names = new Set()
      for (let i = 0; i < 20; i++) {
        names.add(generateLodgingName('Paris'))
      }
      // Should generate at least a few different names
      expect(names.size).toBeGreaterThan(1)
    })

    it('should include hotel-related suffix', () => {
      const name = generateLodgingName('Rome')
      const validSuffixes = ['Hotel', 'Inn', 'Suites', 'Resort']
      const hasSuffix = validSuffixes.some(suffix => name.includes(suffix))
      expect(hasSuffix).toBe(true)
    })
  })

  describe('generateActivityName', () => {
    it('should generate a valid activity name', () => {
      const name = generateActivityName()
      expect(name).toBeDefined()
      expect(name.length).toBeGreaterThan(0)
    })

    it('should generate from predefined list', () => {
      const validActivities = [
        'City Tour',
        'Museum Visit',
        'Local Restaurant',
        'Shopping District',
        'Cultural Experience',
        'Sightseeing',
        'Guided Tour',
        'Local Cuisine Tasting'
      ]
      const name = generateActivityName()
      expect(validActivities).toContain(name)
    })

    it('should generate different names (probabilistic)', () => {
      const names = new Set()
      for (let i = 0; i < 20; i++) {
        names.add(generateActivityName())
      }
      // Should generate at least a few different names
      expect(names.size).toBeGreaterThan(1)
    })
  })
})
