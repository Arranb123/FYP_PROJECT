// StudyHive Frontend – Iteration 1
// Tutor Search Component
// Author: Arran Ethan Bearman
//reference ,mdn resource for develpers (2025) https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch used throughout majority of file to assist with 
//understanding how to make HTTP requests (GET, POST, PUT, DELETE) to the Flask backend, handle JSON responses, and update React state based on returned data.
// Reference (React Hooks):
// React Docs (2025) "useState Hook" — https://react.dev/reference/react/useState
// Used for managing component level state for search input and API results.
// Reference (Axios HTTP Library):
// Axios Docs (2025) "Making Requests" — https://axios-http.com/docs/intro
// Used to call Flask API endpoints for fetching verified tutors.
import React, { useState, useEffect } from "react";
import axios from "axios";
// Iteration 2 additions
import BookingForm from "./BookingForm";

/////////////////
///////////////
//// START OF ITERATION 1 CODE
///////////////
/////////////////

// https://chatgpt.com/share/690e5570-588c-8008-97af-9d6eac98aae2 - -- Chat Gpt conversation used to lead me in the right direction to be able to adapt code myself
const TutorSearch = () => {
  const [module, setModule] = useState(""); //stores what the user types in the search box
  const [tutors, setTutors] = useState([]);  //stores the list of tutors returned from the Flask
  const [loading, setLoading] = useState(false);   // Controls whether Loading… message shows during API call
  const [error, setError] = useState(""); //stores any error message (like "no tutors found"

  // Iteration 2 additions - for booking functionality
  // This array stores all the students/learners (for the dropdown)
  const [students, setStudents] = useState([]);
  // This stores the ID of the learner who is making the booking
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  // This stores the tutor object that was selected for booking
  const [selectedTutor, setSelectedTutor] = useState(null);
  // This boolean controls whether the booking form modal is shown
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Iteration 2 - Fetch students for learner selection
  useEffect(() => {
    fetchStudents();
  }, []);

  // Iteration 2 - Function to fetch students
  const fetchStudents = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:5000/students");
      setStudents(res.data);
      if (res.data.length > 0) {
        setSelectedLearnerId(res.data[0].id.toString());
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleSearch = async () => {
    //validation ensure user has typed something
    if (!module.trim()) {
      setError("Please enter a module name");  //this part checks if a user enters a module and if not gives an error
      return;
    }
    //reset errors and show loading state
    setLoading(true);
    setError("");
    try {  //this calls the flask route . then it returns all verifed tutors
      const response = await axios.get(`http://127.0.0.1:5000/api/tutors?module=${module}`);
      setTutors(response.data);//stores list of tutors in component state
      if (response.data.length === 0) { //if no tutor found show this message
        setError("No tutors found for that module.");
      }
    } catch (err) { // handles api and network errors
      setError("Error fetching tutors. Please try again later.");
    }
    setLoading(false);
  };

  // Iteration 2 - Function to handle booking a session
  const handleBookSession = (tutor) => {
    if (!selectedLearnerId) {
      setError("Please select a learner first");
      return;
    }
    setSelectedTutor(tutor);
    setShowBookingForm(true);
  };

  // Iteration 2 - Callback for successful booking
  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setSelectedTutor(null);
  };

  // FRONTEND DISPLAY (JSX)
  //Reference:
  // W3Schools (2025)  — https://www.w3schools.com
  // Uses JSX to render HTML and JS together. Displays:
  // - Input field for module name
  // - Search button
  // - Dynamic list of tutor cards
  // - Conditional error and loading messages   --  58-120~
  return (
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
              height: "80px", 
              objectFit: "contain"
            }} 
            onError={(e) => {
              // If logo doesn't load, hide it
              e.target.style.display = 'none';
            }}
          />
        </div>
        <h2 className="mb-0 fw-bold" style={{ fontSize: "2rem" }}>
          Search Tutors by Module
        </h2>
      </div>

      {/* Iteration 2 - Learner selection dropdown */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-4">
          <label className="form-label fw-semibold mb-3">
            Select Learner:
          </label>
          <select
            className="form-select"
            value={selectedLearnerId}
            onChange={(e) => setSelectedLearnerId(e.target.value)}
            style={{ maxWidth: "500px" }}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} ({student.college_email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Iteration 2 - Enhanced search input card */}
      <div className="card shadow-sm mb-4">
        <div className="card-body p-4">
          <label className="form-label fw-semibold mb-3">
            Search for Tutors
          </label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="Enter module name (e.g. Accounting, Mathematics, Physics)"
            />
            <button
              className="btn btn-primary"
              onClick={handleSearch}
              type="button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </button>
          </div>
          <small className="text-muted mt-2 d-block">
            Tip: You can search by any module name. Tutors teaching that module will appear below.
          </small>
        </div>
      </div>

      {/* Iteration 2 - Enhanced loading indicator */}
      {loading && (
        <div className="alert alert-info d-flex align-items-center">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Loading tutors...
        </div>
      )}
      {/* Iteration 2 - Enhanced error message */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Iteration 2 - Tutor count display */}
      {!loading && tutors.length > 0 && (
        <div className="mb-3">
          <h4 className="fw-semibold mb-3">
            Found {tutors.length} {tutors.length === 1 ? 'tutor' : 'tutors'}
          </h4>
        </div>
      )}
      
      {/* Iteration 2 - Enhanced tutor cards with Bootstrap grid */}
      <div className="row g-4">
        {tutors.map((tutor) => (
          <div key={tutor.tutor_id} className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm" style={{ borderTop: "4px solid #4f46e5" }}>
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title mb-0 fw-bold">
                    {tutor.first_name} {tutor.last_name}
                  </h5>
                  {/* Iteration 2 - Verified badge */}
                  {tutor.verified === 1 && (
                    <span className="badge bg-success">Verified</span>
                  )}
                </div>

                <div className="mb-3">
                  <p className="card-text mb-2">
                    <strong>Modules:</strong> <span className="text-primary">{tutor.modules}</span>
                  </p>
                  <p className="card-text mb-2">
                    <strong>Hourly Rate:</strong> <span className="text-success fw-bold">€{tutor.hourly_rate}</span>
                  </p>
                  <p className="card-text mb-2">
                    <strong>Rating:</strong> {tutor.rating > 0 ? (
                      <span className="text-warning">
                        {tutor.rating.toFixed(1)}/5
                      </span>
                    ) : (
                      <span className="text-muted">No ratings yet</span>
                    )}
                  </p>
                  {/* Iteration 2 - Bio display */}
                  {tutor.bio && (
                    <p className="card-text text-muted small" style={{ fontStyle: "italic" }}>
                      "{tutor.bio}"
                    </p>
                  )}
                </div>

                {/* Iteration 2 - Book Session button */}
                <button
                  className="btn btn-success mt-auto"
                  onClick={() => handleBookSession(tutor)}
                  style={{ width: "100%" }}
                >
                  Book Session
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Iteration 2 - Enhanced empty state */}
      {!loading && !error && tutors.length === 0 && module && (
        <div className="card shadow-sm mt-4">
          <div className="card-body text-center py-5">
            <h5 className="fw-semibold">No tutors found</h5>
            <p className="text-muted mb-0">
              Try searching for a different module or check back later.
            </p>
          </div>
        </div>
      )}

      {/* Iteration 2 - Booking form  */}
      {showBookingForm && selectedTutor && (
        <>
          <div className="modal-backdrop fade show" onClick={() => {
            setShowBookingForm(false);
            setSelectedTutor(null);
          }}></div>
          <BookingForm
            tutor={selectedTutor}
            learnerId={parseInt(selectedLearnerId)}
            onClose={() => {
              setShowBookingForm(false);
              setSelectedTutor(null);
            }}
            onSuccess={handleBookingSuccess}
          />
        </>
      )}
    </div>
  );
};

/////////////////
///////////////
//// End OF ITERATION 1 CODE
////////////////
/////////////////

export default TutorSearch;
