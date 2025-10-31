"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, PlusIcon, TrashIcon, MapIcon, ArrowLeftIcon } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Destination {
  id: string
  name: string
  daysToStay: number
}

export default function NewTripPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [newDestName, setNewDestName] = useState("")
  const [newDestDays, setNewDestDays] = useState(1)

  const addDestination = () => {
    if (!newDestName.trim()) return

    const newDest: Destination = {
      id: Math.random().toString(36).substr(2, 9),
      name: newDestName.trim(),
      daysToStay: newDestDays
    }

    setDestinations([...destinations, newDest])
    setNewDestName("")
    setNewDestDays(1)
  }

  const removeDestination = (id: string) => {
    setDestinations(destinations.filter(d => d.id !== id))
  }

  const updateDestinationName = (id: string, name: string) => {
    setDestinations(destinations.map(d =>
      d.id === id ? { ...d, name } : d
    ))
  }

  const updateDestinationDays = (id: string, days: number) => {
    setDestinations(destinations.map(d =>
      d.id === id ? { ...d, daysToStay: Math.max(1, days) } : d
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !startDate || !endDate) {
      alert("Please fill in all required fields")
      return
    }

    if (startDate > endDate) {
      alert("End date must be after start date")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          destinations: destinations.map((d, index) => ({
            name: d.name,
            daysToStay: d.daysToStay,
            order: index
          }))
        })
      })

      if (!response.ok) {
        throw new Error("Failed to create trip")
      }

      router.push("/trips")
    } catch (error) {
      console.error("Error creating trip:", error)
      alert("Failed to create trip. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create New Trip</CardTitle>
              <CardDescription>
                Plan your next adventure by adding destinations and dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Trip Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Trip Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Summer Europe Tour"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Trip Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Tell us about your trip..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          disabled={isLoading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
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
                          disabled={isLoading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          disabled={(date) => startDate ? date < startDate : false}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Destinations Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Destinations</Label>
                    <span className="text-sm text-muted-foreground">
                      {destinations.length} destination{destinations.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Existing Destinations */}
                  {destinations.length > 0 && (
                    <div className="space-y-3">
                      {destinations.map((dest, index) => (
                        <div
                          key={dest.id}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                        >
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                            {index + 1}
                          </span>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                              placeholder="City name"
                              value={dest.name}
                              onChange={(e) => updateDestinationName(dest.id, e.target.value)}
                              disabled={isLoading}
                            />
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                value={dest.daysToStay}
                                onChange={(e) => updateDestinationDays(dest.id, parseInt(e.target.value) || 1)}
                                className="w-20"
                                disabled={isLoading}
                              />
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                day{dest.daysToStay !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDestination(dest.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isLoading}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Destination */}
                  <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
                    <Label className="text-sm font-medium">Add Destination</Label>
                    <div className="flex flex-col md:flex-row gap-3">
                      <Input
                        placeholder="City name"
                        value={newDestName}
                        onChange={(e) => setNewDestName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDestination())}
                        className="flex-1"
                        disabled={isLoading}
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={newDestDays}
                          onChange={(e) => setNewDestDays(parseInt(e.target.value) || 1)}
                          className="w-20"
                          disabled={isLoading}
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          day{newDestDays !== 1 ? 's' : ''}
                        </span>
                        <Button
                          type="button"
                          onClick={addDestination}
                          size="sm"
                          disabled={!newDestName.trim() || isLoading}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Creating..." : "Create Trip"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/")}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
