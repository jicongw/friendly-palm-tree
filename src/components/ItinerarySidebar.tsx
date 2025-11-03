"use client"

import { useMemo, useCallback, useEffect } from "react"
import { format } from "date-fns"
import { PlaneIcon, BedIcon, MapPinIcon, XIcon } from "lucide-react"
import { ItineraryType } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Constants
const HEADER_HEIGHT = 73 // pixels
const ITEM_COLORS = {
  [ItineraryType.TRANSPORTATION]: "text-blue-600",
  [ItineraryType.LODGING]: "text-purple-600",
  [ItineraryType.ACTIVITY]: "text-green-600",
} as const

interface ItineraryItem {
  id: string
  type: ItineraryType
  order: number
  departTime?: string | null
  checkinTime?: string | null
  startTime?: string | null
  departCity?: string | null
  arriveCity?: string | null
  lodgingName?: string | null
  activityName?: string | null
}

interface ItinerarySidebarProps {
  items: ItineraryItem[]
  isOpen: boolean
  onClose: () => void
  activeItemId: string | null
  onItemClick: (itemId: string) => void
}

const getItemIcon = (type: ItineraryType) => {
  switch (type) {
    case ItineraryType.TRANSPORTATION:
      return <PlaneIcon className="h-4 w-4" />
    case ItineraryType.LODGING:
      return <BedIcon className="h-4 w-4" />
    case ItineraryType.ACTIVITY:
      return <MapPinIcon className="h-4 w-4" />
    default: {
      // Exhaustive type check
      const _exhaustive: never = type
      return null
    }
  }
}

const getItemColor = (type: ItineraryType): string => {
  return ITEM_COLORS[type] || "text-gray-600"
}

const getItemTitle = (item: ItineraryItem): string => {
  switch (item.type) {
    case ItineraryType.TRANSPORTATION:
      return `${item.departCity || "Unknown"} → ${item.arriveCity || "Unknown"}`
    case ItineraryType.LODGING:
      return item.lodgingName || "Lodging"
    case ItineraryType.ACTIVITY:
      return item.activityName || "Activity"
    default: {
      // Exhaustive type check
      const _exhaustive: never = item.type
      return "Unknown"
    }
  }
}

const getItemTime = (item: ItineraryItem): Date | null => {
  let dateString: string | null = null

  switch (item.type) {
    case ItineraryType.TRANSPORTATION:
      dateString = item.departTime
      break
    case ItineraryType.LODGING:
      dateString = item.checkinTime
      break
    case ItineraryType.ACTIVITY:
      dateString = item.startTime
      break
    default: {
      // Exhaustive type check
      const _exhaustive: never = item.type
      return null
    }
  }

  if (!dateString) return null

  try {
    const date = new Date(dateString)
    // Check if date is valid
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

const formatItemTime = (date: Date): string => {
  try {
    return format(date, "MMM d, h:mm a")
  } catch {
    return "Invalid date"
  }
}

export function ItinerarySidebar({ items, isOpen, onClose, activeItemId, onItemClick }: ItinerarySidebarProps) {
  // Memoize sorted items to avoid re-sorting on every render
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.order - b.order)
  }, [items])

  // Handle keyboard events
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  // Handle overlay keyboard interaction
  const handleOverlayKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onClose()
    }
  }, [onClose])

  return (
    <>
      {/* Sidebar */}
      <aside
        aria-label="Trip itinerary navigation"
        style={{
          top: `${HEADER_HEIGHT}px`,
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
        className={cn(
          "fixed lg:sticky left-0 z-20 overflow-y-auto",
          "w-64 md:w-72 lg:w-64 bg-white border-r",
          "shadow-lg lg:shadow-none",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onClose}
              aria-label="Close navigation sidebar"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {sortedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet</p>
          ) : (
            <nav className="space-y-1" aria-label="Itinerary items">
              {sortedItems.map((item) => {
                const itemTime = getItemTime(item)
                const itemTitle = getItemTitle(item)

                return (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(item.id)}
                    aria-label={`Navigate to ${itemTitle}`}
                    aria-current={activeItemId === item.id ? "location" : undefined}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm",
                      "transition-colors duration-150",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                      activeItemId === item.id
                        ? "bg-blue-100 text-blue-900"
                        : "hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className={getItemColor(item.type)} aria-hidden="true">
                        {getItemIcon(item.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {itemTitle}
                        </div>
                        {itemTime && (
                          <div className="text-xs text-muted-foreground">
                            {formatItemTime(itemTime)}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </nav>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close navigation sidebar"
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={onClose}
          onKeyDown={handleOverlayKeyDown}
        />
      )}
    </>
  )
}
