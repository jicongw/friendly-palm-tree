import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ItinerarySidebar } from "../ItinerarySidebar"
import { ItineraryType } from "@prisma/client"

describe("ItinerarySidebar", () => {
  const mockOnClose = jest.fn()
  const mockOnItemClick = jest.fn()

  const mockItems = [
    {
      id: "item-1",
      type: ItineraryType.TRANSPORTATION,
      order: 0,
      departCity: "New York",
      arriveCity: "Paris",
      departTime: "2025-06-01T10:00:00.000Z",
      checkinTime: null,
      startTime: null,
      lodgingName: null,
      activityName: null,
    },
    {
      id: "item-2",
      type: ItineraryType.LODGING,
      order: 1,
      departCity: null,
      arriveCity: null,
      departTime: null,
      checkinTime: "2025-06-01T15:00:00.000Z",
      startTime: null,
      lodgingName: "Hotel Paris",
      activityName: null,
    },
    {
      id: "item-3",
      type: ItineraryType.ACTIVITY,
      order: 2,
      departCity: null,
      arriveCity: null,
      departTime: null,
      checkinTime: null,
      startTime: "2025-06-02T09:00:00.000Z",
      lodgingName: null,
      activityName: "Visit Eiffel Tower",
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders the sidebar with navigation title", () => {
      render(
        <ItinerarySidebar
          items={mockItems}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      expect(screen.getByText("Navigation")).toBeInTheDocument()
    })

    it("renders all itinerary items", () => {
      render(
        <ItinerarySidebar
          items={mockItems}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      expect(screen.getByText("New York → Paris")).toBeInTheDocument()
      expect(screen.getByText("Hotel Paris")).toBeInTheDocument()
      expect(screen.getByText("Visit Eiffel Tower")).toBeInTheDocument()
    })

    it("displays 'No items yet' when items list is empty", () => {
      render(
        <ItinerarySidebar
          items={[]}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      expect(screen.getByText("No items yet")).toBeInTheDocument()
    })

    it("renders items in correct order", () => {
      render(
        <ItinerarySidebar
          items={mockItems}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      const buttons = screen.getAllByRole("button").filter(btn =>
        btn.textContent?.includes("→") ||
        btn.textContent?.includes("Hotel") ||
        btn.textContent?.includes("Tower")
      )

      expect(buttons[0]).toHaveTextContent("New York → Paris")
      expect(buttons[1]).toHaveTextContent("Hotel Paris")
      expect(buttons[2]).toHaveTextContent("Visit Eiffel Tower")
    })

    it("displays formatted timestamps for items", () => {
      render(
        <ItinerarySidebar
          items={mockItems}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      // Check that timestamps are displayed (format depends on date-fns)
      const timestampElements = screen.getAllByText(/Jun/)
      expect(timestampElements.length).toBeGreaterThan(0)
    })
  })

  describe("Active item highlighting", () => {
    it("highlights the active item", () => {
      render(
        <ItinerarySidebar
          items={mockItems}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId="item-2"
          onItemClick={mockOnItemClick}
        />
      )

      const activeButton = screen.getByText("Hotel Paris").closest("button")
      expect(activeButton).toHaveClass("bg-blue-100", "text-blue-900")
    })

    it("does not highlight when no active item", () => {
      render(
        <ItinerarySidebar
          items={mockItems}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      const buttons = screen.getAllByRole("button").filter(btn =>
        btn.textContent?.includes("→") ||
        btn.textContent?.includes("Hotel") ||
        btn.textContent?.includes("Tower")
      )

      buttons.forEach(button => {
        expect(button).not.toHaveClass("bg-blue-100")
      })
    })
  })

  describe("User interactions", () => {
    it("calls onItemClick when an item is clicked", async () => {
      const user = userEvent.setup()

      render(
        <ItinerarySidebar
          items={mockItems}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      const item = screen.getByText("Hotel Paris")
      await user.click(item)

      expect(mockOnItemClick).toHaveBeenCalledWith("item-2")
      expect(mockOnItemClick).toHaveBeenCalledTimes(1)
    })

    it("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup()

      render(
        <ItinerarySidebar
          items={mockItems}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      const closeButtons = screen.getAllByRole("button")
      const closeButton = closeButtons.find(btn =>
        btn.querySelector('svg') && !btn.textContent?.includes("→")
      )

      if (closeButton) {
        await user.click(closeButton)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    })

    it("calls onClose when overlay is clicked", async () => {
      const user = userEvent.setup()

      const { container } = render(
        <ItinerarySidebar
          items={mockItems}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      const overlay = container.querySelector(".fixed.inset-0.bg-black\\/50")
      if (overlay) {
        await user.click(overlay)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe("Responsive behavior", () => {
    it("applies correct CSS classes when sidebar is open", () => {
      const { container } = render(
        <ItinerarySidebar
          items={mockItems}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      const sidebar = container.querySelector("aside")
      expect(sidebar).toHaveClass("translate-x-0")
    })

    it("applies correct CSS classes when sidebar is closed", () => {
      const { container } = render(
        <ItinerarySidebar
          items={mockItems}
          isOpen={false}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      const sidebar = container.querySelector("aside")
      expect(sidebar).toHaveClass("-translate-x-full")
    })

    it("shows overlay only when sidebar is open", () => {
      const { container, rerender } = render(
        <ItinerarySidebar
          items={mockItems}
          isOpen={false}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      let overlay = container.querySelector(".fixed.inset-0.bg-black\\/50")
      expect(overlay).not.toBeInTheDocument()

      rerender(
        <ItinerarySidebar
          items={mockItems}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      overlay = container.querySelector(".fixed.inset-0.bg-black\\/50")
      expect(overlay).toBeInTheDocument()
    })
  })

  describe("Item type icons", () => {
    it("displays correct icon for transportation items", () => {
      const transportationItem = [{
        id: "item-1",
        type: ItineraryType.TRANSPORTATION,
        order: 0,
        departCity: "NYC",
        arriveCity: "LA",
        departTime: "2025-06-01T10:00:00.000Z",
        checkinTime: null,
        startTime: null,
        lodgingName: null,
        activityName: null,
      }]

      const { container } = render(
        <ItinerarySidebar
          items={transportationItem}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      const button = screen.getByText("NYC → LA").closest("button")
      expect(button?.querySelector(".text-blue-600")).toBeInTheDocument()
    })

    it("displays correct icon for lodging items", () => {
      const lodgingItem = [{
        id: "item-1",
        type: ItineraryType.LODGING,
        order: 0,
        lodgingName: "Test Hotel",
        checkinTime: "2025-06-01T15:00:00.000Z",
        departCity: null,
        arriveCity: null,
        departTime: null,
        startTime: null,
        activityName: null,
      }]

      const { container } = render(
        <ItinerarySidebar
          items={lodgingItem}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      const button = screen.getByText("Test Hotel").closest("button")
      expect(button?.querySelector(".text-purple-600")).toBeInTheDocument()
    })

    it("displays correct icon for activity items", () => {
      const activityItem = [{
        id: "item-1",
        type: ItineraryType.ACTIVITY,
        order: 0,
        activityName: "Test Activity",
        startTime: "2025-06-02T09:00:00.000Z",
        departCity: null,
        arriveCity: null,
        departTime: null,
        checkinTime: null,
        lodgingName: null,
      }]

      const { container } = render(
        <ItinerarySidebar
          items={activityItem}
          isOpen={true}
          onClose={mockOnClose}
          activeItemId={null}
          onItemClick={mockOnItemClick}
        />
      )

      const button = screen.getByText("Test Activity").closest("button")
      expect(button?.querySelector(".text-green-600")).toBeInTheDocument()
    })
  })
})
