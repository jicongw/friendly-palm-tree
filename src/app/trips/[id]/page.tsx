"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  MapIcon,
  ArrowLeftIcon,
  EditIcon,
  PlaneIcon,
  BedIcon,
  MapPinIcon,
  DollarSignIcon,
  ClockIcon,
  HomeIcon
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { ItineraryType } from "@prisma/client"

interface ItineraryItem {
  id: string
  type: ItineraryType
  order: number

  description?: string | null
  confirmationEmailLink?: string | null
  cost?: number | null

  transportationType?: string | null
  departTime?: string | null
  arriveTime?: string | null
  departCity?: string | null
  arriveCity?: string | null

  lodgingName?: string | null
  checkinTime?: string | null
  checkoutTime?: string | null
  lodgingAddress?: string | null

  activityName?: string | null
  startTime?: string | null
  duration?: number | null
  activityAddress?: string | null
  activityDescription?: string | null
}

interface TripDestination {
  id: string
  city: string
  daysToStay: number | null
  order: number
}

interface Trip {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  homeCity: string
  destinations: TripDestination[]
  itineraryItems: ItineraryItem[]
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [tripId, setTripId] = useState<string | null>(null)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Activity dialog state
  const [showActivityDialog, setShowActivityDialog] = useState(false)
  const [activityName, setActivityName] = useState("")
  const [activityStartTime, setActivityStartTime] = useState<Date>()
  const [activityDuration, setActivityDuration] = useState(60)
  const [activityAddress, setActivityAddress] = useState("")
  const [activityDescription, setActivityDescription] = useState("")
  const [activityCost, setActivityCost] = useState<string>("")
  const [isCreatingActivity, setIsCreatingActivity] = useState(false)

  // Edit dialog state
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Unwrap params
  useEffect(() => {
    params.then(({ id }) => setTripId(id))
  }, [params])

  // Fetch trip data
  const fetchTrip = async () => {
    if (!tripId) return

    try {
      const response = await fetch(`/api/trips/${tripId}`)

      if (!response.ok) {
        if (response.status === 404) {
          router.push("/trips")
          return
        }
        throw new Error("Failed to fetch trip")
      }

      const data = await response.json()
      setTrip(data)
    } catch (error) {
      console.error("Error fetching trip:", error)
      alert("Failed to load trip. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrip()
  }, [tripId])

  const handleCreateActivity = async () => {
    if (!activityName.trim() || !activityStartTime) {
      alert("Please fill in activity name and start time")
      return
    }

    setIsCreatingActivity(true)

    try {
      const response = await fetch("/api/itinerary-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripId,
          type: ItineraryType.ACTIVITY,
          activityName: activityName.trim(),
          startTime: activityStartTime.toISOString(),
          duration: activityDuration,
          activityAddress: activityAddress.trim() || undefined,
          activityDescription: activityDescription.trim() || undefined,
          cost: activityCost ? parseFloat(activityCost) : undefined,
        })
      })

      if (!response.ok) {
        throw new Error("Failed to create activity")
      }

      // Refresh trip data
      await fetchTrip()

