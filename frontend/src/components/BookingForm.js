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
        // Reset form
        setFormData({
          session_date: "",
          session_time: "",
          duration: 60,
        });
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
    <>
      <div className="modal-backdrop show" onClick={onClose} style={{ zIndex: 1040 }}></div>
      <div className="modal show d-block" style={{ zIndex: 1050 }} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">Book Session with {tutor.first_name} {tutor.last_name}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
          <div className="modal-body">
            <p><strong>Modules:</strong> {tutor.modules}</p>
            <p><strong>Hourly Rate:</strong> €{tutor.hourly_rate}</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Session Date:</label>
                <input
                  type="date"
                  className="form-control"
                  name="session_date"
                  value={formData.session_date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Session Time:</label>
                <input
                  type="time"
                  className="form-control"
                  name="session_time"
                  value={formData.session_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Duration:</label>
                <select
                  className="form-select"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              {message && (
                <div className={`alert ${message.includes("successfully") ? "alert-success" : "alert-danger"}`}>
                  {message}
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Booking..." : "Book Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default BookingForm;
