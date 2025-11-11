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
    <div className="container">
      <h2 className="mb-4">🔍 Search Tutors by Module</h2>

      {/* Learner Selection */}
      <div className="card mb-4">
        <div className="card-body">
          <label className="form-label fw-bold">Select Learner:</label>
          <select
            className="form-select"
            value={selectedLearnerId}
            onChange={(e) => setSelectedLearnerId(e.target.value)}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} ({student.college_email})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="input-group mb-4">
        <input
          type="text"
          className="form-control"
          value={module}
          onChange={(e) => setModule(e.target.value)}
          placeholder="Enter module name (e.g. Accounting)"
        />
        <button
          className="btn btn-primary"
          onClick={handleSearch}
          type="button"
        >
          Search
        </button>
      </div>

      {loading && <div className="alert alert-info">Loading tutors...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        {tutors.map((tutor) => (
          <div key={tutor.tutor_id} className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{tutor.first_name} {tutor.last_name}</h5>
                <p className="card-text"><strong>Modules:</strong> {tutor.modules}</p>
                <p className="card-text"><strong>Hourly Rate:</strong> €{tutor.hourly_rate}</p>
                <p className="card-text"><strong>Rating:</strong> {tutor.rating || "N/A"}</p>
                <p className="card-text">{tutor.bio}</p>
                <button
                  className="btn btn-success"
                  onClick={() => handleBookSession(tutor)}
                >
                  Book Session
                </button>
              </div>
            </div>
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
