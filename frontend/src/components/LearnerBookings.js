// Iteration 3 - Story 12: Review functionality references
// file references: https://react.dev/reference/react/useState (lines 41-49, 52)
// file references: https://react.dev/reference/react/useCallback (line 124)
// file references: https://react.dev/reference/react/useEffect (line 258)
// file references: https://axios-http.com/docs/intro (lines 130, 162)
// file references: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function (lines 124, 150)
// file references: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch (lines 129, 161)
// file references: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date (lines 228-237)
// file references: https://www.w3schools.com/react/react_forms.asp (lines 423-470)
// file references: https://getbootstrap.com/docs/5.3/ (lines 391-404, 423-470)

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const LearnerBookings = ({ learnerId }) => {
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [rescheduleBookingId, setRescheduleBookingId] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    session_date: "",
    session_time: "",
  });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Story 12 - review state
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: "",
    comment: "",
  });
  const [reviewedBookings, setReviewedBookings] = useState(new Set());

  // Story 10 - fetch bookings
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

  // Story 12 - check which bookings have reviews
  // file reference: https://react.dev/reference/react/useCallback (line 124)
  // file reference: https://axios-http.com/docs/intro (line 130)
  const checkExistingReviews = useCallback(async () => {
    if (!learnerId || bookings.length === 0) return;
    
    const reviewedSet = new Set();
    for (const booking of bookings) {
      try {
        const res = await axios.get(`http://127.0.0.1:5000/api/reviews/booking/${booking.booking_id}`);
        if (res.data.exists) {
          reviewedSet.add(booking.booking_id);
        }
      } catch (err) {
        // Ignore errors for individual review checks
        console.error(`Error checking review for booking ${booking.booking_id}:`, err);
      }
    }
    setReviewedBookings(reviewedSet);
  }, [bookings, learnerId]);

  // Story 12 - Opens the review form for a specific booking
  const handleStartReview = (booking) => {
    setActionMessage({ type: "", text: "" });
    setReviewBookingId(booking.booking_id);
    setReviewForm({ rating: "", comment: "" });
  };

  // Story 12 - submit review
  // file reference: https://axios-http.com/docs/intro (line 162)
  // file reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function (line 150)
  const handleReviewSubmit = async (event, booking) => {
    event.preventDefault();
    
    if (!reviewForm.rating || parseInt(reviewForm.rating) < 1 || parseInt(reviewForm.rating) > 5) {
      setActionMessage({ type: "error", text: "Please select a rating between 1 and 5 stars." });
      return;
    }

    setActionMessage({ type: "", text: "" });
    setActionLoadingId(booking.booking_id);
    
    try {
      await axios.post("http://127.0.0.1:5000/api/reviews", {
        booking_id: booking.booking_id,
        learner_id: learnerId,
        tutor_id: booking.tutor_id,
        rating: parseInt(reviewForm.rating),
        comment: reviewForm.comment.trim() || "",
      });
      
      setActionMessage({ type: "success", text: "Review submitted successfully! Thank you for your feedback." });
      setReviewBookingId(null);
      setReviewForm({ rating: "", comment: "" });
      
      await fetchBookings();
      setTimeout(() => checkExistingReviews(), 500);
    } catch (err) {
      console.error("Review submission error:", err);
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to submit review. Please try again.";
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

  // Story 12 - Check if a booking is in the past (can be reviewed)
  // Checks both date and time to ensure the session has actually passed
  // file reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date (lines 228-237)
  const isBookingInPast = (booking) => {
    if (!booking || !booking.session_date) return false;
    
    const now = new Date();
    const bookingDate = new Date(booking.session_date);
    
    // Parse the session time (format: "HH:MM") - handle missing or invalid time
    if (booking.session_time && typeof booking.session_time === 'string') {
      const timeParts = booking.session_time.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10) || 0;
        const minutes = parseInt(timeParts[1], 10) || 0;
        bookingDate.setHours(hours, minutes, 0, 0);
      }
    }
    // If no session_time, just check the date (defaults to midnight)
    
    // Return true if booking datetime is in the past
    return bookingDate < now;
  };

  // Story 10 - Automatically fetch bookings when component loads or learner changes
  // If the user selects a different learner, it fetches that learner's bookings
  useEffect(() => {
    fetchBookings();
  }, [learnerId, fetchBookings]);  // Include both learnerId and fetchBookings in dependencies

  // Story 12 - check reviews when bookings load
  // file reference: https://react.dev/reference/react/useEffect (line 258)
  useEffect(() => {
    if (bookings.length > 0) {
      checkExistingReviews();
    }
  }, [bookings, checkExistingReviews]);

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
                          {/* Story 12 - Show "Leave Review" button for past bookings that haven't been reviewed */}
                          {/* file reference: https://getbootstrap.com/docs/5.3/ (lines 391-404) */}
                          {isBookingInPast(booking) && !reviewedBookings.has(booking.booking_id) && booking.status !== "cancelled" && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleStartReview(booking)}
                              disabled={actionLoadingId === booking.booking_id}
                            >
                              Leave Review
                            </button>
                          )}
                          {/* Story 12 - Show "Reviewed" badge if review exists */}
                          {reviewedBookings.has(booking.booking_id) && (
                            <span className="badge bg-success">Reviewed</span>
                          )}
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleStartReschedule(booking)}
                            disabled={actionLoadingId === booking.booking_id || booking.status === "cancelled"}
                          >
                            Reschedule
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleCancelBooking(booking.booking_id)}
                            disabled={actionLoadingId === booking.booking_id || booking.status === "cancelled"}
                          >
                            {actionLoadingId === booking.booking_id ? "Processing..." : "Cancel"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Story 12 - Review form row (only shown for the selected booking) */}
                    {/* file reference: https://www.w3schools.com/react/react_forms.asp (lines 423-470) */}
                    {/* file reference: https://getbootstrap.com/docs/5.3/ (lines 423-470) */}
                    {reviewBookingId === booking.booking_id && (
                      <tr className="bg-light">
                        <td colSpan="7">
                          <div className="p-3">
                            <h6 className="fw-bold mb-3">Leave a Review for {booking.tutor_name}</h6>
                            <form onSubmit={(event) => handleReviewSubmit(event, booking)}>
                              <div className="mb-3">
                                <label className="form-label fw-semibold">Rating *</label>
                                <div className="d-flex gap-2 align-items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      className={`btn ${reviewForm.rating === star.toString() ? 'btn-warning' : 'btn-outline-warning'}`}
                                      onClick={() => setReviewForm((prev) => ({ ...prev, rating: star.toString() }))}
                                    >
                                      ⭐
                                    </button>
                                  ))}
                                  <span className="ms-2 text-muted">
                                    {reviewForm.rating ? `${reviewForm.rating} out of 5 stars` : 'Select rating'}
                                  </span>
                                </div>
                              </div>
                              <div className="mb-3">
                                <label className="form-label fw-semibold" htmlFor={`review-comment-${booking.booking_id}`}>
                                  Comment (Optional)
                                </label>
                                <textarea
                                  className="form-control"
                                  id={`review-comment-${booking.booking_id}`}
                                  rows="3"
                                  placeholder="Share your experience with this tutor..."
                                  value={reviewForm.comment}
                                  onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                                />
                              </div>
                              <div className="d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() => {
                                    setReviewBookingId(null);
                                    setReviewForm({ rating: "", comment: "" });
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="btn btn-primary"
                                  disabled={actionLoadingId === booking.booking_id || !reviewForm.rating}
                                >
                                  {actionLoadingId === booking.booking_id ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                      Submitting...
                                    </>
                                  ) : (
                                    "Submit Review"
                                  )}
                                </button>
                              </div>
                            </form>
                          </div>
                        </td>
                      </tr>
                    )}

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

// Story 12 - Review functionality added to LearnerBookings component
// End Iteration 3 additions

// Export this component so it can be imported and used in other files
export default LearnerBookings;

