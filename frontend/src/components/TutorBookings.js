// This component displays all bookings for a specific tutor
// It shows a table with all the tutoring sessions the tutor has scheduled

// Import React and the hooks needed
import React, { useEffect, useState, useCallback } from "react";
// Import axios for making HTTP requests to the backend
import axios from "axios";

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
      const response = await axios.get(`http://127.0.0.1:5000/api/bookings/tutor/${tutorId}`);
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
  }, [tutorId, fetchBookings]);  // Include both tutorId and fetchBookings in dependencies

  //  - This returns the HTML/JSX that gets displayed
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        {/* Header with title, count, and refresh button */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="card-title mb-1 fw-bold">Tutor Bookings</h3>
            {/* Show booking count if not loading and no error */}
            {!loading && !error && (
              <small className="text-muted">
                {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} scheduled
              </small>
            )}
          </div>
          {/* Refresh button to reload the bookings */}
          <button 
            className="btn btn-outline-primary btn-sm" 
            onClick={fetchBookings}  // Call fetchBookings when clicked
            disabled={loading}  // Disable button while loading
            title="Refresh bookings"
          >
            {/* Show loading spinner if loading, otherwise show "Refresh" */}
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              "Refresh"
            )}
          </button>
        </div>

        {/* Show loading message if fetching data */}
        {loading && (
          <div className="alert alert-info d-flex align-items-center">
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Loading bookings...
          </div>
        )}
        
        {/* Show error message if there's an error */}
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* Show empty state if no bookings found (and not loading and no error) */}
        {bookings.length === 0 && !loading && !error ? (
          <div className="text-center py-5">
            <h5 className="fw-semibold mb-2">No Bookings Yet</h5>
            <p className="text-muted mb-0">
              This tutor doesn't have any scheduled sessions yet.
            </p>
          </div>
        ) : (
          /* Show table of bookings if there are any */
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
                </tr>
              </thead>
              <tbody>
                {/* Loop through each booking and create a table row */}
                {bookings.map((booking) => (
                  <tr key={booking.booking_id}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


// Export this component so it can be imported and used in other files
export default TutorBookings;
