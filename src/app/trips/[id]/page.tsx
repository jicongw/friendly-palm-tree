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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  CalendarIcon,
  PlusIcon,
  TrashIcon,
  MapIcon,
  ArrowLeftIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MapPinIcon
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { calculateDestinationDates, formatDateRange } from "@/lib/date-utils"

interface Destination {
  id: string
  name: string
  daysToStay: number
  order: number
  transportationNotes?: string | null
  transportationType?: string | null
  transportationDetails?: string | null
}

interface Trip {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  destinations: Destination[]
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [tripId, setTripId] = useState<string | null>(null)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Edit state
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editStartDate, setEditStartDate] = useState<Date>()
  const [editEndDate, setEditEndDate] = useState<Date>()
  const [editDestinations, setEditDestinations] = useState<Destination[]>([])
  const [newDestName, setNewDestName] = useState("")
  const [newDestDays, setNewDestDays] = useState(1)

  // Unwrap params
  useEffect(() => {
    params.then(({ id }) => setTripId(id))
  }, [params])

  // Fetch trip data
  useEffect(() => {
    if (!tripId) return

    const fetchTrip = async () => {
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
        initializeEditState(data)
      } catch (error) {
        console.error("Error fetching trip:", error)
        alert("Failed to load trip. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrip()
  }, [tripId, router])

  const initializeEditState = (tripData: Trip) => {
    setEditTitle(tripData.title)
    setEditDescription(tripData.description || "")
    setEditStartDate(new Date(tripData.startDate))
    setEditEndDate(new Date(tripData.endDate))
    setEditDestinations([...tripData.destinations])
  }

  const handleStartEdit = () => {
    if (trip) {
      initializeEditState(trip)
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setNewDestName("")
    setNewDestDays(1)
  }

  const handleSave = async () => {
    if (!editTitle.trim() || !editStartDate || !editEndDate) {
      alert("Please fill in all required fields")
      return
    }

    if (editStartDate > editEndDate) {
      alert("End date must be after start date")
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          startDate: editStartDate.toISOString(),
          endDate: editEndDate.toISOString(),
          destinations: editDestinations.map((d, index) => ({
            name: d.name,
            daysToStay: d.daysToStay,
            order: index,
            transportationNotes: d.transportationNotes || null,
            transportationType: d.transportationType || null,
            transportationDetails: d.transportationDetails || null
          }))
        })
      })

      if (!response.ok) {
        throw new Error("Failed to update trip")
      }

      const updatedTrip = await response.json()
      setTrip(updatedTrip)
      setIsEditing(false)
      setNewDestName("")
      setNewDestDays(1)
    } catch (error) {
      console.error("Error updating trip:", error)
      alert("Failed to update trip. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete trip")
      }

      router.push("/trips")
    } catch (error) {
      console.error("Error deleting trip:", error)
      alert("Failed to delete trip. Please try again.")
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const addDestination = () => {
    if (!newDestName.trim()) return

    const newDest: Destination = {
      id: `temp-${Date.now()}`,
      name: newDestName.trim(),
      daysToStay: newDestDays,
      order: editDestinations.length
    }

    setEditDestinations([...editDestinations, newDest])
    setNewDestName("")
    setNewDestDays(1)
  }

  const removeDestination = (id: string) => {
    setEditDestinations(editDestinations.filter(d => d.id !== id))
  }

  const updateDestinationName = (id: string, name: string) => {
    setEditDestinations(editDestinations.map(d =>
      d.id === id ? { ...d, name } : d
    ))
  }

  const updateDestinationDays = (id: string, days: number) => {
    setEditDestinations(editDestinations.map(d =>
      d.id === id ? { ...d, daysToStay: Math.max(1, days) } : d
    ))
  }

  const updateDestinationTransportationType = (id: string, type: string) => {
    setEditDestinations(editDestinations.map(d =>
      d.id === id ? { ...d, transportationType: type || null } : d
    ))
  }

  const updateDestinationTransportationDetails = (id: string, details: string) => {
    setEditDestinations(editDestinations.map(d =>
      d.id === id ? { ...d, transportationDetails: details || null } : d
    ))
  }

  const updateDestinationTransportationNotes = (id: string, notes: string) => {
    setEditDestinations(editDestinations.map(d =>
      d.id === id ? { ...d, transportationNotes: notes || null } : d
    ))
  }

  const moveDestination = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === editDestinations.length - 1) return

    const newDestinations = [...editDestinations]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newDestinations[index]
    newDestinations[index] = newDestinations[targetIndex]
    newDestinations[targetIndex] = temp

    setEditDestinations(newDestinations)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trip...</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return null
  }

  const totalDays = trip.destinations.reduce((sum, d) => sum + d.daysToStay, 0)

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
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button asChild variant="ghost" size="sm">
              <Link href="/trips">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Trips
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Trip Title *</Label>
                        <Input
                          id="title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          disabled={isSaving}
                          className="text-2xl font-bold h-auto py-2 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <textarea
                          id="description"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          disabled={isSaving}
                          placeholder="Add a description for your trip..."
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-3xl">{trip.title}</CardTitle>
                      {trip.description && (
                        <CardDescription className="mt-2 text-base">
                          {trip.description}
                        </CardDescription>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {!isEditing ? (
                    <>
                      <Button
                        onClick={handleStartEdit}
                        variant="outline"
                        size="sm"
                      >
                        <EditIcon className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => setShowDeleteDialog(true)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="sm"
                      >
                        <SaveIcon className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        variant="outline"
                        size="sm"
                      >
                        <XIcon className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Dates Section */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Travel Dates
                </h3>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            disabled={isSaving}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editStartDate ? format(editStartDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={editStartDate}
                            onSelect={setEditStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            disabled={isSaving}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editEndDate ? format(editEndDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={editEndDate}
                            onSelect={setEditEndDate}
                            initialFocus
                            disabled={(date) => editStartDate ? date < editStartDate : false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Departure</p>
                        <p className="font-semibold text-lg">{format(new Date(trip.startDate), "PPP")}</p>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Return</p>
                        <p className="font-semibold text-lg">{format(new Date(trip.endDate), "PPP")}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Destinations Section */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center justify-between">
                  <span className="flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Destinations
                  </span>
                  {!isEditing && trip.destinations.length > 0 && (
                    <span className="text-sm text-gray-500 font-normal">
                      {trip.destinations.length} destination{trip.destinations.length !== 1 ? 's' : ''} • {totalDays} day{totalDays !== 1 ? 's' : ''}
                    </span>
                  )}
                </h3>

                {isEditing ? (
                  <div className="space-y-4">
                    {/* Existing Destinations in Edit Mode */}
                    {editDestinations.length > 0 && (
                      <div className="space-y-3">
                        {editDestinations.map((dest, index) => (
                          <div
                            key={dest.id}
                            className="border rounded-lg bg-white p-4 space-y-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveDestination(index, 'up')}
                                  disabled={index === 0 || isSaving}
                                  className="h-6 w-6 p-0 hover:bg-gray-100"
                                  title="Move up"
                                >
                                  <ChevronUpIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveDestination(index, 'down')}
                                  disabled={index === editDestinations.length - 1 || isSaving}
                                  className="h-6 w-6 p-0 hover:bg-gray-100"
                                  title="Move down"
                                >
                                  <ChevronDownIcon className="h-4 w-4" />
                                </Button>
                              </div>
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm flex-shrink-0">
                                {index + 1}
                              </span>
                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <Input
                                    placeholder="Destination name"
                                    value={dest.name}
                                    onChange={(e) => updateDestinationName(dest.id, e.target.value)}
                                    disabled={isSaving}
                                  />
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={dest.daysToStay}
                                      onChange={(e) => updateDestinationDays(dest.id, parseInt(e.target.value) || 1)}
                                      className="w-20"
                                      disabled={isSaving}
                                    />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                      day{dest.daysToStay !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>

                                <details className="group">
                                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1">
                                    Transportation Details (optional)
                                    <ChevronDownIcon className="h-4 w-4 group-open:rotate-180 transition-transform" />
                                  </summary>
                                  <div className="mt-3 space-y-3 pl-1">
                                    <div>
                                      <Label className="text-xs">Type</Label>
                                      <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={dest.transportationType || ''}
                                        onChange={(e) => updateDestinationTransportationType(dest.id, e.target.value)}
                                        disabled={isSaving}
                                      >
                                        <option value="">Select...</option>
                                        <option value="flight">Flight</option>
                                        <option value="train">Train</option>
                                        <option value="bus">Bus</option>
                                        <option value="car">Car</option>
                                        <option value="ferry">Ferry</option>
                                        <option value="other">Other</option>
                                      </select>
                                    </div>
                                    <div>
                                      <Label className="text-xs">Details (e.g., flight number, train route)</Label>
                                      <Input
                                        placeholder="AA123, Eurostar to London, etc."
                                        value={dest.transportationDetails || ''}
                                        onChange={(e) => updateDestinationTransportationDetails(dest.id, e.target.value)}
                                        disabled={isSaving}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Notes</Label>
                                      <textarea
                                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Departure time, booking reference, etc."
                                        value={dest.transportationNotes || ''}
                                        onChange={(e) => updateDestinationTransportationNotes(dest.id, e.target.value)}
                                        disabled={isSaving}
                                      />
                                    </div>
                                  </div>
                                </details>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDestination(dest.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                disabled={isSaving}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Destination */}
                    <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                      <Label className="text-sm font-medium">Add Destination</Label>
                      <div className="flex flex-col md:flex-row gap-3">
                        <Input
                          placeholder="Destination name"
                          value={newDestName}
                          onChange={(e) => setNewDestName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDestination())}
                          className="flex-1"
                          disabled={isSaving}
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={newDestDays}
                            onChange={(e) => setNewDestDays(parseInt(e.target.value) || 1)}
                            className="w-20"
                            disabled={isSaving}
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            day{newDestDays !== 1 ? 's' : ''}
                          </span>
                          <Button
                            type="button"
                            onClick={addDestination}
                            size="sm"
                            disabled={!newDestName.trim() || isSaving}
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {trip.destinations.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-500">
                        No destinations added yet
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {calculateDestinationDates(new Date(trip.startDate), trip.destinations).map((dest, index) => (
                          <div
                            key={dest.id}
                            className="border rounded-lg bg-white hover:shadow-md transition-shadow overflow-hidden"
                          >
                            <div className="flex items-start gap-4 p-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h4 className="font-semibold text-lg">{dest.name}</h4>
                                  <span className="text-sm font-medium text-blue-600 whitespace-nowrap">
                                    {dest.daysToStay} day{dest.daysToStay !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                  <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                                  <span className="font-medium">{formatDateRange(dest.startDate, dest.endDate)}</span>
                                </div>
                                {(dest.transportationType || dest.transportationDetails || dest.transportationNotes) && (
                                  <div className="mt-3 pt-3 border-t space-y-2">
                                    {dest.transportationType && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium text-gray-700">Transportation:</span>
                                        <span className="capitalize bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                          {dest.transportationType}
                                        </span>
                                      </div>
                                    )}
                                    {dest.transportationDetails && (
                                      <div className="text-sm">
                                        <span className="font-medium text-gray-700">Details: </span>
                                        <span className="text-gray-600">{dest.transportationDetails}</span>
                                      </div>
                                    )}
                                    {dest.transportationNotes && (
                                      <div className="text-sm">
                                        <span className="font-medium text-gray-700">Notes: </span>
                                        <span className="text-gray-600">{dest.transportationNotes}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{trip.title}&quot; and all its destinations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Trip"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
