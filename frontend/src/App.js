//studyhive frontend - Iteration 1
//Author : Arran Bearman

// React Docs (2025) "useState, useEffect" — https://react.dev/reference/react
// Used for component state and running code on initial render.
import React, { useEffect, useState } from "react";

// Local components (rendered conditionally via navigation)
import TutorSearch from "./components/TutorSearch"; //  Tutor Search component
import TutorSignup from "./components/TutorSignup"; //  Tutor Signup component
import AdminDashboard from "./components/AdminDashboard"; //  Admin Dashboard component
// Iteration 2 additions
import TutorBookings from "./components/TutorBookings";  // Component to show tutor's bookings
import LearnerBookings from "./components/LearnerBookings"; // Component to show learner's bookings
// Import the custom CSS file for styling
import "./App.css";

/////////////////

///////////////
//// START OF ITERATION 1 CODE
///////////////
/////////////////

//reference , https://www.w3schools.com/REACT/react_usestate.asp
//reference ,mdn resource for develpers (2025) https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch used throughout majority of file to assist with 
//understanding how to make HTTP requests (GET, POST, PUT, DELETE) to the Flask backend, handle JSON responses, and update React state based on returned data.
// https://chatgpt.com/share/690e51cc-8464-8008-b5bc-574c9f276503  -- Chat Gpt conversation used to lead me in the right direction to be able to adapt code myself 
function App() {
  //   Controls which page is currently shown for the user
  const [currentPage, setCurrentPage] = useState("students"); //students is the default page for iteration 1

  // Iteration 2 additions  for booking management
  // This stores the ID of the tutor that was selected to view bookings
  // null means no tutor is selected yet
  const [selectedTutorId, setSelectedTutorId] = useState(null);
  
  // This stores the ID of the learner that was selected to view bookings
  // null means no learner is selected yet
  const [selectedLearnerId, setSelectedLearnerId] = useState(null);

  // STUDENT SYSTEM STATE + LOGIC
  // reference , https://www.w3schools.com/REACT/react_usestate.asp
  const [students, setStudents] = useState([]); //stores the current list of students fetched from backend  

  // Iteration 2 addition  for tutor bookings dropdown
  // This array stores all the tutors (used for the tutor bookings dropdown)
  // It starts as an empty array 
  const [tutors, setTutors] = useState([]);

  const [formData, setFormData] = useState({   //holds what the user types in the forms
    first_name: "",
    last_name: "",
    college_email: "",
  });
  const [editId, setEditId] = useState(null); //tracks which student is being edited and null does a new student

  // Iteration 2 addition  for user feedback messages
  // This stores any message I want to show to the user 
  // Empty string means no message to show
  const [message, setMessage] = useState("");

  const API_URL = "http://localhost:5000/students"; // Flask backend API URL // defines backend endpoint, allows to call flask from react and modify DB

  // loads all students once the page loads , only occurs once
  useEffect(() => {
    fetchStudents();
  }, []);

  // Iteration 2 addition - fetch tutors when tutorbookings page is accessed
  // This runs whenever currentPage changes
  // If the user navigates to the tutor-bookings page, it fetches the list of tutors
  useEffect(() => {
    if (currentPage === "tutor-bookings") {
      fetchTutors();
    }
  }, [currentPage]);

  const fetchStudents = async () => {  // function sends a get request to flask to get all stidents and show in frontend table
    try {
      const res = await fetch(API_URL);//
      const data = await res.json();//calls flask and converts from json , updates students then
      setStudents(data);//
    } catch (error) {//
      console.error("Error fetching students:", error);//
    }
  };

  // Iteration 2 addition - fetch tutors for bookings dropdown
  // This function gets all verified tutors from the backend API
  const fetchTutors = async () => {
    try {
      // Make a GET request to the backend to get all verified tutors
      const res = await fetch("http://127.0.0.1:5000/api/tutors");
      // Convert the response from JSON format to JavaScript objects
      const data = await res.json();
      // Update the tutors state with the data received
      setTutors(data);
    } catch (error) {
      // If something goes wrong, log the error to the console
      console.error("Error fetching tutors:", error);
    }
  };

  //got from chatgpt - prompt is in my word doc atm
  // handles editing and updating students
  const handleSubmit = async (e) => {
    e.preventDefault();
    // chatgpt to here -end

    // Iteration 2 enhancement - improved validation with message state
    // Clear any previous messages
    setMessage("");

    // simple user side validation to avoid empty form submission
    if (!formData.first_name || !formData.last_name || !formData.college_email) {
      // Iteration 2 - use message state instead of alert
      setMessage("Please fill out all fields");
      return;
    }

    try {
      let response;
      if (editId) {
        // UPDATE existing student
        response = await fetch(`${API_URL}/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        setEditId(null);//exit edit mode
      } else {
        // ADD new student
        response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      // Iteration 2 enhancement - improved error handling and user feedback
      // Get the response data from the server
      const data = await response.json();

      // Check if the request was successful (status code 200-299)
      if (response.ok) {
        // Clear form and reload list from backend
        setFormData({ first_name: "", last_name: "", college_email: "" });
        // Iteration 2 - show success message
        setMessage("Student saved successfully!");
        fetchStudents();
        // Clear the message after 3 seconds
        setTimeout(() => setMessage(""), 3000);
      } else {
        // If there was an error, show the error message from the server
        setMessage(data.error || "Error saving student. Please try again.");
      }
    } catch (error) {
      console.error("Error saving student:", error);
      // Iteration 2 - show error message
      setMessage("Error saving student. Please try again.");
    }
  };

  const handleEdit = (student) => { //fills the form with the students details and sets the edit id
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      college_email: student.college_email,
    });
    setEditId(student.id);
  };

  const handleDelete = async (id) => {  // sends a delete request to flask then refreshes list
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);//shows if error with deleting student
    }
  };

  // ////////////////////
  // FRONTEND DISPLAY
  // /////////////////////////
  // i used w3 schools for this 
  //react jsx , mix of html,js and css
  //allows me to show dynamically whats on screen
  // https://www.w3schools.com - 104 to end of file It1 - 104-220~
  // Notes:
  // - Top button row sets currentPage
  //   conditional blocks render Students / TutorSearch / TutorSignup / Admin

  return (
    // Iteration 2 - Enhanced container with Bootstrap styling
    <div className="container-fluid py-4" style={{ minHeight: "100vh" }}>
      {/* Iteration 2 - Navigation bar with logo */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white mb-4 rounded shadow-sm">
        <div className="container-fluid">
          {/* Iteration 2 - Brand/logo with clickable home navigation */}
          <span className="navbar-brand fw-bold d-flex align-items-center" style={{ cursor: 'pointer', padding: '0.5rem 0' }} onClick={() => setCurrentPage("students")}>
            <img 
              src="/logo.png" 
              alt="StudyHive Logo" 
              className="logo-navbar"
              onError={(e) => {
                // If logo image doesn't exist, fall back to text
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'inline';
              }}
            />
            <span style={{ display: 'none' }}>StudyHive</span>
          </span>
          {/* Iteration 2 - Enhanced navigation buttons with light blue styling */}
          <div className="navbar-nav flex-row flex-wrap">
            {/* Iteration 2 - Added learner-bookings and tutor-bookings to navigation */}
            {["students", "tutors", "signup", "admin", "learner-bookings", "tutor-bookings"].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                // Iteration 2 - Use light blue navigation button styling, highlight current page
                className={`btn btn-nav me-2 mb-2 ${currentPage === page ? "btn-nav-active" : ""}`}
                style={{ 
                  minWidth: "120px",
                  fontSize: "0.9rem"
                }}
              >
                {page === "students"
                  ? "Students"
                  : page === "tutors"
                  ? "Tutor Search"
                  : page === "signup"
                  ? "Tutor Signup"
                  : page === "admin"
                  ? "Admin"
                  : page === "learner-bookings"
                  ? "My Bookings"
                  : "Tutor Bookings"}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/*  Conditional Rendering */}
      {currentPage === "students" && (
        // Iteration 2 - Enhanced container with Bootstrap styling
        <div className="container">
          {/* Iteration 2 - Page header with logo */}
          <div className="text-center mb-4">
            <div className="mb-3">
              <img 
                src="/logo.png" 
                alt="StudyHive Logo" 
                className="logo-page-header"
                style={{ 
                  height: "90px", 
                  objectFit: "contain"
                }} 
                onError={(e) => {
                  // If logo doesn't load, hide it
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h1 className="mb-0 fw-bold" style={{ fontSize: "2rem" }}>
              Student Registration
            </h1>
          </div>

          {/* Iteration 2 - Enhanced form card */}
          <div className="card shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="card-title mb-3 fw-semibold">Add New Student</h5>
              <form onSubmit={handleSubmit}>
                {/* Iteration 2 - Enhanced form layout with Bootstrap grid */}
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small text-muted">First Name</label>
                    <input
                      placeholder="First Name"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small text-muted">Last Name</label>
                    <input
                      placeholder="Last Name"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small text-muted">College Email</label>
                    <input
                      placeholder="College Email"
                      value={formData.college_email}
                      onChange={(e) =>
                        setFormData({ ...formData, college_email: e.target.value })
                      }
                      className="form-control"
                      type="email"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">
                  {editId ? "Update Student" : "Add Student"}
                </button>
                {/* Iteration 2 - Cancel button when editing */}
                {editId && (
                  <button 
                    type="button" 
                    className="btn btn-secondary ms-2"
                    onClick={() => {
                      setEditId(null);
                      setFormData({ first_name: "", last_name: "", college_email: "" });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Iteration 2 - Success/error message display */}
          {message && (
            <div className={`alert alert-dismissible fade show ${message.includes("successfully") ? "alert-success" : "alert-danger"}`} role="alert">
              {message}
              <button type="button" className="btn-close" onClick={() => setMessage("")} aria-label="Close"></button>
            </div>
          )}

          {/* Iteration 2 - Enhanced section header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="mb-0 fw-bold" style={{ fontSize: "1.5rem" }}>Saved Students</h2>
            <span className="badge bg-primary">{students.length} {students.length === 1 ? 'student' : 'students'}</span>
          </div>

          {/* Iteration 2 - Enhanced table with Bootstrap styling */}
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Email</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length > 0 ? (
                      students.map((student) => (
                        <tr key={student.id}>
                          <td className="align-middle">{student.first_name}</td>
                          <td className="align-middle">{student.last_name}</td>
                          <td className="align-middle">
                            {/* Iteration 2 - Make email clickable */}
                            <a href={`mailto:${student.college_email}`} className="text-decoration-none">
                              {student.college_email}
                            </a>
                          </td>
                          <td className="text-end">
                            <button
                              onClick={() => handleEdit(student)}
                              className="btn btn-sm btn-warning me-2"
                              title="Edit student"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="btn btn-sm btn-danger"
                              title="Delete student"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-5">
                          <div className="text-muted">
                            <p className="mb-0">No students registered yet</p>
                            <small>Add your first student using the form above</small>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Tutor Search Page */}
      {currentPage === "tutors" && <TutorSearch />}

      {/*  Tutor Signup Page */}
      {currentPage === "signup" && <TutorSignup />}

      {/*  Admin Dashboard Page */}
      {currentPage === "admin" && <AdminDashboard />}

      {/* Iteration 2 - Learner Bookings page */}
      {currentPage === "learner-bookings" && (
        <div className="container">
          <div className="text-center mb-4">
            <div className="mb-3">
              <img 
                src="/logo.png" 
                alt="StudyHive Logo" 
                className="logo-page-header"
                style={{ 
                  height: "80px", 
                  objectFit: "contain"
                }} 
                onError={(e) => {
                  // If logo doesn't load, hide it
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h2 className="mb-4 fw-bold" style={{ fontSize: "1.75rem" }}>
              Learner Bookings
            </h2>
          </div>
          {/* Iteration 2 - Dropdown to select which learner's bookings to view */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <label className="form-label fw-semibold mb-3">Select a Learner to View Bookings</label>
              <select
                className="form-select"
                style={{ maxWidth: "500px" }}
                value={selectedLearnerId || ""}
                onChange={(e) => setSelectedLearnerId(parseInt(e.target.value))}
              >
                <option value="">-- Select Learner --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.college_email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Iteration 2 - Show LearnerBookings component only if a learner is selected */}
          {selectedLearnerId && <LearnerBookings learnerId={selectedLearnerId} />}
        </div>
      )}

      {/* Iteration 2 - Tutor Bookings page */}
      {currentPage === "tutor-bookings" && (
        <div className="container">
          <div className="text-center mb-4">
            <div className="mb-3">
              <img 
                src="/logo.png" 
                alt="StudyHive Logo" 
                className="logo-page-header"
                style={{ 
                  height: "80px", 
                  objectFit: "contain"
                }} 
                onError={(e) => {
                  // If logo doesn't load, hide it
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h2 className="mb-4 fw-bold" style={{ fontSize: "1.75rem" }}>
              Tutor Bookings
            </h2>
          </div>
          {/* Iteration 2 - Dropdown to select which tutor's bookings to view */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <label className="form-label fw-semibold mb-3">Select a Tutor to View Bookings</label>
              <div className="alert alert-info mb-3" style={{ fontSize: "0.875rem" }}>
                <strong>Note:</strong> In a full implementation, tutors would log in and see their own bookings automatically.
              </div>
              <select
                className="form-select"
                style={{ maxWidth: "500px" }}
                value={selectedTutorId || ""}
                onChange={(e) => setSelectedTutorId(parseInt(e.target.value))}
              >
                <option value="">-- Select Tutor --</option>
                {tutors.map((tutor) => (
                  <option key={tutor.tutor_id} value={tutor.tutor_id}>
                    {tutor.first_name} {tutor.last_name} ({tutor.college_email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Iteration 2 - Show TutorBookings component only if a tutor is selected */}
          {selectedTutorId && <TutorBookings tutorId={selectedTutorId} />}
        </div>
      )}

      {/* Iteration 2 - Footer with logo and tagline */}
      <footer className="mt-5 py-4 bg-white border-top">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <img 
                src="/logo.png" 
                alt="StudyHive Logo" 
                className="logo-footer"
                style={{ 
                  height: "55px", 
                  objectFit: "contain"
                }} 
                onError={(e) => {
                  // If logo doesn't load, hide it
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="col-md-6 text-center text-md-end">
              <p className="text-muted mb-0 small">
                © {new Date().getFullYear()} StudyHive. All rights reserved.
              </p>
              <p className="text-muted mb-0 small">
                Find Your Perfect Tutor
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/////////////////
///////////////
//// END OF ITERATION 1 CODE
////////////////
/////////////////

export default App;
