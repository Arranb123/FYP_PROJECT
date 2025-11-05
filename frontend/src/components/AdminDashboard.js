import React, { useEffect, useState } from "react";
import axios from "axios";

function AdminDashboard() {
  const [tutors, setTutors] = useState([]);

  const API_URL = "http://127.0.0.1:5000/api/tutors/unverified";

  // Fetch unverified tutors on load
  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      const res = await axios.get(API_URL);
      setTutors(res.data);
    } catch (error) {
      console.error("Error fetching tutors:", error);
    }
  };

  // Approve tutor (set verified = 1)
  const handleApprove = async (id) => {
    try {
      await axios.put(`http://127.0.0.1:5000/api/tutors/${id}/verify`);
      alert("Tutor approved!");
      fetchTutors();
    } catch (error) {
      console.error("Error approving tutor:", error);
    }
  };

  // Reject tutor (delete record)
  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this tutor?")) return;
    try {
      await axios.delete(`http://127.0.0.1:5000/api/tutors/${id}`);
      alert("Tutor rejected and removed!");
      fetchTutors();
    } catch (error) {
      console.error("Error rejecting tutor:", error);
    }
  };

  return (
    <div style={{ width: "80%", margin: "40px auto", textAlign: "center" }}>
      <h1>Admin Dashboard — Tutor Verification</h1>
      {tutors.length === 0 ? (
        <p>No unverified tutors found.</p>
      ) : (
        <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th>Name</th>
              <th>Email</th>
              <th>Modules</th>
              <th>Hourly Rate (€)</th>
              <th>Proof Document</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tutors.map((tutor) => (
              <tr key={tutor.tutor_id}>
                <td>{tutor.first_name} {tutor.last_name}</td>
                <td>{tutor.college_email}</td>
                <td>{tutor.modules}</td>
                <td>{tutor.hourly_rate}</td>
                <td>{tutor.proof_doc || "No document"}</td>
                <td>
                  <button
                    onClick={() => handleApprove(tutor.tutor_id)}
                    style={{ backgroundColor: "green", color: "white", marginRight: "10px" }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(tutor.tutor_id)}
                    style={{ backgroundColor: "red", color: "white" }}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminDashboard;
