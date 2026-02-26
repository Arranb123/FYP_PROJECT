// Iteration 4 - Calendar View Component
// Displays bookings in a calendar format for both learners and tutors
// ref: JavaScript Date handling - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const CalendarView = ({ userId, role }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Iteration 4 - Fetch bookings based on role
  const fetchBookings = useCallback(async () => {
    if (!userId) {
      setBookings([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = role === 'tutor' 
        ? `${process.env.REACT_APP_API_URL}/api/bookings/tutor/${userId}`
        : `${process.env.REACT_APP_API_URL}/api/bookings/learner/${userId}`;
      
      const response = await axios.get(endpoint);
      setBookings(response.data);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load bookings. Please try again later.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Iteration 4 - Get bookings for a specific date
  const getBookingsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(booking => booking.session_date === dateStr);
  };

  // Iteration 4 - Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Iteration 4 - Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Monday of the week containing the first day
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    // End on Sunday of the week containing the last day
    const endDate = new Date(lastDay);
    const endDayOfWeek = lastDay.getDay();
    const daysToAdd = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
    endDate.setDate(lastDay.getDate() + daysToAdd);
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = getCalendarDays();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Iteration 4 - Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Iteration 4 - Get status badge color
  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'warning',
      'confirmed': 'success',
      'accepted': 'success',
      'cancelled': 'danger',
      'completed': 'info',
      'missed': 'secondary',
      'denied': 'danger'
    };
    return statusColors[status] || 'secondary';
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading calendar...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">My Calendar</h4>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-light" onClick={goToPreviousMonth}>
                ← Previous
              </button>
              <button className="btn btn-sm btn-light" onClick={goToToday}>
                Today
              </button>
              <button className="btn btn-sm btn-light" onClick={goToNextMonth}>
                Next →
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          <h5 className="text-center mb-4">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h5>

          {/* Calendar Grid */}
          <div className="calendar-grid">
            {/* Day Headers */}
            <div className="row g-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="col calendar-day-header">
                  <strong>{day}</strong>
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="row g-1">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = day.toDateString() === new Date().toDateString();
                const dayBookings = getBookingsForDate(day);
                
                return (
                  <div
                    key={index}
                    className={`col calendar-day ${!isCurrentMonth ? 'text-muted' : ''} ${isToday ? 'today' : ''}`}
                  >
                    <div className="calendar-day-number">
                      {day.getDate()}
                    </div>
                    <div className="calendar-bookings">
                      {dayBookings.slice(0, 3).map(booking => (
                        <div
                          key={booking.booking_id}
                          className={`calendar-booking badge bg-${getStatusBadge(booking.status)} mb-1`}
                          onClick={() => setSelectedBooking(booking)}
                          style={{ cursor: 'pointer', display: 'block' }}
                          title={`${formatTime(booking.session_time)} - ${role === 'tutor' ? (booking.learner_first_name || 'Learner') : (booking.tutor_name || 'Tutor')}`}
                        >
                          {formatTime(booking.session_time)}
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-muted small">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Booking Details Modal */}
          {selectedBooking && (
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Booking Details</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setSelectedBooking(null)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p><strong>Date:</strong> {selectedBooking.session_date}</p>
                    <p><strong>Time:</strong> {formatTime(selectedBooking.session_time)}</p>
                    <p><strong>Duration:</strong> {selectedBooking.duration} minutes</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge bg-${getStatusBadge(selectedBooking.status)} ms-2`}>
                        {selectedBooking.status}
                      </span>
                    </p>
                    {role === 'tutor' ? (
                      <>
                        <p><strong>Learner:</strong> {selectedBooking.learner_first_name} {selectedBooking.learner_last_name}</p>
                        {selectedBooking.learner_email && (
                          <p><strong>Email:</strong> {selectedBooking.learner_email}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p><strong>Tutor:</strong> {selectedBooking.tutor_name}</p>
                        <p><strong>Module:</strong> {selectedBooking.module}</p>
                        <p><strong>Rate:</strong> €{selectedBooking.tutor_hourly_rate}/hour</p>
                      </>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedBooking(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-4">
            <h6>Status Legend:</h6>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge bg-warning">Pending</span>
              <span className="badge bg-success">Confirmed/Accepted</span>
              <span className="badge bg-info">Completed</span>
              <span className="badge bg-danger">Cancelled/Denied</span>
              <span className="badge bg-secondary">Missed</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .calendar-grid {
          font-size: 0.9rem;
        }
        .calendar-day-header {
          text-align: center;
          padding: 0.5rem;
          background-color: #f8f9fa;
          font-weight: bold;
          flex: 0 0 calc(100% / 7);
          max-width: calc(100% / 7);
        }
        .calendar-day {
          min-height: 100px;
          border: 1px solid #dee2e6;
          padding: 0.25rem;
          background-color: #fff;
          flex: 0 0 calc(100% / 7);
          max-width: calc(100% / 7);
        }
        .calendar-day.today {
          background-color: #e7f3ff;
          border: 2px solid #0d6efd;
        }
        .calendar-day-number {
          font-weight: bold;
          margin-bottom: 0.25rem;
        }
        .calendar-bookings {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .calendar-booking {
          font-size: 0.7rem;
          padding: 0.125rem 0.25rem;
          width: 100%;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .modal.show {
          background-color: rgba(0, 0, 0, 0.5);
        }
        @media (max-width: 768px) {
          .calendar-day {
            min-height: 80px;
            font-size: 0.8rem;
          }
          .calendar-booking {
            font-size: 0.6rem;
            padding: 0.1rem 0.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarView;
