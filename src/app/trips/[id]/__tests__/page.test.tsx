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
  destinations: [
    {
      id: "dest-1",
      name: "Paris",
      daysToStay: 5,
      order: 0,
      transportationType: "flight",
      transportationDetails: "AF456",
      transportationNotes: "Check-in 2 hours early",
    },
    {
      id: "dest-2",
      name: "London",
      daysToStay: 3,
      order: 1,
      transportationType: "train",
      transportationDetails: "Eurostar 9012",
      transportationNotes: null,
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
    expect(screen.getByText("Paris")).toBeInTheDocument()
    expect(screen.getByText("London")).toBeInTheDocument()
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

  it("should have Edit and Delete buttons in view mode", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument()
  })

  it("should enter edit mode when Edit button is clicked", async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    const editButton = screen.getByRole("button", { name: /Edit/i })
    await user.click(editButton)

    // In edit mode, Save and Cancel buttons should appear
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Save/i })).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument()
  })

  it("should show delete confirmation dialog", async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    const deleteButton = screen.getByRole("button", { name: /Delete/i })
    await user.click(deleteButton)

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText("Are you sure?")).toBeInTheDocument()
    })

    expect(screen.getByText(/permanently delete/i)).toBeInTheDocument()
  })

  it("should delete trip and redirect to /trips on confirmation", async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>

    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Click delete button
    const deleteButton = screen.getByRole("button", { name: /Delete/i })
    await user.click(deleteButton)

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByText("Are you sure?")).toBeInTheDocument()
    })

    // Mock the DELETE request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    const confirmButton = screen.getByRole("button", { name: /Delete Trip/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/trips")
    }, { timeout: 3000 })
  })

  it("should cancel delete confirmation", async () => {
    const user = userEvent.setup()
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Click delete button
    const deleteButton = screen.getByRole("button", { name: /Delete/i })
    await user.click(deleteButton)

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByText("Are you sure?")).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole("button", { name: /Cancel/i })
    await user.click(cancelButton)

    // Dialog should close, trip should still be visible
    await waitFor(() => {
      expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument()
    })
    expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
  })

  it("should display destinations with correct days", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText("Paris")).toBeInTheDocument()
    expect(screen.getByText("5 days")).toBeInTheDocument()
    expect(screen.getByText("London")).toBeInTheDocument()
    expect(screen.getByText("3 days")).toBeInTheDocument()
  })

  it("should show total days for all destinations", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Paris: 5 days, London: 3 days = 8 total
    expect(screen.getByText(/8 days/i)).toBeInTheDocument()
  })

  it("should handle API error gracefully", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    const mockAlert = alert as jest.MockedFunction<typeof alert>

    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith("Failed to load trip. Please try again.")
    }, { timeout: 3000 })
  })

  it("should display calculated dates for destinations", async () => {
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

    // Verify both destinations are shown with their dates
    expect(screen.getByText("Paris")).toBeInTheDocument()
    expect(screen.getByText("London")).toBeInTheDocument()
  })

  it("should display transportation details in view mode", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check Paris transportation
    expect(screen.getByText(/flight/i)).toBeInTheDocument()
    expect(screen.getByText("AF456")).toBeInTheDocument()
    expect(screen.getByText("Check-in 2 hours early")).toBeInTheDocument()

    // Check London transportation
    expect(screen.getByText(/train/i)).toBeInTheDocument()
    expect(screen.getByText("Eurostar 9012")).toBeInTheDocument()
  })

  it("should show transportation fields in edit mode", async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrip,
    } as Response)

    const user = userEvent.setup()

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Click Edit button
    const editButton = screen.getByRole("button", { name: /Edit/i })
    await act(async () => {
      await user.click(editButton)
    })

    // Check that transportation fields are present in edit mode
    await waitFor(() => {
      // Transportation Details section should be expandable
      expect(screen.getAllByText(/Transportation Details/i).length).toBeGreaterThan(0)
    })
  })

  it("should handle destinations without transportation details", async () => {
    const tripWithoutTransportation = {
      ...mockTrip,
      destinations: [
        {
          id: "dest-1",
          name: "Paris",
          daysToStay: 5,
          order: 0,
          transportationType: null,
          transportationDetails: null,
          transportationNotes: null,
        },
      ],
    }

    const mockFetch = fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => tripWithoutTransportation,
    } as Response)

    render(<TripDetailPage params={Promise.resolve({ id: "trip-123" })} />)

    await waitFor(() => {
      expect(screen.getByText("Summer Vacation")).toBeInTheDocument()
    }, { timeout: 3000 })

    // Paris should still be displayed
    expect(screen.getByText("Paris")).toBeInTheDocument()
    // But no transportation type badge should be shown
    const transportationBadges = screen.queryAllByText(/flight|train|bus|car|ferry/i)
    expect(transportationBadges.length).toBe(0)
  })
})
