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
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <h2 className="mb-4 text-center">Tutor Sign-Up</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                name="first_name"
                placeholder="First Name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                name="last_name"
                placeholder="Last Name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                name="college_email"
                placeholder="College Email"
                value={formData.college_email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                name="modules"
                placeholder="Modules (comma-separated)"
                value={formData.modules}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="number"
                className="form-control"
                name="hourly_rate"
                placeholder="Hourly Rate (€)"
                value={formData.hourly_rate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <textarea
                className="form-control"
                name="bio"
                placeholder="Short Bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Register as Tutor
            </button>
          </form>

          {message && (
            <div className={`alert mt-3 ${message.includes("successfully") ? "alert-success" : "alert-danger"}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorSignup;
