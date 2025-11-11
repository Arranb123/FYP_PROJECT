import React, { useState, useEffect } from "react";
import axios from "axios";

const TutorBookings = ({ tutorId }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tutorId) {
      fetchBookings();
    }
  }, [tutorId]);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/bookings/tutor/${tutorId}`);
      setBookings(response.data);
    } catch (err) {
      setError("Error fetching bookings. Please try again later.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
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

  if (!tutorId) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <p>Please select a tutor to view bookings.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1000px", margin: "0 auto" }}>
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
        <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th>Learner</th>
              <th>Email</th>
              <th>Date</th>
              <th>Time</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Booked At</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.booking_id}>
                <td>{booking.learner_name}</td>
                <td>{booking.learner_email}</td>
                <td>{booking.session_date}</td>
                <td>{booking.session_time}</td>
                <td>{booking.duration} min</td>
                <td>
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
                </td>
                <td>{new Date(booking.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TutorBookings;
