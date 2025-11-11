import React, { useState, useEffect } from "react";
import axios from "axios";
import BookingForm from "./BookingForm";

const TutorSearch = () => {
  const [module, setModule] = useState("");
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Fetch students for learner selection
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/students");
      setStudents(res.data);
      if (res.data.length > 0) {
        setSelectedLearnerId(res.data[0].id.toString());
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleSearch = async () => {
    if (!module.trim()) {
      setError("Please enter a module name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/tutors?module=${module}`);
      setTutors(response.data);
      if (response.data.length === 0) {
        setError("No tutors found for that module.");
      }
    } catch (err) {
      setError("Error fetching tutors. Please try again later.");
    }

    setLoading(false);
  };

  const handleBookSession = (tutor) => {
    if (!selectedLearnerId) {
      setError("Please select a learner first");
      return;
    }
    setSelectedTutor(tutor);
    setShowBookingForm(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setSelectedTutor(null);
  };

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>🔍 Search Tutors by Module</h2>

      {/* Learner Selection */}
      <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f0f0f0", borderRadius: "5px" }}>
        <label style={{ marginRight: "10px" }}><strong>Select Learner:</strong></label>
        <select
          value={selectedLearnerId}
          onChange={(e) => setSelectedLearnerId(e.target.value)}
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.first_name} {student.last_name} ({student.college_email})
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", marginBottom: "20px" }}>
        <input
          type="text"
          value={module}
          onChange={(e) => setModule(e.target.value)}
          placeholder="Enter module name (e.g. Accounting)"
          style={{
            flex: 1,
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            marginRight: "10px"
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Search
        </button>
      </div>

      {loading && <p>Loading tutors...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div>
        {tutors.map((tutor) => (
          <div
            key={tutor.tutor_id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "15px",
              marginBottom: "15px",
              backgroundColor: "#f9f9f9"
            }}
          >
            <h3>{tutor.first_name} {tutor.last_name}</h3>
            <p><strong>Modules:</strong> {tutor.modules}</p>
            <p><strong>Hourly Rate:</strong> €{tutor.hourly_rate}</p>
            <p><strong>Rating:</strong> {tutor.rating || "N/A"}</p>
            <p>{tutor.bio}</p>
            <button
              onClick={() => handleBookSession(tutor)}
              style={{
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                marginTop: "10px"
              }}
            >
              Book Session
            </button>
          </div>
        ))}
      </div>

      {showBookingForm && selectedTutor && (
        <BookingForm
          tutor={selectedTutor}
          learnerId={parseInt(selectedLearnerId)}
          onClose={() => {
            setShowBookingForm(false);
            setSelectedTutor(null);
          }}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default TutorSearch;
