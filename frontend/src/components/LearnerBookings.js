import React, { useState, useEffect } from "react";
import axios from "axios";

const LearnerBookings = ({ learnerId }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rescheduleData, setRescheduleData] = useState({});

  useEffect(() => {
    if (learnerId) {
      fetchBookings();
    }
  }, [learnerId]);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/bookings/learner/${learnerId}`);
      setBookings(response.data);
    } catch (err) {
      setError("Error fetching bookings. Please try again later.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await axios.put(`http://127.0.0.1:5000/api/bookings/${bookingId}/cancel`);
      fetchBookings();
    } catch (err) {
      alert("Error cancelling booking. Please try again.");
      console.error("Error:", err);
    }
  };

  const handleReschedule = async (bookingId) => {
    const data = rescheduleData[bookingId];
    if (!data || !data.session_date || !data.session_time) {
      alert("Please enter both date and time for rescheduling");
      return;
    }

    try {
      await axios.put(`http://127.0.0.1:5000/api/bookings/${bookingId}/reschedule`, {
        session_date: data.session_date,
        session_time: data.session_time,
      });
      setRescheduleData({});
      fetchBookings();
    } catch (err) {
      alert("Error rescheduling booking. Please try again.");
      console.error("Error:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#ffc107";
      case "confirmed":
        return "#28a745";
      case "cancelled":
        return "#dc3545";
      case "rescheduled":
        return "#17a2b8";
      default:
        return "#6c757d";
    }
  };

  if (!learnerId) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <p>Please select a learner to view bookings.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>My Bookings</h2>
        <button className="btn btn-primary" onClick={fetchBookings}>
          Refresh
        </button>
      </div>

      {loading && <div className="alert alert-info">Loading bookings...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {bookings.length === 0 && !loading ? (
        <div className="alert alert-info">No bookings found.</div>
      ) : (
        <div className="row g-3">
          {bookings.map((booking) => (
            <div key={booking.booking_id} className="col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{booking.tutor_name}</h5>
                  <p className="card-text"><strong>Modules:</strong> {booking.tutor_modules}</p>
                  <p className="card-text"><strong>Hourly Rate:</strong> €{booking.tutor_hourly_rate}</p>
                  <p className="card-text"><strong>Date:</strong> {booking.session_date}</p>
                  <p className="card-text"><strong>Time:</strong> {booking.session_time}</p>
                  <p className="card-text"><strong>Duration:</strong> {booking.duration} minutes</p>
                  <p className="card-text">
                    <strong>Status:</strong>{" "}
                    <span className="badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
                      {booking.status}
                    </span>
                  </p>
                  <p className="card-text"><small className="text-muted">Booked: {new Date(booking.created_at).toLocaleString()}</small></p>

                  {booking.status !== "cancelled" && (
                    <div className="mt-3">
                      <button
                        className="btn btn-danger btn-sm me-2"
                        onClick={() => handleCancel(booking.booking_id)}
                      >
                        Cancel
                      </button>
                      <div className="input-group input-group-sm mt-2">
                        <input
                          type="date"
                          className="form-control"
                          value={rescheduleData[booking.booking_id]?.session_date || ""}
                          onChange={(e) =>
                            setRescheduleData({
                              ...rescheduleData,
                              [booking.booking_id]: {
                                ...rescheduleData[booking.booking_id],
                                session_date: e.target.value,
                              },
                            })
                          }
                          min={new Date().toISOString().split("T")[0]}
                        />
                        <input
                          type="time"
                          className="form-control"
                          value={rescheduleData[booking.booking_id]?.session_time || ""}
                          onChange={(e) =>
                            setRescheduleData({
                              ...rescheduleData,
                              [booking.booking_id]: {
                                ...rescheduleData[booking.booking_id],
                                session_time: e.target.value,
                              },
                            })
                          }
                        />
                        <button
                          className="btn btn-info"
                          onClick={() => handleReschedule(booking.booking_id)}
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerBookings;
