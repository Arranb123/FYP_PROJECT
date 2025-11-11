import React, { useState } from "react";
import axios from "axios";

const TutorSignup = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    college_email: "",
    modules: "",
    hourly_rate: "",
    bio: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post("http://127.0.0.1:5000/api/tutors", {
        ...formData,
        verified: 0, // tutors start unverified
      });

      if (response.status === 201) {
        setMessage("Tutor registered successfully!");
        setFormData({
          first_name: "",
          last_name: "",
          college_email: "",
          modules: "",
          hourly_rate: "",
          bio: "",
        });
      }
    } catch (error) {
      console.error("Error adding tutor:", error);
      setMessage("Error registering tutor. Please try again.");
    }
  };

  return (
    <div style={{ width: "80%", margin: "30px auto", textAlign: "center" }}>
      <h2>Tutor Sign-Up</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "500px",
          margin: "0 auto",
          gap: "10px",
        }}
      >
        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          value={formData.first_name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="college_email"
          placeholder="College Email"
          value={formData.college_email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="modules"
          placeholder="Modules (comma-separated)"
          value={formData.modules}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="hourly_rate"
          placeholder="Hourly Rate (€)"
          value={formData.hourly_rate}
          onChange={handleChange}
          required
        />
        <textarea
          name="bio"
          placeholder="Short Bio"
          value={formData.bio}
          onChange={handleChange}
          rows="4"
        />

        <button
          type="submit"
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Register
        </button>
      </form>

      {message && (
        <p style={{ color: message.includes("successfully") ? "green" : "red" }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default TutorSignup;
