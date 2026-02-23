// Modal form for booking a tutoring session
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";

const BookingForm = ({ tutor, learnerId, onClose, onSuccess }) => {
  // form state
  const [formState, setFormState] = useState({
    session_date: "",   // Date when the session will happen
    session_time: "",   // Time when the session will happen
    duration: 60,       // How long the session is in minutes (defaults to 60)
    module: "",         // Iteration 4 - Module for this booking
    // ref: React select dropdown - https://www.w3schools.com/react/react_forms.asp
  });
  
  // Iteration 4 - Parse modules from tutor (handle comma-separated or single module)
  // ref: mdn Array methods - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
  const tutorModules = useMemo(() => {
    return tutor?.modules 
      ? tutor.modules.split(',').map(m => m.trim()).filter(m => m.length > 0)
      : [];
  }, [tutor?.modules]);
  
  // Iteration 4 - Auto-select module if tutor only teaches one module
  useEffect(() => {
    if (tutorModules.length === 1 && formState.module !== tutorModules[0]) {
      setFormState(prev => ({ ...prev, module: tutorModules[0] }));
    }
  }, [tutorModules, formState.module]);
  
  // This object stores any status message (success or error)
  const [status, setStatus] = useState({ type: "", message: "" });
  
  // This  tracks whether I'm currently submitting the form
  // true = submitting, false = not submitting
  const [submitting, setSubmitting] = useState(false);
  
  // Iteration 4 - Store API integration results
  const [apiResults, setApiResults] = useState(null);
  
  // Iteration 4 - Store available time slots for selected date
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  // 
  // FUNCTIONS
  // 
  
  // Iteration 4 - Function to fetch available time slots from backend
  const fetchAvailableSlots = useCallback(async () => {
    if (!formState.session_date) return;
    
    setLoadingSlots(true);
    setSlotsError("");
    setAvailableSlots([]);
    setFormState(prev => ({ ...prev, session_time: "" })); // Clear selected time
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tutors/${tutor.tutor_id}/available-slots?date=${formState.session_date}`
      );
      
      if (response.data.available_slots && response.data.available_slots.length > 0) {
        setAvailableSlots(response.data.available_slots);
      } else {
        setSlotsError("No available time slots for this date. Please select another date.");
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to load available slots";
      setSlotsError(errorMsg);
      console.error("Error fetching available slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  }, [formState.session_date, tutor.tutor_id]);
  
  // Iteration 4 - Fetch available time slots when date changes
  useEffect(() => {
    if (formState.session_date && tutor.tutor_id) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setFormState(prev => ({ ...prev, session_time: "" }));
    }
  }, [formState.session_date, tutor.tutor_id, fetchAvailableSlots]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    // and only changing the field that was edited
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  // Handles when user submits the booking form
  // Story 5 - This creates a new booking when learner fills out the form
  const handleSubmit = async (event) => {
    event.preventDefault(); // Stop form from refreshing page
    setStatus({ type: "", message: "" });

    // Iteration 4 - Check all required fields including module with better validation
    if (!formState.session_date) {
      setStatus({ type: "error", message: "Please select a date for your session." });
      return;
    }
    if (!formState.session_time) {
      setStatus({ type: "error", message: "Please select a time for your session." });
      return;
    }
    if (!formState.module) {
      setStatus({ type: "error", message: "Please select a module for this session." });
      return;
    }
    
    // Iteration 4 - Validate date is not in the past
    const selectedDate = new Date(`${formState.session_date}T${formState.session_time}`);
    const now = new Date();
    if (selectedDate < now) {
      setStatus({ type: "error", message: "Please select a date and time in the future." });
      return;
    }

    setSubmitting(true); // 
    setApiResults(null); // Clear previous API results
    try {
      // Send booking data to backend API
      // This creates the booking in the database
      const response = await axios.post("${process.env.REACT_APP_API_URL}/api/bookings", {
        learner_id: learnerId, // Who is booking
        tutor_id: tutor.tutor_id, // Who they're booking with
        session_date: formState.session_date, // When the session is
        session_time: formState.session_time, // What time
        duration: Number(formState.duration) || 60, // How long
        module: formState.module, // Iteration 4 - Module for this booking
      });

      // Iteration 4 - Capture API integration results
      if (response.data.api_integrations) {
        setApiResults(response.data.api_integrations);
        console.log("API Integration Results:", response.data.api_integrations);
      }

      // If successful, show success message
      let successMessage = "Booking created successfully!";

      // Add API status to message only on success
      if (response.data.api_integrations) {
        const calendar = response.data.api_integrations.google_calendar;
        if (calendar && calendar.success) {
          successMessage += " Calendar event created!";
        }
        const email = response.data.api_integrations.email;
        if (email && email.success) {
          successMessage += " Confirmation email sent!";
        }
      }

      setStatus({ type: "success", message: successMessage });
      
      // Iteration 4 - Show toast notification
      if (window.showToast) {
        window.showToast(successMessage, "success", 3000);
      }
      
      // UX Improvement - Wait longer to show API results, then close modal
      // Increased timeout to 10 seconds so user can see and click "View Calendar" link
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(); // Close the modal
        }
      }, 10000); // 10 seconds instead of 2 seconds
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
    <div 
      className="modal fade show d-block" 
      tabIndex="-1" 
      role="dialog" 
      style={{ zIndex: 1050 }}
      onKeyDown={(e) => {
        // Iteration 4 - Close modal on ESC key
        if (e.key === "Escape") {
          onClose();
        }
      }}
    >
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

              {/* Iteration 4 - Module Selection */}
              {tutorModules.length > 0 && (
                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="module">
                    Select Module *
                  </label>
                  {tutorModules.length === 1 ? (
                    <div>
                      <input
                        type="text"
                        className="form-control"
                        value={tutorModules[0]}
                        readOnly
                        disabled
                      />
                      <input
                        type="hidden"
                        name="module"
                        value={tutorModules[0]}
                      />
                    </div>
                  ) : (
                    <select
                      id="module"
                      name="module"
                      className="form-select"
                      value={formState.module}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Select a module --</option>
                      {tutorModules.map((module, index) => (
                        <option key={index} value={module}>
                          {module}
                        </option>
                      ))}
                    </select>
                  )}
                  <small className="text-muted">Choose which module you want tutoring for</small>
                </div>
              )}

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

              {/* Iteration 4 - Session Time selection with available slots */}
              <div className="mb-3">
                <label className="form-label fw-semibold" htmlFor="session_time">
                  Session Time *
                </label>
                {!formState.session_date ? (
                  <div className="alert alert-info">
                    Please select a date first to see available time slots
                  </div>
                ) : loadingSlots ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Loading available times...
                  </div>
                ) : slotsError ? (
                  <div className="alert alert-warning">
                    {slotsError}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div>
                    <div className="alert alert-warning mb-2">
                      No available time slots for this date. The tutor may not have set their availability.
                    </div>
                    {/* Iteration 4 - Fallback: Allow manual time entry if no slots available */}
                    <input
                      type="time"
                      className="form-control"
                      name="session_time"
                      value={formState.session_time}
                      onChange={handleChange}
                      required
                    />
                    <small className="text-muted">You can manually enter a time</small>
                  </div>
                ) : (
                  <div>
                    <div className="row g-2 mb-2">
                      {availableSlots.map((slot) => (
                        <div key={slot} className="col-6 col-md-4 col-lg-3">
                          <button
                            type="button"
                            className={`btn w-100 ${
                              formState.session_time === slot
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                            onClick={() => setFormState(prev => ({ ...prev, session_time: slot }))}
                          >
                            {slot}
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="hidden"
                      name="session_time"
                      value={formState.session_time}
                      required
                    />
                    {formState.session_time && (
                      <small className="text-success d-block mt-2">
                        Selected: {formState.session_time}
                      </small>
                    )}
                    <small className="text-muted d-block mt-1">
                      Select an available time slot above
                    </small>
                  </div>
                )}
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

              {/* Iteration 4 - Show API integration results (only show successful integrations or friendly failure messages) */}
              {apiResults && (
                <div className="mt-3">
                  <div className="small">
                    {/* Google Calendar - show link on success, friendly message on failure */}
                    {apiResults.google_calendar && apiResults.google_calendar.success && (
                      <div className="mb-2 p-3 rounded bg-success bg-opacity-10 text-success">
                        <strong><i className="bi bi-calendar-check me-1"></i>Google Calendar:</strong>{' '}
                        <span>
                          Event created
                          {apiResults.google_calendar.event_link && (
                            <a
                              href={apiResults.google_calendar.event_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ms-2 btn btn-sm btn-outline-success"
                              style={{ textDecoration: 'none' }}
                            >
                              <i className="bi bi-calendar-event me-1"></i>
                              View in Calendar
                            </a>
                          )}
                        </span>
                      </div>
                    )}
                    {/* Email - show success only */}
                    {apiResults.email && apiResults.email.success && (
                      <div className="mb-2 p-2 rounded bg-success bg-opacity-10 text-success">
                        <strong><i className="bi bi-envelope-check me-1"></i>Email:</strong> Confirmation emails sent
                      </div>
                    )}
                    {/* Timezone - show on success only */}
                    {apiResults.timezone && apiResults.timezone.success && (
                      <div className="mb-2 p-2 rounded bg-info bg-opacity-10 text-info">
                        <strong>Timezone:</strong> {apiResults.timezone.timezone}
                      </div>
                    )}
                  </div>
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

export default BookingForm;
