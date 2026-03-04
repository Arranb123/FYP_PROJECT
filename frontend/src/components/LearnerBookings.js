// Iteration 3 - Story 12: Review functionality references
// file references: https://react.dev/reference/react/useState (lines 41-49, 52)
// Pagination
// Reference: Bootstrap 5.3 Documentation (2025) "Pagination" — https://getbootstrap.com/docs/5.3/components/pagination/
// Used to split the bookings table across multiple pages (10 items per page).
// file references: https://react.dev/reference/react/useCallback (line 124)
// file references: https://react.dev/reference/react/useEffect (line 258)
// file references: https://axios-http.com/docs/intro (lines 130, 162)
// file references: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function (lines 124, 150)
// file references: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch (lines 129, 161)
// file references: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date (lines 228-237)
// file references: https://www.w3schools.com/react/react_forms.asp (lines 423-470)
// file references: https://getbootstrap.com/docs/5.3/ (lines 391-404, 423-470)

import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import BookingMessages from "./BookingMessages"; // Iteration 4 - Import messaging component

const LearnerBookings = ({ learnerId, onNavigateToTutors }) => {
  
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
  
  // Iteration 4 - State for showing messages
  const [showMessagesForBooking, setShowMessagesForBooking] = useState(null);

  // Iteration 5 - Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/bookings/learner/${learnerId}`);
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
      await axios.put(`${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}/cancel`);
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
    const results = await Promise.all(
      bookings.map(booking =>
        axios.get(`${process.env.REACT_APP_API_URL}/api/reviews/booking/${booking.booking_id}`)
          .then(res => res.data.exists ? booking.booking_id : null)
          .catch(() => null)
      )
    );
    setReviewedBookings(new Set(results.filter(Boolean)));
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
      await axios.post(`${process.env.REACT_APP_API_URL}/api/reviews`, {
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
      await axios.put(`${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}/reschedule`, {
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
                  {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} total
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
                    <th><div className="skeleton" style={{ height: "20px", width: "80px" }}></div></th>
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
                      <td><div className="skeleton" style={{ height: "16px", width: "80px" }}></div></td>
                      <td><div className="skeleton" style={{ height: "16px", width: "70px" }}></div></td>
                      <td><div className="skeleton" style={{ height: "16px", width: "150px" }}></div></td>
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

        {/* UX Improvement - Enhanced empty state */}
        {bookings.length === 0 && !loading && !error ? (
          <div className="text-center py-5">
            <div className="mb-4" style={{ fontSize: "4rem", opacity: 0.3 }}>
              <i className="bi bi-calendar-x"></i>
            </div>
            <h5 className="fw-semibold mb-2">No Bookings Yet</h5>
            <p className="text-muted mb-4">
              You haven't booked any tutoring sessions yet. Start searching for tutors to get started!
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => onNavigateToTutors?.()}
            >
              <i className="bi bi-search me-2"></i>
              Search for Tutors
            </button>
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
                  <th>Tutor</th>
                  <th>Modules</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
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
                          {/* Iteration 4 - Messages button for confirmed bookings */}
                          {(booking.status === "confirmed" || booking.status === "accepted") && (
                            <>
                              <button
                                className="btn btn-sm btn-outline-info"
                                onClick={() => setShowMessagesForBooking(
                                  showMessagesForBooking === booking.booking_id ? null : booking.booking_id
                                )}
                                title="View messages"
                              >
                                {showMessagesForBooking === booking.booking_id ? "Hide Messages" : "Messages"}
                              </button>
                            </>
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

                    {/* Iteration 4 - Messages row (only shown for the selected booking) */}
                    {showMessagesForBooking === booking.booking_id && (
                      <tr>
                        <td colSpan="7" className="p-0">
                          <div className="p-3">
                            <BookingMessages
                              bookingId={booking.booking_id}
                              userId={learnerId}
                              userRole="learner"
                              bookingStatus={booking.status}
                            />
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

// Story 12 - Review functionality added to LearnerBookings component
// End Iteration 3 additions

// Export this component so it can be imported and used in other files
export default LearnerBookings;