      // Reset form
      setShowActivityDialog(false)
      setActivityName("")
      setActivityStartTime(undefined)
      setActivityDuration(60)
      setActivityAddress("")
      setActivityDescription("")
      setActivityCost("")
    } catch (error) {
      console.error("Error creating activity:", error)
      alert("Failed to create activity. Please try again.")
    } finally {
      setIsCreatingActivity(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return
    }

    try {
      const response = await fetch(`/api/itinerary-items/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete item")
      }

      // Refresh trip data
      await fetchTrip()
    } catch (error) {
      console.error("Error deleting item:", error)
      alert("Failed to delete item. Please try again.")
    }
  }

  const renderTransportationItem = (item: ItineraryItem) => (
    <Card key={item.id} className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <PlaneIcon className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Transportation</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteItem(item.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {item.transportationType && `${item.transportationType.charAt(0).toUpperCase() + item.transportationType.slice(1)} • `}
          {item.departCity} → {item.arriveCity}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {item.departTime && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClockIcon className="h-4 w-4" />
            <span>Departs: {format(new Date(item.departTime), "PPp")}</span>
          </div>
        )}
        {item.arriveTime && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClockIcon className="h-4 w-4" />
            <span>Arrives: {format(new Date(item.arriveTime), "PPp")}</span>
          </div>
        )}
        {item.cost && (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <DollarSignIcon className="h-4 w-4" />
            <span>${item.cost.toFixed(2)}</span>
          </div>
        )}
        {item.description && (
          <p className="text-muted-foreground mt-2">{item.description}</p>
        )}
      </CardContent>
    </Card>
  )

  const renderLodgingItem = (item: ItineraryItem) => (
    <Card key={item.id} className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <BedIcon className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Lodging</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteItem(item.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{item.lodgingName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {item.lodgingAddress && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPinIcon className="h-4 w-4" />
            <span>{item.lodgingAddress}</span>
          </div>
        )}
        {item.checkinTime && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClockIcon className="h-4 w-4" />
            <span>Check-in: {format(new Date(item.checkinTime), "PPp")}</span>
          </div>
        )}
        {item.checkoutTime && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClockIcon className="h-4 w-4" />
            <span>Check-out: {format(new Date(item.checkoutTime), "PPp")}</span>
          </div>
        )}
        {item.cost && (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <DollarSignIcon className="h-4 w-4" />
            <span>${item.cost.toFixed(2)}</span>
          </div>
        )}
        {item.description && (
          <p className="text-muted-foreground mt-2">{item.description}</p>
        )}
      </CardContent>
    </Card>
  )

  const renderActivityItem = (item: ItineraryItem) => (
    <Card key={item.id} className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Activity</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteItem(item.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{item.activityName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {item.startTime && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClockIcon className="h-4 w-4" />
            <span>
              {format(new Date(item.startTime), "PPp")}
              {item.duration && ` • ${item.duration} min`}
            </span>
          </div>
        )}
        {item.activityAddress && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPinIcon className="h-4 w-4" />
            <span>{item.activityAddress}</span>
          </div>
        )}
        {item.cost && (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <DollarSignIcon className="h-4 w-4" />
            <span>${item.cost.toFixed(2)}</span>
          </div>
        )}
        {item.activityDescription && (
          <p className="text-muted-foreground mt-2">{item.activityDescription}</p>
        )}
      </CardContent>
    </Card>
  )

  const renderItineraryItem = (item: ItineraryItem) => {
    switch (item.type) {
      case ItineraryType.TRANSPORTATION:
        return renderTransportationItem(item)
      case ItineraryType.LODGING:
        return renderLodgingItem(item)
      case ItineraryType.ACTIVITY:
        return renderActivityItem(item)
      default:
        return null
    }
  }

  const calculateTotalCost = () => {
    if (!trip) return 0
    return trip.itineraryItems.reduce((sum, item) => sum + (item.cost || 0), 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Trip Planner</h1>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/trips">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Trips
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Trip Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-3xl mb-2">{trip.title}</CardTitle>
                  <CardDescription className="text-base">
                    {format(new Date(trip.startDate), "PPP")} - {format(new Date(trip.endDate), "PPP")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {trip.description && (
                <p className="text-muted-foreground">{trip.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <HomeIcon className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Home:</span>
                  <span>{trip.homeCity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Destinations:</span>
                  <span>{trip.destinations.map(d => d.city).join(" → ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSignIcon className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Total Cost:</span>
                  <span className="text-green-600 font-semibold">${calculateTotalCost().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Activity Button */}
          <div className="flex justify-end">
            <Button onClick={() => setShowActivityDialog(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </div>

          {/* Itinerary Items */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Itinerary</h2>
            {trip.itineraryItems.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No itinerary items yet. Add activities to your trip!
                </CardContent>
              </Card>
            ) : (
              trip.itineraryItems
                .sort((a, b) => a.order - b.order)
                .map(renderItineraryItem)
            )}
          </div>
        </div>
      </main>

      {/* Add Activity Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
            <DialogDescription>
              Add a new activity to your trip itinerary
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="activityName">Activity Name *</Label>
              <Input
                id="activityName"
                placeholder="e.g., Visit Eiffel Tower"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {activityStartTime ? format(activityStartTime, "PPPp") : "Pick a date and time"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={activityStartTime}
                    onSelect={setActivityStartTime}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityDuration">Duration (minutes)</Label>
              <Input
                id="activityDuration"
                type="number"
                min="1"
                value={activityDuration}
                onChange={(e) => setActivityDuration(parseInt(e.target.value) || 60)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityAddress">Address</Label>
              <Input
                id="activityAddress"
                placeholder="e.g., Champ de Mars, 5 Av. Anatole France"
                value={activityAddress}
                onChange={(e) => setActivityAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityCost">Cost ($)</Label>
              <Input
                id="activityCost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={activityCost}
                onChange={(e) => setActivityCost(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityDescription">Description</Label>
              <textarea
                id="activityDescription"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Additional notes about this activity..."
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActivityDialog(false)}
              disabled={isCreatingActivity}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateActivity} disabled={isCreatingActivity}>
              {isCreatingActivity ? "Creating..." : "Create Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
