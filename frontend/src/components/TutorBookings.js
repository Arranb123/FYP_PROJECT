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
      <div className="container">
        <div className="alert alert-info text-center">
          <p>Please select a tutor to view bookings.</p>
        </div>
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
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
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
                    <span className="badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
                      {booking.status}
                    </span>
                  </td>
                  <td>{new Date(booking.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TutorBookings;
