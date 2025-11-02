import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { MapIcon, CalendarIcon, PlusIcon, ArrowLeftIcon, MapPinIcon } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default async function TripsPage() {
  const session = await auth()

  if (!session || !session.user?.id) {
    redirect("/auth/signin")
  }

  const trips = await prisma.trip.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      destinations: {
        orderBy: {
          order: 'asc'
        }
      }
    },
    orderBy: {
      startDate: 'desc'
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2">
            <MapIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Trip Planner</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button asChild variant="ghost" size="sm" className="mb-2">
                <Link href="/">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <h2 className="text-3xl font-bold text-gray-900">My Trips</h2>
              <p className="text-gray-600 mt-1">
                {trips.length} trip{trips.length !== 1 ? 's' : ''} planned
              </p>
            </div>
            <Button asChild>
              <Link href="/trips/new">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create New Trip
              </Link>
            </Button>
          </div>

          {trips.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <MapIcon className="h-12 w-12 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No trips yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start planning your first adventure!
                    </p>
                    <Button asChild>
                      <Link href="/trips/new">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Your First Trip
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <Link key={trip.id} href={`/trips/${trip.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="line-clamp-2">{trip.title}</span>
                      </CardTitle>
                      {trip.description && (
                        <CardDescription className="line-clamp-2">
                          {trip.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Dates */}
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>
                          {format(new Date(trip.startDate), "MMM d, yyyy")} -{" "}
                          {format(new Date(trip.endDate), "MMM d, yyyy")}
                        </span>
                      </div>

                      {/* Destinations */}
                      {trip.destinations.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center text-sm font-medium text-gray-700">
                            <MapPinIcon className="h-4 w-4 mr-2" />
                            Destinations ({trip.destinations.length})
                          </div>
                          <div className="space-y-1 pl-6">
                            {trip.destinations.map((dest, index) => (
                              <div
                                key={dest.id}
                                className="flex items-baseline text-sm text-gray-600"
                              >
                                <span className="text-blue-600 font-semibold mr-2 min-w-[20px]">
                                  {index + 1}.
                                </span>
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900">
                                    {dest.city}
                                  </span>
                                  {dest.daysToStay !== null && (
                                    <span className="text-gray-500 ml-2">
                                      ({dest.daysToStay} day{dest.daysToStay !== 1 ? 's' : ''})
                                    </span>
                                  )}
                                  {dest.daysToStay === null && (
                                    <span className="text-gray-500 ml-2">
                                      (Return)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="pt-3 border-t text-xs text-gray-500">
                        {trip.destinations.length > 0 && (
                          <span>
                            Total: {trip.destinations.reduce((sum, d) => sum + (d.daysToStay || 0), 0)} days
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
