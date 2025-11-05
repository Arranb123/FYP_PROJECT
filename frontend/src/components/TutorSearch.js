import React, { useState } from "react";
import axios from "axios";

const TutorSearch = () => {
  const [module, setModule] = useState("");
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>🔍 Search Tutors by Module</h2>

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
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutorSearch;
