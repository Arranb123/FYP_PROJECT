// StudyHive Frontend – Iteration 1
// Admin Dashboard Component
// Author: Arran Ethan Bearman

// Imports
// Reference 
// React Docs (2025) "useState, useEffect" — https://react.dev/reference/react
// Reference (Axios HTTP Library):
// Axios Docs (2025) "Making Requests" — https://axios-http.com/docs/intro
// Used for making GET / PUT / DELETE requests to the Flask backend.
import React, { useEffect, useState } from "react";
import axios from "axios";

/////////////////
///////////////
//// START OF ITERATION 1 CODE
///////////////
/////////////////

// This component allows an Administrator to view all unverified tutors,
// approve them to become verified tutors, or reject them (delete from DB).
// When the component loads, it fetches unverified tutors via Flask.
// When Approve/Reject is clicked, a PUT or DELETE request is sent,
// and the list refreshes automatically after each action.
//reference ,mdn resource for develpers (2025) https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch used throughout majority of file to assist with 
//understanding how to make HTTP requests (GET, POST, PUT, DELETE) to the Flask backend, handle JSON responses, and update React state based on returned data.
function AdminDashboard() {
  //store unverified tutors retrived from the backend
  const [tutors, setTutors] = useState([]);
    //  endpoint for unverified tutor list
  const API_URL = "http://127.0.0.1:5000/api/tutors/unverified";

  // Fetch unverified tutors on load
  useEffect(() => {
    fetchTutors();
  }, []);

  // Reference :
  // Sends GET request to Flask route: `/api/tutors/unverified`
  // Flask returns all tutors with verified = 0.
  // The results are stored in the tutors state variable.
  // https://chatgpt.com/share/690e54f4-42c4-8008-850e-ec6890ba3f12 - -- Chat Gpt conversation used to lead me in the right direction to be able to adapt code myself
  const fetchTutors = async () => {
    try {
      const res = await axios.get(API_URL); //calls flask route , GET, fetches un-v , 
      setTutors(res.data);
    } catch (error) {
      console.error("Error fetching tutors:", error);
    }
  };

  // Approve tutor (set verified = 1)
  const handleApprove = async (id) => { //called when admin presses approve
    try {
      await axios.put(`http://127.0.0.1:5000/api/tutors/${id}/verify`);//sends a request to flask route
      alert("Tutor approved!");
      fetchTutors();//updates after either action
    } catch (error) {
      console.error("Error approving tutor:", error);
    }
  };

  // Reject tutor (delete record)
  const handleReject = async (id) => {  //called if reject is called 
    if (!window.confirm("Are you sure you want to reject this tutor?")) return; //confirm button
    try {
      await axios.delete(`http://127.0.0.1:5000/api/tutors/${id}`); //sends request to delete and its gone then
      alert("Tutor rejected and removed!");
      fetchTutors();//updates after either action
    } catch (error) {
      console.error("Error rejecting tutor:", error);
    }
  };

// Reference:
  // W3Schools (2025) "React JSX" — https://www.w3schools.com
  // Uses React JSX to mix HTML, JS, and CSS dynamically.
  //  75-125~
  // 
  //Bootstrap 5.3 - https://getbootstrap.com/docs/5.3/
 //used for: UI styling, responsive layout, modals, buttons, cards, and other components throughout the frontend

  return (
    // Iteration 2 - Enhanced container with Bootstrap styling
    <div className="container">
      {/* Iteration 2 - Page header with logo */}
      <div className="mb-4">
        <div className="text-center mb-3">
          <img 
            src="/logo.png" 
            alt="StudyHive Logo" 
            className="logo-page-header"
            style={{ 
              height: "70px", 
              objectFit: "contain"
            }} 
            onError={(e) => {
              // If logo doesn't load, hide it
              e.target.style.display = 'none';
            }}
          />
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="mb-2 fw-bold" style={{ fontSize: "2rem" }}>
              Admin Dashboard
            </h1>
            {/* Iteration 2 - Subtitle */}
            <p className="text-muted mb-0">Tutor Verification & Management</p>
          </div>
          {/* Iteration 2 - Badge showing pending count */}
          {tutors.length > 0 && (
            <span className="badge bg-warning text-dark" style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}>
              {tutors.length} Pending {tutors.length === 1 ? 'Application' : 'Applications'}
            </span>
          )}
        </div>
      </div>

      {/* Iteration 2 - Enhanced empty state */}
      {tutors.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <h5 className="fw-semibold mb-2">All Clear!</h5>
            <p className="text-muted mb-0">
              No unverified tutors found. All tutor applications have been processed.
            </p>
          </div>
        </div>
      ) : (
        /* Iteration 2 - Enhanced table with Bootstrap styling */
        <div className="card shadow-sm">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0 fw-semibold">Pending Tutor Applications</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Modules</th>
                    <th>Hourly Rate</th>
                    {/* Iteration 2 - Added Bio column */}
                    <th>Bio</th>
                    <th>Proof Document</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tutors.map((tutor) => (
                    <tr key={tutor.tutor_id}>
                      <td className="align-middle">
                        <strong>{tutor.first_name} {tutor.last_name}</strong>
                      </td>
                      {/* Iteration 2 - Make email clickable */}
                      <td className="align-middle">
                        <a href={`mailto:${tutor.college_email}`} className="text-decoration-none">
                          {tutor.college_email}
                        </a>
                      </td>
                      {/* Iteration 2 - Modules as badge */}
                      <td className="align-middle">
                        <span className="badge bg-info text-dark">{tutor.modules}</span>
                      </td>
                      {/* Iteration 2 - Hourly rate styling */}
                      <td className="align-middle">
                        <span className="fw-bold text-success">€{tutor.hourly_rate}</span>
                      </td>
                      {/* Iteration 2 - Bio column */}
                      <td className="align-middle">
                        <small className="text-muted" style={{ maxWidth: "200px", display: "block" }}>
                          {tutor.bio || <em>No bio provided</em>}
                        </small>
                      </td>
                      {/* Iteration 2 - Proof document badge */}
                      <td className="align-middle">
                        {tutor.proof_doc ? (
                          <span className="badge bg-success">Provided</span>
                        ) : (
                          <span className="badge bg-secondary">No document</span>
                        )}
                      </td>
                      <td className="text-center align-middle">
                        {/* Iteration 2 - Enhanced button styling */}
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={() => handleApprove(tutor.tutor_id)}
                          title="Approve tutor"
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(tutor.tutor_id)}
                          title="Reject tutor"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/////////////////
///////////////
//// End OF ITERATION 1 CODE
///////////////
/////////////////

export default AdminDashboard;
