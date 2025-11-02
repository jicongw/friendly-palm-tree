import { PrismaClient, ItineraryType } from '@prisma/client'
import { addDays, setHours, setMinutes, set } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Find or create test user
  let user = await prisma.user.findUnique({
    where: {
      email: 'user.test.20250410@gmail.com',
    },
  })

  if (user) {
    console.log('👤 Found existing user:', user.email)
    // Delete existing trips for this user to avoid duplicates
    const deletedCount = await prisma.trip.deleteMany({
      where: {
        userId: user.id,
      },
    })
    console.log('🗑️  Deleted', deletedCount.count, 'existing trips')
  } else {
    user = await prisma.user.create({
      data: {
        email: 'user.test.20250410@gmail.com',
        name: 'Test User',
        emailVerified: new Date(),
      },
    })
    console.log('✨ Created test user:', user.email)
  }
  console.log()

  // Trip 1: Summer Europe Tour (3 destinations)
  console.log('📝 Creating trip 1/3: Summer Europe Adventure...')
  const trip1StartDate = new Date(2025, 5, 1) // June 1, 2025
  const trip1EndDate = new Date(2025, 5, 15) // June 15, 2025

  const trip1 = await prisma.trip.create({
    data: {
      title: 'Summer Europe Adventure',
      description: 'A two-week journey through some of Europe\'s most beautiful cities',
      startDate: trip1StartDate,
      endDate: trip1EndDate,
      homeCity: 'San Francisco',
      userId: user.id,
      destinations: {
        create: [
          { city: 'Paris', daysToStay: 4, order: 0 },
          { city: 'Barcelona', daysToStay: 5, order: 1 },
          { city: 'Rome', daysToStay: null, order: 2 }, // return destination
        ],
      },
      itineraryItems: {
        create: [
          // SF to Paris
          {
            type: ItineraryType.TRANSPORTATION,
            order: 0,
            transportationType: 'flight',
            departCity: 'San Francisco',
            arriveCity: 'Paris',
            departTime: setMinutes(setHours(trip1StartDate, 10), 30),
            arriveTime: setMinutes(setHours(addDays(trip1StartDate, 1), 6), 45),
            cost: 850.00,
            description: 'Air France AF83',
            confirmationEmailLink: 'https://example.com/confirmation/AF83',
          },
          // Paris lodging
          {
            type: ItineraryType.LODGING,
            order: 1,
            lodgingName: 'Hotel Le Marais',
            lodgingAddress: '12 Rue des Archives, 75004 Paris, France',
            checkinTime: setHours(trip1StartDate, 15),
            checkoutTime: setHours(addDays(trip1StartDate, 4), 11),
            cost: 600.00,
            description: 'Boutique hotel in the heart of Le Marais',
          },
          // Paris activities
          {
            type: ItineraryType.ACTIVITY,
            order: 2,
            activityName: 'Eiffel Tower Visit',
            activityAddress: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris',
            startTime: setHours(addDays(trip1StartDate, 1), 14),
            duration: 180,
            cost: 26.50,
            activityDescription: 'Skip-the-line tickets to the summit of the Eiffel Tower',
          },
          {
            type: ItineraryType.ACTIVITY,
            order: 3,
            activityName: 'Louvre Museum Tour',
            activityAddress: 'Rue de Rivoli, 75001 Paris',
            startTime: setHours(addDays(trip1StartDate, 2), 10),
            duration: 240,
            cost: 45.00,
            activityDescription: 'Guided tour of the world\'s largest art museum',
          },
          // Paris to Barcelona
          {
            type: ItineraryType.TRANSPORTATION,
            order: 4,
            transportationType: 'flight',
            departCity: 'Paris',
            arriveCity: 'Barcelona',
            departTime: setMinutes(setHours(addDays(trip1StartDate, 4), 8), 15),
            arriveTime: setMinutes(setHours(addDays(trip1StartDate, 4), 10), 30),
            cost: 120.00,
            description: 'Vueling VY8001',
          },
          // Barcelona lodging
          {
            type: ItineraryType.LODGING,
            order: 5,
            lodgingName: 'Casa Barcelona',
            lodgingAddress: 'Carrer de Pau Claris, 122, 08009 Barcelona, Spain',
            checkinTime: setHours(addDays(trip1StartDate, 4), 15),
            checkoutTime: setHours(addDays(trip1StartDate, 9), 11),
            cost: 550.00,
            description: 'Modern apartment in Eixample district',
          },
          // Barcelona activities
          {
            type: ItineraryType.ACTIVITY,
            order: 6,
            activityName: 'Sagrada Familia Tour',
            activityAddress: 'Carrer de Mallorca, 401, 08013 Barcelona',
            startTime: setHours(addDays(trip1StartDate, 5), 9),
            duration: 150,
            cost: 35.00,
            activityDescription: 'Fast-track access to Gaudí\'s masterpiece',
          },
          {
            type: ItineraryType.ACTIVITY,
            order: 7,
            activityName: 'Park Güell Visit',
            activityAddress: 'Carrer d\'Olot, 5, 08024 Barcelona',
            startTime: setHours(addDays(trip1StartDate, 6), 14),
            duration: 120,
            cost: 13.00,
            activityDescription: 'Explore Gaudí\'s colorful park with city views',
          },
          // Barcelona to Rome
          {
            type: ItineraryType.TRANSPORTATION,
            order: 8,
            transportationType: 'flight',
            departCity: 'Barcelona',
            arriveCity: 'Rome',
            departTime: setMinutes(setHours(addDays(trip1StartDate, 9), 13), 45),
            arriveTime: setMinutes(setHours(addDays(trip1StartDate, 9), 15), 55),
            cost: 95.00,
            description: 'Ryanair FR2354',
          },
          // Rome lodging
          {
            type: ItineraryType.LODGING,
            order: 9,
            lodgingName: 'Hotel Colosseum View',
            lodgingAddress: 'Via Labicana, 125, 00184 Roma RM, Italy',
            checkinTime: setHours(addDays(trip1StartDate, 9), 15),
            checkoutTime: setHours(trip1EndDate, 11),
            cost: 480.00,
            description: 'Charming hotel near the Colosseum',
          },
          // Rome activities
          {
            type: ItineraryType.ACTIVITY,
            order: 10,
            activityName: 'Vatican Museums & Sistine Chapel',
            activityAddress: 'Viale Vaticano, 00165 Roma RM, Italy',
            startTime: setHours(addDays(trip1StartDate, 10), 9),
            duration: 300,
            cost: 65.00,
            activityDescription: 'Early access tour with expert guide',
          },
          {
            type: ItineraryType.ACTIVITY,
            order: 11,
            activityName: 'Colosseum & Roman Forum',
            activityAddress: 'Piazza del Colosseo, 1, 00184 Roma RM, Italy',
            startTime: setHours(addDays(trip1StartDate, 11), 10),
            duration: 240,
            cost: 55.00,
            activityDescription: 'Skip-the-line access to ancient Rome',
          },
          // Rome to SF (return)
          {
            type: ItineraryType.TRANSPORTATION,
            order: 12,
            transportationType: 'flight',
            departCity: 'Rome',
            arriveCity: 'San Francisco',
            departTime: setMinutes(setHours(trip1EndDate, 11), 20),
            arriveTime: setMinutes(setHours(trip1EndDate, 15), 45),
            cost: 920.00,
            description: 'United UA507',
            confirmationEmailLink: 'https://example.com/confirmation/UA507',
          },
        ],
      },
    },
  })
  console.log('✅ Created trip 1:', trip1.title)

  // Trip 2: Quick Japan Getaway (2 destinations)
  console.log('📝 Creating trip 2/3: Japan Discovery...')
  const trip2StartDate = new Date(2025, 8, 10) // September 10, 2025
  const trip2EndDate = new Date(2025, 8, 20) // September 20, 2025

  const trip2 = await prisma.trip.create({
    data: {
      title: 'Japan Discovery',
      description: 'Experience the perfect blend of tradition and modernity in Japan',
      startDate: trip2StartDate,
      endDate: trip2EndDate,
      homeCity: 'Los Angeles',
      userId: user.id,
      destinations: {
        create: [
          { city: 'Tokyo', daysToStay: 5, order: 0 },
          { city: 'Kyoto', daysToStay: null, order: 1 }, // return destination
        ],
      },
      itineraryItems: {
        create: [
          // LA to Tokyo
          {
            type: ItineraryType.TRANSPORTATION,
            order: 0,
            transportationType: 'flight',
            departCity: 'Los Angeles',
            arriveCity: 'Tokyo',
            departTime: setHours(trip2StartDate, 11),
            arriveTime: setHours(addDays(trip2StartDate, 1), 15),
            cost: 1200.00,
            description: 'Japan Airlines JL62',
          },
          // Tokyo lodging
          {
            type: ItineraryType.LODGING,
            order: 1,
            lodgingName: 'Shibuya Grand Hotel',
            lodgingAddress: '2-1 Dogenzaka, Shibuya City, Tokyo 150-0043, Japan',
            checkinTime: setHours(addDays(trip2StartDate, 1), 15),
            checkoutTime: setHours(addDays(trip2StartDate, 6), 11),
            cost: 750.00,
          },
          // Tokyo activities
          {
            type: ItineraryType.ACTIVITY,
            order: 2,
            activityName: 'TeamLab Borderless',
            activityAddress: 'Azabudai Hills, Minato City, Tokyo',
            startTime: setHours(addDays(trip2StartDate, 2), 18),
            duration: 120,
            cost: 38.00,
            activityDescription: 'Immersive digital art museum experience',
          },
          {
            type: ItineraryType.ACTIVITY,
            order: 3,
            activityName: 'Tsukiji Outer Market Food Tour',
            activityAddress: '4 Chome Tsukiji, Chuo City, Tokyo 104-0045',
            startTime: setHours(addDays(trip2StartDate, 3), 8),
            duration: 180,
            cost: 95.00,
            activityDescription: 'Guided tour with breakfast and tastings',
          },
          // Tokyo to Kyoto
          {
            type: ItineraryType.TRANSPORTATION,
            order: 4,
            transportationType: 'train',
            departCity: 'Tokyo',
            arriveCity: 'Kyoto',
            departTime: setMinutes(setHours(addDays(trip2StartDate, 6), 9), 3),
            arriveTime: setMinutes(setHours(addDays(trip2StartDate, 6), 11), 16),
            cost: 135.00,
            description: 'Shinkansen Nozomi',
          },
          // Kyoto lodging
          {
            type: ItineraryType.LODGING,
            order: 5,
            lodgingName: 'Traditional Ryokan Kyoto',
            lodgingAddress: 'Higashiyama Ward, Kyoto, 605-0000, Japan',
            checkinTime: setHours(addDays(trip2StartDate, 6), 15),
            checkoutTime: setHours(trip2EndDate, 10),
            cost: 600.00,
            description: 'Traditional Japanese inn with tatami rooms',
          },
          // Kyoto activities
          {
            type: ItineraryType.ACTIVITY,
            order: 6,
            activityName: 'Fushimi Inari Shrine Hike',
            activityAddress: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto',
            startTime: setHours(addDays(trip2StartDate, 7), 7),
            duration: 180,
            cost: 0,
            activityDescription: 'Morning hike through thousands of torii gates',
          },
          {
            type: ItineraryType.ACTIVITY,
            order: 7,
            activityName: 'Arashiyama Bamboo Grove & Temple',
            activityAddress: 'Arashiyama, Ukyo Ward, Kyoto',
            startTime: setHours(addDays(trip2StartDate, 8), 9),
            duration: 240,
            cost: 25.00,
            activityDescription: 'Visit bamboo forest and Tenryu-ji Temple',
          },
          // Kyoto to LA (return)
          {
            type: ItineraryType.TRANSPORTATION,
            order: 8,
            transportationType: 'flight',
            departCity: 'Kyoto',
            arriveCity: 'Los Angeles',
            departTime: setHours(trip2EndDate, 17),
            arriveTime: setHours(trip2EndDate, 11),
            cost: 1150.00,
            description: 'ANA NH175 (via Osaka)',
          },
        ],
      },
    },
  })
  console.log('✅ Created trip 2:', trip2.title)

  // Trip 3: Weekend NYC Trip (single destination)
  console.log('📝 Creating trip 3/3: NYC Weekend Getaway...')
  const trip3StartDate = new Date(2025, 3, 18) // April 18, 2025
  const trip3EndDate = new Date(2025, 3, 21) // April 21, 2025

  const trip3 = await prisma.trip.create({
    data: {
      title: 'NYC Weekend Getaway',
      description: 'Quick trip to the Big Apple',
      startDate: trip3StartDate,
      endDate: trip3EndDate,
      homeCity: 'Boston',
      userId: user.id,
      destinations: {
        create: [
          { city: 'New York City', daysToStay: null, order: 0 }, // return destination
        ],
      },
      itineraryItems: {
        create: [
          // Boston to NYC
          {
            type: ItineraryType.TRANSPORTATION,
            order: 0,
            transportationType: 'train',
            departCity: 'Boston',
            arriveCity: 'New York City',
            departTime: setMinutes(setHours(trip3StartDate, 7), 30),
            arriveTime: setMinutes(setHours(trip3StartDate, 11), 15),
            cost: 89.00,
            description: 'Amtrak Acela Express',
          },
          // NYC lodging
          {
            type: ItineraryType.LODGING,
            order: 1,
            lodgingName: 'Manhattan Midtown Hotel',
            lodgingAddress: '234 W 42nd St, New York, NY 10036',
            checkinTime: setHours(trip3StartDate, 15),
            checkoutTime: setHours(trip3EndDate, 11),
            cost: 420.00,
          },
          // NYC activities
          {
            type: ItineraryType.ACTIVITY,
            order: 2,
            activityName: 'Broadway Show - Hamilton',
            activityAddress: '226 W 46th St, New York, NY 10036',
            startTime: setHours(trip3StartDate, 20),
            duration: 165,
            cost: 285.00,
            activityDescription: 'Evening performance',
          },
          {
            type: ItineraryType.ACTIVITY,
            order: 3,
            activityName: 'Central Park Bike Tour',
            activityAddress: 'Central Park, New York, NY',
            startTime: setHours(addDays(trip3StartDate, 1), 10),
            duration: 120,
            cost: 45.00,
            activityDescription: 'Guided bike tour through the park',
          },
          {
            type: ItineraryType.ACTIVITY,
            order: 4,
            activityName: 'MoMA Visit',
            activityAddress: '11 W 53rd St, New York, NY 10019',
            startTime: setHours(addDays(trip3StartDate, 2), 14),
            duration: 180,
            cost: 25.00,
            activityDescription: 'Museum of Modern Art',
          },
          // NYC to Boston (return)
          {
            type: ItineraryType.TRANSPORTATION,
            order: 5,
            transportationType: 'train',
            departCity: 'New York City',
            arriveCity: 'Boston',
            departTime: setMinutes(setHours(trip3EndDate, 16), 30),
            arriveTime: setMinutes(setHours(trip3EndDate, 20), 15),
            cost: 89.00,
            description: 'Amtrak Acela Express',
          },
        ],
      },
    },
  })
  console.log('✅ Created trip 3:', trip3.title)

  const itineraryCount = await prisma.itineraryItem.count()

  console.log('\n🎉 Database seeded successfully!')
  console.log(`   👤 User: ${user.email}`)
  console.log(`   ✈️  Created 3 trips with destinations and itinerary items`)
  console.log(`   📋 Total itinerary items: ${itineraryCount}`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
