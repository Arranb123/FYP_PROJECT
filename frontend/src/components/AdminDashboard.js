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
      fetchTutors();
    } catch (error) {
      console.error("Error approving tutor:", error);
      alert("Error approving tutor. Please try again.");
    }
  };

  // Reject tutor (delete record)
  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this tutor?")) return;
    try {
      await axios.delete(`http://127.0.0.1:5000/api/tutors/${id}`);
      fetchTutors();
    } catch (error) {
      console.error("Error rejecting tutor:", error);
      alert("Error rejecting tutor. Please try again.");
    }
  };

  return (
    <div className="container">
      <h1 className="mb-4">Admin Dashboard — Tutor Verification</h1>
      {tutors.length === 0 ? (
        <div className="alert alert-info">No unverified tutors found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
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
                  <td>€{tutor.hourly_rate}</td>
                  <td>{tutor.proof_doc || "No document"}</td>
                  <td>
                    <button
                      className="btn btn-success btn-sm me-2"
                      onClick={() => handleApprove(tutor.tutor_id)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleReject(tutor.tutor_id)}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
