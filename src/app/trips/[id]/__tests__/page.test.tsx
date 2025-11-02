import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useRouter } from "next/navigation"
import TripDetailPage from "../page"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()
global.alert = jest.fn()

const mockPush = jest.fn()
const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>

const mockTrip = {
  id: "trip-123",
  title: "Summer Vacation",
  description: "A fun trip to Europe",
  startDate: "2025-06-01T00:00:00.000Z",
  endDate: "2025-06-15T00:00:00.000Z",
  homeCity: "New York",
  destinations: [
    {
      id: "dest-1",
      city: "Paris",
      daysToStay: 5,
      order: 0,
    },
    {
      id: "dest-2",
      city: "London",
      daysToStay: 3,
      order: 1,
    },
  ],
  itineraryItems: [
    {
      id: "item-1",
      type: "TRANSPORTATION",
      order: 0,
      transportationType: "flight",
      departCity: "New York",
      arriveCity: "Paris",
      departTime: "2025-06-01T10:00:00.000Z",
      arriveTime: "2025-06-01T22:00:00.000Z",
      description: "AF456 - Check-in 2 hours early",
      cost: 800,
      confirmationEmailLink: null,
      lodgingName: null,
      checkinTime: null,
      checkoutTime: null,
      lodgingAddress: null,
      activityName: null,
      startTime: null,
      duration: null,
      activityAddress: null,
      activityDescription: null,
    },
    {
      id: "item-2",
      type: "TRANSPORTATION",
      order: 1,
      transportationType: "train",
      departCity: "Paris",
      arriveCity: "London",
      departTime: "2025-06-06T09:00:00.000Z",
      arriveTime: "2025-06-06T11:30:00.000Z",
      description: "Eurostar 9012",
      cost: 150,
      confirmationEmailLink: null,
      lodgingName: null,
      checkinTime: null,
      checkoutTime: null,
      lodgingAddress: null,
      activityName: null,
      startTime: null,
      duration: null,
      activityAddress: null,
      activityDescription: null,
    },
  ],
}

describe("TripDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any)
  })

  it("should fetch and display trip details", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText("A fun trip to Europe")).toBeInTheDocument()
    // Paris and London appear multiple times in the component
    expect(screen.getAllByText(/Paris/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/London/i).length).toBeGreaterThan(0)
  })

  it("should redirect to /trips if trip not found", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-999" })} />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/trips")
    }, { timeout: 3000 })
  })

  it("should have edit and delete buttons for itinerary items", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Should have edit and delete buttons for each itinerary item
    const editButtons = screen.getAllByLabelText(/Edit.*item/i)
    const deleteButtons = screen.getAllByLabelText(/Delete.*item/i)
    expect(editButtons.length).toBeGreaterThan(0)
    expect(deleteButtons.length).toBeGreaterThan(0)
  })

  it("should show add buttons for itinerary items", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Should have buttons to add new itinerary items
    expect(screen.getByRole("button", { name: /Add Transportation/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Add Lodging/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Add Activity/i })).toBeInTheDocument()
  })

  it("should display trip header information", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check trip details are displayed
    expect(screen.getByText("A fun trip to Europe")).toBeInTheDocument()
    // New York appears multiple times (home city + itinerary items)
    expect(screen.getAllByText(/New York/i).length).toBeGreaterThan(0)
  })

  it("should display itinerary items", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check that itinerary items are displayed (These texts may appear multiple times)
    expect(screen.getAllByText(/Transportation/i).length).toBeGreaterThan(0)
    const newYorkParis = screen.queryAllByText(/New York.*Paris/i)
    const parisLondon = screen.queryAllByText(/Paris.*London/i)
    expect(newYorkParis.length).toBeGreaterThan(0)
    expect(parisLondon.length).toBeGreaterThan(0)
  })

  it("should display total cost", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Should display total cost (800 + 150 = 950)
    expect(screen.getByText(/\$950\.00/i)).toBeInTheDocument()
  })

  it("should display destinations", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check destinations are displayed (using getAllByText since they appear multiple times)
    expect(screen.getAllByText(/Paris/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/London/i).length).toBeGreaterThan(0)
  })

  it("should display destination route", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Should show destinations in the route
    const destinationTexts = screen.getAllByText(/Paris|London/i)
    expect(destinationTexts.length).toBeGreaterThan(0)
  })

  it("should handle API error gracefully", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>

    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    // Should not crash and should finish loading
    await waitFor(() => {
      expect(screen.queryByText("Loading trip details...")).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it("should display trip dates", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check that date information is displayed (format may vary)
    // Looking for "Jun" to verify month is shown
    const dateText = screen.getAllByText(/Jun/i)
    expect(dateText.length).toBeGreaterThan(0)
  })

  it("should display transportation details", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check transportation is displayed (Flight and Train appear as text, not necessarily as separate elements)
    expect(screen.getAllByText(/Flight|Train/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/AF456 - Check-in 2 hours early/i)).toBeInTheDocument()
    expect(screen.getByText(/Eurostar 9012/i)).toBeInTheDocument()
  })

  it("should display Back to Trips button", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Should have Back to Trips button
    expect(screen.getByRole("link", { name: /Back to Trips/i })).toBeInTheDocument()
  })

  it("should handle trip with no itinerary items", async () => {
    const tripWithoutItems = {
      ...mockTrip,
      itineraryItems: [],
    }

    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => tripWithoutItems,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Should show message about no itinerary items
    expect(screen.getByText(/No itinerary items yet/i)).toBeInTheDocument()
  })
})
