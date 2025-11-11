import React, { useState } from "react";
import axios from "axios";

const BookingForm = ({ tutor, learnerId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    session_date: "",
    session_time: "",
    duration: 60,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!learnerId) {
      setMessage("Please select a learner first");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5000/api/bookings", {
        learner_id: learnerId,
        tutor_id: tutor.tutor_id,
        session_date: formData.session_date,
        session_time: formData.session_time,
        duration: parseInt(formData.duration),
      });

      if (response.status === 201) {
        setMessage("Booking created successfully!");
        setTimeout(() => {
          onSuccess && onSuccess();
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      setMessage(error.response?.data?.error || "Error creating booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "10px",
          maxWidth: "500px",
          width: "90%",
        }}
      >
        <h2>Book Session with {tutor.first_name} {tutor.last_name}</h2>
        <p><strong>Modules:</strong> {tutor.modules}</p>
        <p><strong>Hourly Rate:</strong> €{tutor.hourly_rate}</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
          <div>
            <label>Session Date:</label>
            <input
              type="date"
              name="session_date"
              value={formData.session_date}
              onChange={handleChange}
              required
              min={new Date().toISOString().split("T")[0]}
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </div>

          <div>
            <label>Session Time:</label>
            <input
              type="time"
              name="session_time"
              value={formData.session_time}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            />
          </div>

          <div>
            <label>Duration (minutes):</label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          {message && (
            <p style={{ color: message.includes("successfully") ? "green" : "red" }}>
              {message}
            </p>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
                backgroundColor: "#ccc",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Booking..." : "Book Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
