// This component displays all bookings for a specific tutor
// It shows a table with all the tutoring sessions the tutor has scheduled
//
// Pagination
// Reference: Bootstrap 5.3 Documentation (2025) "Pagination" — https://getbootstrap.com/docs/5.3/components/pagination/
// Used to split the bookings table across multiple pages (10 items per page).

// Import React and the hooks needed
import React, { useEffect, useState, useCallback, useMemo } from "react";
// Import axios for making HTTP requests to the backend
import axios from "axios";
import BookingMessages from "./BookingMessages"; // Iteration 4 - Import messaging component

// This component receives tutorId as a prop (passed from the parent component)
// tutorId: The ID of the tutor whose bookings I want to display
const TutorBookings = ({ tutorId }) => {
  // STATE VARIABLES - These store data that can change and update the UI

  
  // This array stores all the bookings for this tutor
  // It starts as an empty array []
  const [bookings, setBookings] = useState([]);
  
  // This booean tracks whether I'm currently loading data from the server
  // true = loading, false = not loading
  const [loading, setLoading] = useState(false);
  
  // This stores any error message I want to show to the user
  // Empty string means no error
  const [error, setError] = useState("");
  
  // Iteration 4 - Store action messages and loading states for accept/deny
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  // Iteration 4 - State for showing messages
  const [showMessagesForBooking, setShowMessagesForBooking] = useState(null);

  // Iteration 5 - Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // FUNCTIONS

  // Story 6 - Gets all bookings for this tutor from the backend
  // useCallback so it only recreates when tutorId changes
  const fetchBookings = useCallback(async () => {
    // Stop if no tutor selected
    if (!tutorId) {
      setBookings([]);
      return;
    }

    setLoading(true); // Show loading spinner
    setError("");
    try {
      // Get all bookings for this tutor from backend
      // Backend returns bookings with learner names and emails
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings/tutor/${tutorId}`);
      setBookings(response.data); // Save bookings to display in table
    } catch (err) {
      // Show error if request fails
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load bookings. Please try again later.";
      setError(message);
    } finally {
      setLoading(false); // Hide loading spinner
    }
  }, [tutorId]);

  //
  // 

  // Story 6 - Automatically fetch bookings when component loads or tutor changes
  // If the user selects a different tutor, it fetches that tutor's bookings
  useEffect(() => {
    fetchBookings();
  }, [tutorId, fetchBookings]);
  
  // Iteration 4 - Function to accept a booking
  const handleAcceptBooking = async (bookingId) => {
    setActionLoadingId(bookingId);
    setActionMessage({ type: "", text: "" });
    
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}/accept`);
      const successMsg = response.data.message || "Booking accepted successfully!";
      setActionMessage({ type: "success", text: successMsg });
      if (window.showToast) {
        window.showToast(successMsg, "success", 3000);
      }
      fetchBookings(); // Refresh the bookings list
    } catch (error) {
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to accept booking";
      setActionMessage({ type: "error", text: errorMsg });
    } finally {
      setActionLoadingId(null);
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage({ type: "", text: "" }), 3000);
    }
  };
  
  // Iteration 4 - Function to deny a booking
  const handleDenyBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to deny this booking?")) {
      return;
    }
    
    setActionLoadingId(bookingId);
    setActionMessage({ type: "", text: "" });
    
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}/deny`);
      const successMsg = response.data.message || "Booking denied successfully!";
      setActionMessage({ type: "success", text: successMsg });
      if (window.showToast) {
        window.showToast(successMsg, "success", 3000);
      }
      fetchBookings(); // Refresh the bookings list
    } catch (error) {
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to deny booking";
      setActionMessage({ type: "error", text: errorMsg });
    } finally {
      setActionLoadingId(null);
      // Clear message after 3 seconds
      setTimeout(() => setActionMessage({ type: "", text: "" }), 3000);
    }
  };  // Include both tutorId and fetchBookings in dependencies

  // UX Improvement - Calculate quick stats
  const stats = useMemo(() => {
    if (!bookings.length) return null;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'accepted').length;
    const upcoming = bookings.filter(b => {
      const bookingDate = new Date(b.session_date);
      if (b.session_time) {
        const [hours, minutes] = b.session_time.split(':').map(Number);
        bookingDate.setHours(hours, minutes);
      }
      return bookingDate > new Date() && (b.status === 'confirmed' || b.status === 'accepted');
    }).length;
    return { pending, confirmed, upcoming, total: bookings.length };
  }, [bookings]);

  //  - This returns the HTML/JSX that gets displayed
  return (
    <div>
      {/* Professional Dashboard Overview */}
      {!loading && !error && stats && (
        <div className="row g-4 mb-5">
          <div className="col-md-3">
            <div className="stats-card bg-primary text-white">
              <div className="value">{stats.total}</div>
              <div className="label">Total Bookings</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card bg-success text-white">
              <div className="value">{stats.confirmed}</div>
              <div className="label">Confirmed</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card bg-warning text-dark">
              <div className="value">{stats.pending}</div>
              <div className="label">Pending</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="stats-card bg-info text-white">
              <div className="value">{stats.upcoming}</div>
              <div className="label">Upcoming</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {/* Professional Page Header */}
          <div className="page-header mb-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h2 className="mb-2">My Bookings</h2>
                {!loading && !error && (
                  <p className="text-muted mb-0">
                    {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} scheduled
                  </p>
                )}
              </div>
              {/* Refresh button */}
              <button 
                className="btn btn-outline-primary btn-sm" 
                onClick={fetchBookings}
                disabled={loading}
                title="Refresh bookings"
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>

        {/* UX Improvement - Skeleton loader for better loading state */}
        {loading && (
          <div>
            <div className="alert alert-info d-flex align-items-center mb-3">
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Loading bookings...
            </div>
            {/* Skeleton table */}
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th><div className="skeleton" style={{ height: "20px", width: "80px" }}></div></th>
                    <th><div className="skeleton" style={{ height: "20px", width: "60px" }}></div></th>
                    <th><div className="skeleton" style={{ height: "20px", width: "70px" }}></div></th>
                    <th><div className="skeleton" style={{ height: "20px", width: "100px" }}></div></th>
                    <th><div className="skeleton" style={{ height: "20px", width: "120px" }}></div></th>
                    <th><div className="skeleton" style={{ height: "20px", width: "70px" }}></div></th>
                    <th><div className="skeleton" style={{ height: "20px", width: "100px" }}></div></th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td><div className="skeleton" style={{ height: "16px", width: "100px" }}></div></td>
                      <td><div className="skeleton" style={{ height: "16px", width: "60px" }}></div></td>
                      <td><div className="skeleton" style={{ height: "16px", width: "50px" }}></div></td>
                      <td><div className="skeleton" style={{ height: "16px", width: "120px" }}></div></td>
                      <td><div className="skeleton" style={{ height: "16px", width: "150px" }}></div></td>
                      <td><div className="skeleton" style={{ height: "16px", width: "70px" }}></div></td>
                      <td><div className="skeleton" style={{ height: "16px", width: "120px" }}></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Show error message if there's an error */}
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        
        {/* Iteration 4 - Show action messages (success/error) */}
        {actionMessage.text && (
          <div className={`alert alert-${actionMessage.type === "success" ? "success" : "danger"} alert-dismissible fade show`}>
            {actionMessage.text}
            <button
              type="button"
              className="btn-close"
              onClick={() => setActionMessage({ type: "", text: "" })}
              aria-label="Close"
            ></button>
          </div>
        )}

        {/* UX Improvement - Enhanced empty state */}
        {bookings.length === 0 && !loading && !error ? (
          <div className="text-center py-5">
            <div className="mb-4" style={{ fontSize: "4rem", opacity: 0.3 }}>
              <i className="bi bi-calendar-x"></i>
            </div>
            <h5 className="fw-semibold mb-2">No Bookings Yet</h5>
            <p className="text-muted mb-4">
              You don't have any scheduled sessions yet. Once learners book sessions with you, they'll appear here.
            </p>
            <div className="alert alert-info d-inline-block">
              <small>
                <i className="bi bi-info-circle me-1"></i>
                Make sure your availability is set up so learners can book sessions with you.
              </small>
            </div>
          </div>
        ) : (
          /* Show table of bookings if there are any */
          <>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Duration</th>
                  <th>Learner</th>
                  <th>Email</th>
                  <th>Status</th>
                  {/* Iteration 4 - Add Actions column for accept/deny */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Loop through each booking and create a table row */}
                {/* Iteration 5 - Paginated slice */}
                {bookings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((booking) => (
                  <React.Fragment key={booking.booking_id}>
                  <tr>
                    {/* Format the date nicely (e.g., "Mon, Jan 15, 2024") */}
                    <td className="align-middle">
                      <strong>{new Date(booking.session_date).toLocaleDateString('en-US', { 
                        weekday: 'short',  // Show day of week (Mon, Tue, etc.)
                        year: 'numeric',   // Show year (2024)
                        month: 'short',    // Show month (Jan, Feb, etc.)
                        day: 'numeric'     // Show day (15)
                      })}</strong>
                    </td>
                    {/* Show the session time */}
                    <td className="align-middle">{booking.session_time}</td>
                    {/* Show duration as a badge */}
                    <td className="align-middle">
                      <span className="badge bg-secondary">{booking.duration} min</span>
                    </td>
                    {/* Show learner's name */}
                    <td className="align-middle">
                      <strong>{booking.learner_name}</strong>
                    </td>
                    {/* Show learner's email as a clickable mailto link */}
                    <td className="align-middle">
                      <a href={`mailto:${booking.learner_email}`} className="text-decoration-none">
                        {booking.learner_email}
                      </a>
                    </td>
                    {/* Show status with different colors based on status value */}
                    <td className="align-middle">
                      <span className={`badge ${
                        booking.status === "cancelled" 
                          ? "bg-danger"  // Red for cancelled
                          : booking.status === "rescheduled" 
                          ? "bg-warning text-dark"  // Yellow for rescheduled
                          : booking.status === "pending"
                          ? "bg-secondary"  // Gray for pending
                          : "bg-success"  // Green for confirmed
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    {/* Iteration 4 - Add accept/deny buttons for pending bookings and messages for confirmed */}
                    <td className="align-middle">
                      {booking.status === "pending" ? (
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => handleAcceptBooking(booking.booking_id)}
                            disabled={actionLoadingId === booking.booking_id}
                            title="Accept this booking"
                          >
                            {actionLoadingId === booking.booking_id ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              "Accept"
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleDenyBooking(booking.booking_id)}
                            disabled={actionLoadingId === booking.booking_id}
                            title="Deny this booking"
                          >
                            {actionLoadingId === booking.booking_id ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              "Deny"
                            )}
                          </button>
                        </div>
                      ) : (booking.status === "confirmed" || booking.status === "accepted") ? (
                        <div className="d-flex gap-2 flex-wrap">
                          {/* Iteration 7 - Join Teams Meeting button */}
                          {booking.meeting_url && (
                            <a
                              href={booking.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-primary"
                              title="Join Teams Meeting"
                            >
                              Join Meeting
                            </a>
                          )}
                          <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => setShowMessagesForBooking(
                              showMessagesForBooking === booking.booking_id ? null : booking.booking_id
                            )}
                            title="View messages"
                          >
                            {showMessagesForBooking === booking.booking_id ? "Hide Messages" : "Messages"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Iteration 4 - Messages row (only shown for the selected booking) */}
                  {showMessagesForBooking === booking.booking_id && (
                    <tr>
                      <td colSpan="7" className="p-0">
                        <div className="p-3">
                          <BookingMessages
                            bookingId={booking.booking_id}
                            userId={tutorId}
                            userRole="tutor"
                            bookingStatus={booking.status}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Iteration 5 - Pagination controls */}
          {Math.ceil(bookings.length / ITEMS_PER_PAGE) > 1 && (
            <nav className="mt-3 d-flex justify-content-center">
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                </li>
                {Array.from({ length: Math.ceil(bookings.length / ITEMS_PER_PAGE) }, (_, i) => (
                  <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === Math.ceil(bookings.length / ITEMS_PER_PAGE) ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                </li>
              </ul>
            </nav>
          )}
          </>
        )}
      </div>
    </div>
    </div>
  );
};


// Export this component so it can be imported and used in other files
export default TutorBookings;
