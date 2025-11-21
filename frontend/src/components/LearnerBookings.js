// This component displays all bookings for a specific learner 
// It shows a table with all the tutoring sessions the learner has booked

// Import React and the hooks needed
import React, { useEffect, useState, useCallback } from "react";
// Import axios for making HTTP requests to the backend
import axios from "axios";

// This component receives learnerId as a prop 
// learnerId= The ID of the learner whose bookings I want to display
const LearnerBookings = ({ learnerId }) => {
  // STATE VARIABLES
  
  // This array stores all the bookings for this learner
  // It starts as an empty array []
  const [bookings, setBookings] = useState([]);
  
  // This boolean tracks whether I'm currently loading data from the server
  // true = loading, false = not loading
  const [loading, setLoading] = useState(false);
  
  // This stores any error message I want to show to the user
  // Empty string means no error
  const [error, setError] = useState("");

  // This holds temporary success/error messages for actions like cancel/reschedule
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  // This keeps track of which booking the learner is currently rescheduling
  const [rescheduleBookingId, setRescheduleBookingId] = useState(null);

  // This stores the form values (date/time) for rescheduling
  const [rescheduleForm, setRescheduleForm] = useState({
    session_date: "",
    session_time: "",
  });

  // This holds the booking ID that currently has an action in progress (to disable buttons)
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // FUNCTIONS

  // Story 10 - Gets all bookings for this learner from backend
  const fetchBookings = useCallback(async () => {
    // Stop if no learner selected
    if (!learnerId) {
      setBookings([]);
      return;
    }

    setLoading(true); // Show loading spinner
    setError("");

    try {
      // Get bookings from backend
      // Backend returns bookings with tutor names, modules, and rates
      const response = await axios.get(`http://127.0.0.1:5000/api/bookings/learner/${learnerId}`);
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
  }, [learnerId]);

  // Story 7 - Opens the reschedule form for a specific booking
  // When user clicks "Reschedule", this shows the form below that booking
  const handleStartReschedule = (booking) => {
    setActionMessage({ type: "", text: "" });  // Clear old messages
    setRescheduleBookingId(booking.booking_id); // Track which booking is being rescheduled
    // Pre-fill form with current date and time
    setRescheduleForm({
      session_date: booking.session_date,
      session_time: booking.session_time,
    });
  };

  // This function cancels a booking by calling the backend API
  const handleCancelBooking = async (bookingId) => {
    // Show confirmation popup - if user clicks cancel, stop here
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    // Clear old messages 
    setActionMessage({ type: "", text: "" });
    setActionLoadingId(bookingId);
    try {
      // Send request to backend to cancel this booking
      await axios.put(`http://127.0.0.1:5000/api/bookings/${bookingId}/cancel`);
      // Show success message and refresh the list
      setActionMessage({ type: "success", text: "Booking cancelled successfully." });
      fetchBookings();
    } catch (err) {
      // Get error message and show it to user
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to cancel booking. Please try again.";
      setActionMessage({ type: "error", text: message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Story 7 - Handles rescheduling a booking
  // Updates the booking with new date and time
  const handleRescheduleSubmit = async (event, bookingId) => {
    event.preventDefault(); // Stop form from refreshing

    // Check date and time are filled before sending
    if (!rescheduleForm.session_date || !rescheduleForm.session_time) {
      setActionMessage({ type: "error", text: "Please select both a date and time." });
      return;
    }

    setActionMessage({ type: "", text: "" });
    setActionLoadingId(bookingId); // Show loading on this button
    try {
      // Send new date/time to backend
      // Backend updates the booking and changes status to 'rescheduled'
      await axios.put(`http://127.0.0.1:5000/api/bookings/${bookingId}/reschedule`, {
        session_date: rescheduleForm.session_date,
        session_time: rescheduleForm.session_time,
      });
      // If successful, show message and close form
      setActionMessage({ type: "success", text: "Booking rescheduled successfully." });
      setRescheduleBookingId(null); // Close the form
      setRescheduleForm({ session_date: "", session_time: "" }); // Clear form
      fetchBookings(); // Refresh list to show updated booking
    } catch (err) {
      // Show error if request fails
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to reschedule booking. Please try again.";
      setActionMessage({ type: "error", text: message });
    } finally {
      setActionLoadingId(null); // Hide loading spinner
    }
  };

  // USE EFFECT HOOK

  // Story 10 - Automatically fetch bookings when component loads or learner changes
  // If the user selects a different learner, it fetches that learner's bookings
  useEffect(() => {
    fetchBookings();
  }, [learnerId, fetchBookings]);  // Include both learnerId and fetchBookings in dependencies

  // RENDER - This returns the HTML/JSX that gets displayed
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        {/* Header with title, count, and refresh button */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="card-title mb-1 fw-bold">My Bookings</h3>
            {/* Show booking count if not loading and no error */}
            {!loading && !error && (
              <small className="text-muted">
                {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} found
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

        {/* Show action success/error messages for cancel/reschedule */}
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

        {/* Show empty state if no bookings found (and not loading and no error) */}
        {bookings.length === 0 && !loading && !error ? (
          <div className="text-center py-5">
            <h5 className="fw-semibold mb-2">No Bookings Yet</h5>
            <p className="text-muted mb-0">
              You haven't booked any tutoring sessions yet. Start searching for tutors!
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
                  <th>Tutor</th>
                  <th>Modules</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Loop through each booking and create a table row */}
                {bookings.map((booking) => (
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
                      {/* Show tutor's name */}
                      <td className="align-middle">
                        <strong>{booking.tutor_name}</strong>
                      </td>
                      {/* Show modules as a badge */}
                      <td className="align-middle">
                        <span className="badge bg-info text-dark">{booking.tutor_modules}</span>
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
                      {/* Action buttons */}
                      <td className="align-middle text-end">
                        <div className="d-flex flex-wrap gap-2 justify-content-end">
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleStartReschedule(booking)}
                            disabled={actionLoadingId === booking.booking_id}
                          >
                            Reschedule
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleCancelBooking(booking.booking_id)}
                            disabled={actionLoadingId === booking.booking_id}
                          >
                            {actionLoadingId === booking.booking_id ? "Processing..." : "Cancel"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Reschedule form row (only shown for the selected booking) */}
                    {rescheduleBookingId === booking.booking_id && (
                      <tr className="bg-light">
                        <td colSpan="7">
                          <form className="row g-3 align-items-end" onSubmit={(event) => handleRescheduleSubmit(event, booking.booking_id)}>
                            <div className="col-md-4">
                              <label className="form-label fw-semibold" htmlFor={`reschedule-date-${booking.booking_id}`}>
                                New Date
                              </label>
                              <input
                                type="date"
                                className="form-control"
                                id={`reschedule-date-${booking.booking_id}`}
                                value={rescheduleForm.session_date}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={(e) => setRescheduleForm((prev) => ({ ...prev, session_date: e.target.value }))}
                                required
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label fw-semibold" htmlFor={`reschedule-time-${booking.booking_id}`}>
                                New Time
                              </label>
                              <input
                                type="time"
                                className="form-control"
                                id={`reschedule-time-${booking.booking_id}`}
                                value={rescheduleForm.session_time}
                                onChange={(e) => setRescheduleForm((prev) => ({ ...prev, session_time: e.target.value }))}
                                required
                              />
                            </div>
                            <div className="col-md-4 d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-secondary flex-fill"
                                onClick={() => {
                                  setRescheduleBookingId(null);
                                  setRescheduleForm({ session_date: "", session_time: "" });
                                }}
                              >
                                Close
                              </button>
                              <button
                                type="submit"
                                className="btn btn-primary flex-fill"
                                disabled={actionLoadingId === booking.booking_id}
                              >
                                {actionLoadingId === booking.booking_id ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving...
                                  </>
                                ) : (
                                  "Save Changes"
                                )}
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
export default LearnerBookings;
