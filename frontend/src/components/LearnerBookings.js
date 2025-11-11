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
      alert("Booking cancelled successfully!");
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
      alert("Booking rescheduled successfully!");
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
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2>My Bookings</h2>
      <button
        onClick={fetchBookings}
        style={{
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        Refresh
      </button>

      {loading && <p>Loading bookings...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {bookings.length === 0 && !loading ? (
        <p>No bookings found.</p>
      ) : (
        <div>
          {bookings.map((booking) => (
            <div
              key={booking.booking_id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                padding: "20px",
                marginBottom: "15px",
                backgroundColor: "#f9f9f9"
              }}
            >
              <h3>{booking.tutor_name}</h3>
              <p><strong>Modules:</strong> {booking.tutor_modules}</p>
              <p><strong>Hourly Rate:</strong> €{booking.tutor_hourly_rate}</p>
              <p><strong>Date:</strong> {booking.session_date}</p>
              <p><strong>Time:</strong> {booking.session_time}</p>
              <p><strong>Duration:</strong> {booking.duration} minutes</p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    backgroundColor: getStatusColor(booking.status),
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px"
                  }}
                >
                  {booking.status}
                </span>
              </p>
              <p><strong>Booked:</strong> {new Date(booking.created_at).toLocaleString()}</p>

              {booking.status !== "cancelled" && (
                <div style={{ marginTop: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleCancel(booking.booking_id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      type="date"
                      placeholder="New Date"
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
                      style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                    <input
                      type="time"
                      placeholder="New Time"
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
                      style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                    <button
                      onClick={() => handleReschedule(booking.booking_id)}
                      style={{
                        backgroundColor: "#17a2b8",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "5px",
                        cursor: "pointer"
                      }}
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerBookings;
