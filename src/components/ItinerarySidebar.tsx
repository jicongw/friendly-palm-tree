"use client"

import { format } from "date-fns"
import { PlaneIcon, BedIcon, MapPinIcon, XIcon } from "lucide-react"
import { ItineraryType } from "@prisma/client"
import { Button } from "@/components/ui/button"

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
  }
}

const getItemColor = (type: ItineraryType) => {
  switch (type) {
    case ItineraryType.TRANSPORTATION:
      return "text-blue-600"
    case ItineraryType.LODGING:
      return "text-purple-600"
    case ItineraryType.ACTIVITY:
      return "text-green-600"
  }
}

const getItemTitle = (item: ItineraryItem) => {
  switch (item.type) {
    case ItineraryType.TRANSPORTATION:
      return `${item.departCity} → ${item.arriveCity}`
    case ItineraryType.LODGING:
      return item.lodgingName || "Lodging"
    case ItineraryType.ACTIVITY:
      return item.activityName || "Activity"
  }
}

const getItemTime = (item: ItineraryItem) => {
  switch (item.type) {
    case ItineraryType.TRANSPORTATION:
      return item.departTime ? new Date(item.departTime) : null
    case ItineraryType.LODGING:
      return item.checkinTime ? new Date(item.checkinTime) : null
    case ItineraryType.ACTIVITY:
      return item.startTime ? new Date(item.startTime) : null
  }
}

export function ItinerarySidebar({ items, isOpen, onClose, activeItemId, onItemClick }: ItinerarySidebarProps) {
  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          fixed lg:sticky top-[73px] left-0 h-[calc(100vh-73px)]
          w-64 bg-white border-r shadow-lg lg:shadow-none
          transition-transform duration-300 ease-in-out
          z-20 overflow-y-auto
        `}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onClose}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet</p>
          ) : (
            <nav className="space-y-1">
              {items
                .sort((a, b) => a.order - b.order)
                .map((item) => {
                  const itemTime = getItemTime(item)
                  return (
                    <button
                      key={item.id}
                      onClick={() => onItemClick(item.id)}
                      className={`
                        w-full text-left px-3 py-2 rounded-md text-sm
                        transition-colors duration-150
                        ${activeItemId === item.id
                          ? "bg-blue-100 text-blue-900"
                          : "hover:bg-gray-100 text-gray-700"
                        }
                      `}
                    >
                      <div className="flex items-start gap-2">
                        <span className={getItemColor(item.type)}>
                          {getItemIcon(item.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {getItemTitle(item)}
                          </div>
                          {itemTime && (
                            <div className="text-xs text-muted-foreground">
                              {format(itemTime, "MMM d, h:mm a")}
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
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}
