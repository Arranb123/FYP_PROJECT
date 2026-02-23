// Iteration 4 - Tutor Availability Management Component
// Lets tutors set their weekly availability
// ref: React forms - https://react.dev/reference/react-dom/components/input

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const TutorAvailability = ({ tutorId }) => {
  // Iteration 4 - State for availability management
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editingDay, setEditingDay] = useState(null);
  
  // Iteration 4 - Days of the week (0=Monday, 6=Sunday)
  const daysOfWeek = [
    { value: 0, label: "Monday" },
    { value: 1, label: "Tuesday" },
    { value: 2, label: "Wednesday" },
    { value: 3, label: "Thursday" },
    { value: 4, label: "Friday" },
    { value: 5, label: "Saturday" },
    { value: 6, label: "Sunday" }
  ];
  
  // Iteration 4 - Form state for adding/editing availability
  const [formData, setFormData] = useState({
    day_of_week: "",
    start_time: "09:00",
    end_time: "17:00",
    is_available: 1
  });
  
  // Iteration 4 - Fetch tutor's current availability
  const fetchAvailability = useCallback(async () => {
    if (!tutorId) return;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/tutors/${tutorId}/availability`);
      setAvailability(response.data);
    } catch (error) {
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to load availability";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [tutorId]);
  
  // Iteration 4 - Fetch current availability when component loads
  useEffect(() => {
    if (tutorId) {
      fetchAvailability();
    }
  }, [tutorId, fetchAvailability]);
  
  // Iteration 4 - Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "is_available" ? parseInt(value) : value
    }));
  };
  
  // Iteration 4 - Handle form submission (add or update availability)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.day_of_week) {
      setMessage({ type: "error", text: "Please select a day of the week" });
      return;
    }
    
    if (formData.start_time >= formData.end_time) {
      setMessage({ type: "error", text: "End time must be after start time" });
      return;
    }
    
    setLoading(true);
    setMessage({ type: "", text: "" });
    
    try {
      // Format time to HH:MM:SS
      const startTimeFormatted = formData.start_time + ":00";
      const endTimeFormatted = formData.end_time + ":00";
      
      await axios.post(`${process.env.REACT_APP_API_URL}/api/tutors/${tutorId}/availability`, {
        day_of_week: parseInt(formData.day_of_week),
        start_time: startTimeFormatted,
        end_time: endTimeFormatted,
        is_available: formData.is_available
      });
      
      setMessage({ type: "success", text: "Availability updated successfully!" });
      setFormData({
        day_of_week: "",
        start_time: "09:00",
        end_time: "17:00",
        is_available: 1
      });
      setEditingDay(null);
      fetchAvailability(); // Refresh the list
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      const errorMsg = error?.response?.data?.error || error?.message || "Failed to update availability";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };
  
  // Iteration 4 - Get availability for a specific day
  const getAvailabilityForDay = (dayOfWeek) => {
    return availability.find(a => a.day_of_week === dayOfWeek);
  };
  
  // Iteration 4 - Edit existing availability
  const handleEdit = (dayOfWeek) => {
    const dayAvailability = getAvailabilityForDay(dayOfWeek);
    if (dayAvailability) {
      setFormData({
        day_of_week: dayAvailability.day_of_week.toString(),
        start_time: dayAvailability.start_time.substring(0, 5), // Remove seconds
        end_time: dayAvailability.end_time.substring(0, 5),
        is_available: dayAvailability.is_available
      });
      setEditingDay(dayOfWeek);
    }
  };
  
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h3 className="card-title mb-4 fw-bold">Availability</h3>
        
        {/* Iteration 4 - Show messages */}
        {message.text && (
          <div className={`alert alert-${message.type === "success" ? "success" : "danger"} alert-dismissible fade show`}>
            {message.text}
            <button
              type="button"
              className="btn-close"
              onClick={() => setMessage({ type: "", text: "" })}
              aria-label="Close"
            ></button>
          </div>
        )}
        
        {/* Iteration 4 - Show error */}
        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}
        
        {/* Iteration 4 - Availability form */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold">Day of Week *</label>
              <select
                className="form-select"
                name="day_of_week"
                value={formData.day_of_week}
                onChange={handleChange}
                required
              >
                <option value="">Select a day</option>
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label fw-semibold">Start Time *</label>
              <input
                type="time"
                className="form-control"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="col-md-3">
              <label className="form-label fw-semibold">End Time *</label>
              <input
                type="time"
                className="form-control"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="col-md-3 d-flex align-items-end">
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : editingDay !== null ? (
                  "Update"
                ) : (
                  "Add Availability"
                )}
              </button>
            </div>
          </div>
          
          {editingDay !== null && (
            <div className="mt-2">
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setEditingDay(null);
                  setFormData({
                    day_of_week: "",
                    start_time: "09:00",
                    end_time: "17:00",
                    is_available: 1
                  });
                }}
              >
                Cancel Edit
              </button>
            </div>
          )}
        </form>
        
        {/* Iteration 4 - Current availability list */}
        <div>
          <h5 className="mb-3">Current Availability</h5>
          {loading && availability.length === 0 ? (
            <div className="text-center py-3">
              <div className="spinner-border spinner-border-sm me-2"></div>
              Loading...
            </div>
          ) : availability.length === 0 ? (
            <div className="alert alert-info">
              No availability set. Add your available times above.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {daysOfWeek.map(day => {
                    const dayAvailability = getAvailabilityForDay(day.value);
                    return (
                      <tr key={day.value}>
                        <td><strong>{day.label}</strong></td>
                        {dayAvailability ? (
                          <>
                            <td>{dayAvailability.start_time.substring(0, 5)}</td>
                            <td>{dayAvailability.end_time.substring(0, 5)}</td>
                            <td>
                              <span className={`badge ${dayAvailability.is_available ? "bg-success" : "bg-secondary"}`}>
                                {dayAvailability.is_available ? "Available" : "Unavailable"}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleEdit(day.value)}
                                disabled={editingDay === day.value}
                              >
                                Edit
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td colSpan="3" className="text-muted">Not set</td>
                            <td>-</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorAvailability;
