// This component shows a modal form for booking a tutoring session
// It's displayed when a learner clicks "Book Session" on a tutor card

// Import React and useState hook for managing component state
import React, { useState } from "react";
// Import axios for making HTTP requests to the backend
import axios from "axios";

// This component receives props data passed from the parent component
// tutor: The tutor object that was selected for booking
// learnerId: The ID of the learner who is making the booking
// onClose: Function to call when the user closes the modal
// onSuccess: Function to call when the booking is successfully created
const BookingForm = ({ tutor, learnerId, onClose, onSuccess }) => {
  // 
  // STATE VARIABLES
  // 
  
  // This object stores the form data for the booking
  const [formState, setFormState] = useState({
    session_date: "",   // Date when the session will happen
    session_time: "",   // Time when the session will happen
    duration: 60,       // How long the session is in minutes (defaults to 60)
  });
  
  // This object stores any status message (success or error)
  const [status, setStatus] = useState({ type: "", message: "" });
  
  // This  tracks whether I'm currently submitting the form
  // true = submitting, false = not submitting
  const [submitting, setSubmitting] = useState(false);

  // 
  // FUNCTIONS
  // 

  // This function is called whenever the user changes any form field
  const handleChange = (event) => {
    // Get the name and value of the field that was changed
    const { name, value } = event.target;
    // Update the formState, keeping all other fields the same
    // and only changing the field that was edited
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // Handles when user submits the booking form
  // Story 5 - This creates a new booking when learner fills out the form
  const handleSubmit = async (event) => {
    event.preventDefault(); // Stop form from refreshing page
    setStatus({ type: "", message: "" });

    // Check date and time are filled in before sending
    if (!formState.session_date || !formState.session_time) {
      setStatus({ type: "error", message: "Please select both a date and time." });
      return;
    }

    setSubmitting(true); // 
    try {
      // Send booking data to backend API
      // This creates the booking in the database
      await axios.post("http://127.0.0.1:5000/api/bookings", {
        learner_id: learnerId, // Who is booking
        tutor_id: tutor.tutor_id, // Who they're booking with
        session_date: formState.session_date, // When the session is
        session_time: formState.session_time, // What time
        duration: Number(formState.duration) || 60, // How long
      });

      // If successful, show success message and close modal
      setStatus({ type: "success", message: "Booking created successfully!" });
      if (onSuccess) {
        onSuccess(); // Close the 
      }
    } catch (error) {
      // Show error message if something goes wrong
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create booking. Please try again.";
      setStatus({ type: "error", message });
    } finally {
      setSubmitting(false); // H
    }
  };

  //  - This returns the HTML/JSX that gets displayed
  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          {/* Modal header with tutor's name */}
          <div className="modal-header bg-primary text-white">
            <div className="d-flex align-items-center">
              <img 
                src="/logo.png" 
                alt="StudyHive Logo" 
                className="logo-modal"
                style={{ 
                  height: "40px", 
                  marginRight: "12px",
                  objectFit: "contain"
                }} 
                onError={(e) => {
                  // If logo doesn't load, hide it
                  e.target.style.display = 'none';
                }}
              />
              <h5 className="modal-title fw-bold mb-0">
                Book a Session with {tutor.first_name} {tutor.last_name}
              </h5>
            </div>
            {/* Close button (X) */}
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          {/* Form that calls handleSubmit when submitted */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Card showing tutor's modules and hourly rate */}
              <div className="card bg-light mb-4">
                <div className="card-body p-3">
                  <div className="row g-2">
                    <div className="col-6">
                      <small className="text-muted d-block">Modules</small>
                      <strong>{tutor.modules}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">Hourly Rate</small>
                      <strong className="text-success">€{tutor.hourly_rate}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Date input field */}
              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="session_date">
                  Session Date *
                </label>
                <input
                  type="date"
                  id="session_date"
                  name="session_date"
                  className="form-control"
                  value={formState.session_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}  // Don't allow past dates
                  required
                />
                <small className="text-muted">Select a date for your tutoring session</small>
              </div>

              {/* Session Time input field */}
              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="session_time">
                  Session Time *
                </label>
                <input
                  type="time"
                  id="session_time"
                  name="session_time"
                  className="form-control"
                  value={formState.session_time}
                  onChange={handleChange}
                  required
                />
                <small className="text-muted">Choose a time that works for you</small>
              </div>

              {/* Duration input field */}
              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="duration">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  className="form-control"
                  min="30"
                  step="15"
                  value={formState.duration}
                  onChange={handleChange}
                />
                <small className="text-muted">Minimum 30 minutes, increments of 15 minutes</small>
              </div>

              {/* Show success/error message if there is one */}
              {status.message && (
                <div className={`alert alert-dismissible fade show ${status.type === "success" ? "alert-success" : "alert-danger"}`} role="alert">
                  {status.message}
                  {/* Close button to dismiss the message */}
                  <button type="button" className="btn-close" onClick={() => setStatus({ type: "", message: "" })} aria-label="Close"></button>
                </div>
              )}
            </div>
            {/* Modal footer with Cancel and Confirm buttons */}
            <div className="modal-footer">
              {/* Cancel button - closes the modal */}
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              {/* Submit button - creates the booking */}
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Export this component so it can be imported and used in other files
export default BookingForm;
