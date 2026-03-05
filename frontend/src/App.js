//studyhive frontend - Iteration 1
//Author : Arran Bearman

// React Docs (2025) "useState, useEffect, useMemo" — https://react.dev/reference/react
// Used for component state and running code on initial render.
import React, { useEffect, useState, useMemo } from "react";
// Iteration 5 - Theme Provider for dark mode support
// Reference: Material UI Documentation (2025) "Theming" — https://mui.com/material-ui/customization/theming/
// Used to provide theme context and dark mode functionality across the entire application.
import { ThemeProvider } from "./components/ThemeProvider";

// Local components (rendered conditionally via navigation)
import TutorSearch from "./components/TutorSearch"; //  Tutor Search component
import TutorSignup from "./components/TutorSignup"; //  Tutor Signup component
import AdminDashboard from "./components/AdminDashboard"; //  Admin Dashboard component
// Iteration 2 additions
import TutorBookings from "./components/TutorBookings";  // Component to show tutor's bookings
import LearnerBookings from "./components/LearnerBookings"; // Component to show learner's bookings
// Iteration 3 additions
import Login from "./components/Login"; // Login component
import Register from "./components/Register"; // Register component
import TutorProfileEdit from "./components/TutorProfileEdit"; // Tutor profile edit component
// Iteration 4 additions
import TutorAvailability from "./components/TutorAvailability"; // Tutor availability management component
import CalendarView from "./components/CalendarView"; // Calendar view component for bookings
import LandingPage from "./components/LandingPage"; // Landing page component
import ToastContainer from "./components/ToastContainer"; // Toast notification container
import MessagesView from "./components/MessagesView"; // Messages view component
import LearnerSpending from "./components/LearnerSpending"; // UX Improvement - Learner spending/payment history component
import TutorEarnings from "./components/TutorEarnings"; // Tutor earnings component
// Iteration 5 - Dark Mode Toggle component
// Reference: Material UI Documentation (2025) "Switch" — https://mui.com/material-ui/react-switch/
// Used to provide a toggle switch for switching between light and dark themes.
import DarkModeToggle from "./components/DarkModeToggle";
// Iteration 5 - How to Use guide pages for learners and tutors
import LearnerGuide from "./components/LearnerGuide";
import TutorGuide from "./components/TutorGuide";
// Iteration 5 - Learner profile editing (modules, name)
import LearnerProfileEdit from "./components/LearnerProfileEdit";
// Import CoreUI CSS first (before custom CSS)
import '@coreui/coreui/dist/css/coreui.min.css';
// Import the custom CSS file for styling
import "./App.css";

// Iteration 3 - Authentication and role-based navigation references
// file references: https://react.dev/reference/react/useState (lines 34-51)
// file references: https://react.dev/reference/react/useMemo (lines 90-112)
// file references: https://react.dev/reference/react/useEffect (lines 141-150)
// file references: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage (lines 79, 134)
// file references: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage (line 119)

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
  // Iteration 3 - check for stored user on mount
  const [initialUserCheck, setInitialUserCheck] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);
  // Iteration 5 - track page before opening a guide so we can return to it
  const [previousPage, setPreviousPage] = useState(null);

  // Iteration 3 - auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authPage, setAuthPage] = useState(null); // Iteration 4 - null means show landing page

  // STUDENT SYSTEM STATE + LOGIC
  // reference , https://www.w3schools.com/REACT/react_usestate.asp
  // UNUSED - Iteration 1 dead code (students page is unreachable via navigation)
  // const [students, setStudents] = useState([]); //stores the current list of students fetched from backend

  // Iteration 2 addition  for tutor bookings dropdown
  // NOTE: Currently unused - kept for potential future use
  // This array stores all the tutors (used for the tutor bookings dropdown)
  // It starts as an empty array 
  // eslint-disable-next-line no-unused-vars
  const [tutors, setTutors] = useState([]);

  /* UNUSED - Iteration 1 dead code
  const [formData, setFormData] = useState({   //holds what the user types in the forms
    first_name: "",
    last_name: "",
    college_email: "",
  });
  const [editId, setEditId] = useState(null); //tracks which student is being edited and null does a new student
  */

  // Iteration 2 addition  for user feedback messages
  // This stores any message I want to show to the user 
  // Empty string means no message to show
  const [message, setMessage] = useState("");

  // Iteration 3 - Handle successful login
  // file reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage (lines 74-88)
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setAuthPage(null);
    // Store user in localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(userData));
    // Redirect based on role
    if (userData.role === 'admin') {
      setCurrentPage('admin');
    } else if (userData.role === 'tutor') {
      setCurrentPage('tutor-bookings');
    } else {
      setCurrentPage('learner-bookings');
    }
  };
  
  // Iteration 3 - get pages based on role
  // file reference: https://react.dev/reference/react/useMemo (lines 90-112)
  const availablePages = useMemo(() => {
    if (!currentUser) return [];
    
    const role = currentUser.role;
    const basePages = [];
    
    if (role === 'admin') {
      // Admin sees: Admin Dashboard
      basePages.push('admin');
    } else if (role === 'tutor') {
      // Iteration 4 - Tutor sees: Tutor Signup (if not linked), Tutor Bookings, Calendar, Availability, Edit Profile, Messages, Earnings
      if (!currentUser.tutor_id) {
        basePages.push('signup');  // Show signup if tutor profile not linked
      }
      basePages.push('tutor-bookings', 'tutor-calendar', 'tutor-availability', 'tutor-profile-edit', 'messages', 'tutor-earnings');
    } else if (role === 'learner') {
      // UX Improvement - Learner sees: Tutor Search, My Bookings, Calendar, Messages, Payment History, Edit Profile
      basePages.push('tutors', 'learner-bookings', 'learner-calendar', 'messages', 'payment-history', 'learner-profile-edit');
    }
    
    return basePages;
  }, [currentUser]);

  // Iteration 3 - registration success handler
  // file reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage (lines 114-129)
  const handleRegisterSuccess = (userData) => {
    // If user registered as tutor, redirect them to tutor signup form
    if (userData && userData.role === 'tutor') {
      // Store the email temporarily so tutor signup can pre-fill it
      sessionStorage.setItem('pendingTutorEmail', userData.email);
      // Show tutor signup page
      setCurrentPage('signup');
      setAuthPage(null);
      setMessage("Registration successful! Please complete your tutor profile below.");
    } else {
      // For other roles, show login page
      setAuthPage('login');
      setMessage("Registration successful! Please log in.");
    }
  };

  // Iteration 3 - Handle logout
  // Iteration 4 - Modified to return to landing page
  // Iteration 5 - Clear persisted page on logout (ChatGPT — https://chatgpt.com/share/6998ce9c-0db0-8008-9560-18ad8cb86d32)
  // file reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage (lines 131-137)
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentPage');
    setCurrentPage(null);
    setAuthPage(null); // Iteration 4 - Return to landing page
  };

  // UNUSED - Iteration 1 dead code
  // const API_URL = `${process.env.REACT_APP_API_URL}/students`; // Flask backend API URL

  // Iteration 3 - check for stored user on mount
  // Iteration 4 - Modified to show landing page instead of login
  // file reference: https://react.dev/reference/react/useEffect (lines 141-150)
  // file reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage (lines 141-150)
  // Iteration 5 - Restore user session and last page from localStorage on refresh
  // file reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
  // ChatGPT conversation on persisting user and page state — https://chatgpt.com/share/6998ce9c-0db0-8008-9560-18ad8cb86d32
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        const savedPage = localStorage.getItem('currentPage');
        if (savedPage) {
          setCurrentPage(savedPage);
        }
      } catch (e) {
        // If stored data is corrupted, clear it and show landing page
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentPage');
      }
    }
    setInitialUserCheck(true);
  }, []);

  // Iteration 5 - Save current page to localStorage so it survives a refresh
  // ChatGPT — https://chatgpt.com/share/6998ce9c-0db0-8008-9560-18ad8cb86d32
  useEffect(() => {
    if (currentUser && currentPage) {
      localStorage.setItem('currentPage', currentPage);
    }
  }, [currentPage, currentUser]);

  /* UNUSED - Iteration 1 dead code
  useEffect(() => {
    if (currentUser) { // Only fetch if user is logged in
      fetchStudents();
    }
  }, [currentUser]);
  */

  // Iteration 3 - Removed tutor fetching for dropdowns since tutors now see only their own data
  
  // Iteration 3 - If current page is not available for user role, redirect to first available page
  // Iteration 5 - guide pages are excluded from this check so they are not immediately reset
  const GUIDE_PAGES = ['learner-guide', 'tutor-guide'];
  useEffect(() => {
    if (currentUser && currentPage && !availablePages.includes(currentPage) && !GUIDE_PAGES.includes(currentPage)) {
      if (availablePages.length > 0) {
        setCurrentPage(availablePages[0]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, currentPage, availablePages]);

  /* UNUSED - Iteration 1 dead code
  const fetchStudents = async () => {  // function sends a get request to flask to get all stidents and show in frontend table
    try {
      const res = await fetch(API_URL);//
      const data = await res.json();//calls flask and converts from json , updates students then
      setStudents(data);//
    } catch (error) {//
      console.error("Error fetching students:", error);//
    }
  };
  */

  // Iteration 2 addition - fetch tutors for bookings dropdown
  // NOTE: Currently unused - kept for potential future use
  // This function gets all verified tutors from the backend API
  // eslint-disable-next-line no-unused-vars
  const fetchTutors = async () => {
    try {
      // Make a GET request to the backend to get all verified tutors
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/tutors`);
      // Convert the response from JSON format to JavaScript objects
      const data = await res.json();
      // Update the tutors state with the data received
      setTutors(data);
    } catch (error) {
      // If something goes wrong, log the error to the console
      console.error("Error fetching tutors:", error);
    }
  };

  /* UNUSED - Iteration 1 dead code
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
  */

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

  // Iteration 3 - Show login/register page if not authenticated
  // All hooks must be called before any early returns
  // file reference: https://react.dev/reference/react (conditional rendering - lines 287-298)
  if (!initialUserCheck) {
    return (
      <div className="container-fluid py-4" style={{ minHeight: "100vh" }}>
        <div className="text-center">
          <span className="spinner-border" role="status" aria-hidden="true"></span>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }


  // Iteration 3 - show login/register if not logged in
  // Iteration 4 - Modified to show landing page first, then login/register when clicked
  // file reference: https://react.dev/reference/react (conditional rendering - lines 301-330)
  if (!currentUser) {
    // Allow tutor signup page if user just registered as tutor
    if (currentPage === "signup") {
      return (
        <div className="container-fluid py-4" style={{ minHeight: "100vh" }}>
          <TutorSignup />
        </div>
      );
    }
    
    // Iteration 4 - Show landing page if authPage is null
    if (authPage === null) {
      return (
        <LandingPage 
          onShowLogin={() => setAuthPage('login')}
          onShowRegister={() => setAuthPage('register')}
        />
      );
    }
    
    // Iteration 5 - Login page uses MUI design with its own full-screen layout
    if (authPage === 'login') {
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onBack={() => setAuthPage(null)}
          onNavigateToRegister={() => setAuthPage('register')}
        />
      );
    }

    // Show register form
    return (
      <div className="container-fluid py-4" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <div className="container">
          {/* Back to landing page button */}
          <div className="mb-3">
            <button
              className="btn btn-link text-muted p-0"
              onClick={() => setAuthPage(null)}
              style={{ textDecoration: 'none' }}
            >
              ← Back to Home
            </button>
          </div>

          <Register onRegisterSuccess={handleRegisterSuccess} />

          {/* Toggle to login */}
          <div className="text-center mt-3">
            <p className="text-muted">
              Already have an account?{' '}
              <button
                className="btn btn-link p-0"
                onClick={() => setAuthPage('login')}
                style={{ textDecoration: 'underline' }}
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't show regular nav for admin dashboard (CoreUI has its own)
  if (currentPage === "admin" && currentUser?.role === 'admin') {
    return (
      <>
        <ToastContainer />
        <AdminDashboard onLogout={handleLogout} currentUser={currentUser} />
      </>
    );
  }

  return (
    // Iteration 2 - Enhanced container with Bootstrap styling
    // Iteration 5 - Added gradient background for logged-in users
    <div className="container-fluid py-4 app-gradient-background d-flex flex-column" style={{ minHeight: "100vh" }}>
      {/* Iteration 4 - Toast notifications container */}
      <ToastContainer />
      {/* Professional Navigation Bar */}
      <nav className="navbar navbar-expand-lg mb-4">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          {/* Brand + How to Use button stacked above logo */}
          <div className="d-flex flex-column align-items-start">
            {/* Iteration 5 - How to Use button above logo */}
            {currentUser && (currentUser.role === 'learner' || currentUser.role === 'tutor') && (
              <button
                className="btn btn-link p-0 mb-1"
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  letterSpacing: '0.01em',
                  lineHeight: 1.2,
                }}
                onClick={() => {
                  setPreviousPage(currentPage);
                  setCurrentPage(currentUser.role === 'learner' ? 'learner-guide' : 'tutor-guide');
                }}
              >
                <i className="bi bi-question-circle me-1"></i>
                How to Use StudyHive
              </button>
            )}
            <div
              className="navbar-brand d-flex align-items-center mb-0"
              style={{
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                borderRadius: '0.75rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gray-50)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => {
                if (availablePages.length > 0) {
                  setCurrentPage(availablePages[0]);
                }
              }}
            >
              <img
                src="/logo.png"
                alt="StudyHive Logo"
                className="logo-navbar me-2"
                style={{ height: "42px" }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="d-none d-md-inline fw-bold" style={{ fontSize: "1.5rem", color: "var(--primary)" }}>
                StudyHive
              </span>
            </div>
          </div>
          
          {/* Navigation - Centered */}
          <div className="navbar-nav flex-row align-items-center" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            {availablePages.map((page) => {
              const pageLabels = {
                "tutors": { label: "Tutor Search", icon: "bi-search" },
                "admin": { label: "Admin Dashboard", icon: "bi-speedometer2" },
                "learner-bookings": { label: "My Bookings", icon: "bi-calendar-check" },
                "tutor-bookings": { label: "My Bookings", icon: "bi-calendar-check" },
                "learner-calendar": { label: "Calendar", icon: "bi-calendar3" },
                "tutor-calendar": { label: "Calendar", icon: "bi-calendar3" },
                "tutor-availability": { label: "Availability", icon: "bi-clock" },
                "tutor-profile-edit": { label: "Edit Profile", icon: "bi-person-gear" },
                "messages": { label: "Messages", icon: "bi-chat-dots" },
                "payment-history": { label: "Payment History", icon: "bi-receipt" },
                "tutor-earnings": { label: "Earnings", icon: "bi-cash-coin" },
                "learner-profile-edit": { label: "Edit Profile", icon: "bi-person-gear" }
              };
              const pageInfo = pageLabels[page] || { label: page, icon: "bi-circle" };
              
              return (
          <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`btn btn-nav ${currentPage === page ? "btn-nav-active" : ""}`}
                >
                  <i className={`bi ${pageInfo.icon} me-2`}></i>
                  <span className="d-none d-lg-inline">{pageInfo.label}</span>
                  <span className="d-lg-none">{pageInfo.label.split(' ')[0]}</span>
          </button>
              );
            })}
          </div>
          
          {/* User Info */}
          <div className="d-flex align-items-center border-start ps-3" style={{ borderColor: "var(--gray-200)" }}>
            {/* Iteration 5 - Dark Mode Toggle */}
            <div className="me-3">
              <DarkModeToggle />
            </div>
            <div className="d-flex flex-column align-items-end me-3 d-none d-md-flex">
              <small className="text-muted" style={{ fontSize: "0.75rem", fontWeight: "500" }}>
                {currentUser.email.split('@')[0]}
              </small>
              <span className={`badge mt-1 ${
                currentUser.role === 'admin' ? 'bg-danger' :
                currentUser.role === 'tutor' ? 'bg-primary' :
                'bg-info'
              }`} style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {currentUser.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline-danger btn-sm"
            >
              <i className="bi bi-box-arrow-right me-1"></i>
              <span className="d-none d-sm-inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area - Flex grow to push footer down */}
      <div className="flex-grow-1">
        {/*  Conditional Rendering - Only show pages user has access to */}
      {/* Note: Students page removed from role-based navigation - only accessible via direct URL if admin */}
      {/* UNUSED - Iteration 1 dead code (students page is unreachable — 'students' is never added to availablePages) */}
      {false && currentPage === "students" && currentUser?.role === 'admin' && (
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

      {/*  Tutor Search Page - Available to learners and tutors */}
      {/* Iteration 3 - Tutor Search - Only for learners (tutors don't need to search for other tutors) */}
      {/* file reference: https://react.dev/reference/react (conditional rendering - lines 606-640) */}
      {currentPage === "tutors" && currentUser?.role === 'learner' && (
        <>
          {!currentUser?.student_id && (
            <div className="container">
              <div className="alert alert-warning">
                <strong>Account Setup Required:</strong> Your learner account is not linked to a student record. 
                Please log out and register again.
              </div>
            </div>
          )}
          <TutorSearch learnerId={currentUser?.student_id || null} />
        </>
      )}

      {/*  Tutor Signup Page - Available to all (for new tutor registration) */}
      {/* Iteration 3 - Allow signup page even when not logged in (for post-registration flow) */}
      {/* file reference: https://react.dev/reference/react (conditional rendering - lines 623-625) */}
      {currentPage === "signup" && <TutorSignup />}


      {/* Iteration 4 - Tutor Availability Management Page - Only for tutors */}
      {currentPage === "tutor-availability" && currentUser?.role === 'tutor' && (
        <div className="container">
          {currentUser?.tutor_id ? (
            <TutorAvailability tutorId={currentUser.tutor_id} />
          ) : (
            <div className="alert alert-warning">
              <strong>Account Setup Required:</strong> Your tutor account is not linked to a tutor profile. 
              <br />
              Please complete the tutor signup form first.
            </div>
          )}
        </div>
      )}

      {/* Iteration 3 - Tutor Profile Edit Page - Only for tutors */}
      {/* file reference: https://react.dev/reference/react (conditional rendering - lines 630-650) */}
      {currentPage === "tutor-profile-edit" && currentUser?.role === 'tutor' && (
        <div className="container">
          {currentUser?.tutor_id ? (
            <TutorProfileEdit tutorId={currentUser.tutor_id} />
          ) : (
            <div className="alert alert-warning">
              <strong>Account Setup Required:</strong> Your tutor account is not linked to a tutor profile. 
              <br />
              Please complete the tutor signup form first (make sure to use the SAME email you used to register: <strong>{currentUser.email}</strong>).
              <br /><br />
              <button 
                className="btn btn-primary me-2"
                onClick={() => setCurrentPage('signup')}
              >
                Go to Tutor Signup
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  // Clear localStorage and reload to force fresh login
                  localStorage.removeItem('currentUser');
                  window.location.reload();
                }}
              >
                Refresh Account (Log Out)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Iteration 2 - Learner Bookings page - Only for learners */}
      {/* Iteration 3 - Removed dropdown, automatically uses logged-in learner's ID */}
      {/* file reference: https://react.dev/reference/react (conditional rendering - lines 661-680) */}
      {currentPage === "learner-bookings" && currentUser?.role === 'learner' && (
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
              My Bookings
            </h2>
          </div>
          {/* Iteration 3 - Show LearnerBookings component using logged-in learner's ID */}
          {currentUser?.student_id ? (
            <LearnerBookings 
              learnerId={currentUser.student_id} 
              onNavigateToTutors={() => setCurrentPage('tutors')}
            />
          ) : (
            <div className="alert alert-warning">
              <strong>Note:</strong> Your account is not linked to a student record. Please contact an administrator.
            </div>
          )}
        </div>
      )}

      {/* Iteration 4 - Learner Calendar page */}
      {currentPage === "learner-calendar" && currentUser?.role === 'learner' && (
        <div className="container">
          {currentUser?.student_id ? (
            <CalendarView userId={currentUser.student_id} role="learner" />
          ) : (
            <div className="alert alert-warning">
              <strong>Account Setup Required:</strong> Your learner account is not linked to a student profile.
            </div>
          )}
        </div>
      )}

      {/* UX Improvement - Learner Payment History page */}
      {currentPage === "payment-history" && currentUser?.role === 'learner' && (
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
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h2 className="mb-4 fw-bold" style={{ fontSize: "1.75rem" }}>
              Payment History
            </h2>
          </div>
          {currentUser?.student_id ? (
            <LearnerSpending learnerId={currentUser.student_id} />
          ) : (
            <div className="alert alert-warning">
              <strong>Note:</strong> Your account is not linked to a student record. Please contact an administrator.
            </div>
          )}
        </div>
      )}

      {/* Iteration 5 - Learner Profile Edit page */}
      {currentPage === "learner-profile-edit" && currentUser?.role === 'learner' && (
        <div className="container">
          {currentUser?.student_id ? (
            <LearnerProfileEdit learnerId={currentUser.student_id} />
          ) : (
            <div className="alert alert-warning">
              <strong>Account Setup Required:</strong> Your learner account is not linked to a student record. Please contact an administrator.
            </div>
          )}
        </div>
      )}

      {/* Iteration 4 - Tutor Earnings page */}
      {currentPage === "tutor-earnings" && currentUser?.role === 'tutor' && (
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
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h2 className="mb-4 fw-bold" style={{ fontSize: "1.75rem" }}>
              My Earnings
            </h2>
          </div>
          {currentUser?.tutor_id ? (
            <TutorEarnings tutorId={currentUser.tutor_id} />
          ) : (
            <div className="alert alert-warning">
              <strong>Note:</strong> Your tutor account is not linked to a tutor profile. Please complete the tutor signup form.
            </div>
          )}
        </div>
      )}

      {/* Iteration 4 - Tutor Calendar page */}
      {currentPage === "tutor-calendar" && currentUser?.role === 'tutor' && (
        <div className="container">
          {currentUser?.tutor_id ? (
            <CalendarView userId={currentUser.tutor_id} role="tutor" />
          ) : (
            <div className="alert alert-warning">
              <strong>Account Setup Required:</strong> Your tutor account is not linked to a tutor profile.
              <br />
              Please complete the tutor signup form first.
            </div>
          )}
        </div>
      )}

      {/* Iteration 4 - Messages page - For both learners and tutors */}
      {currentPage === "messages" && currentUser && (
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
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <h2 className="mb-4 fw-bold" style={{ fontSize: "1.75rem" }}>
              Messages
            </h2>
          </div>
          {currentUser.role === 'learner' && currentUser.student_id && (
            <MessagesView userId={currentUser.student_id} userRole="learner" />
          )}
          {currentUser.role === 'tutor' && currentUser.tutor_id && (
            <MessagesView userId={currentUser.tutor_id} userRole="tutor" />
          )}
          {/* Show warning if user is not linked to a profile */}
          {currentUser.role === 'learner' && !currentUser.student_id && (
            <div className="alert alert-warning">
              <strong>Note:</strong> Your account is not linked to a student record. Please contact an administrator.
            </div>
          )}
          {currentUser.role === 'tutor' && !currentUser.tutor_id && (
            <div className="alert alert-warning">
              <strong>Note:</strong> Your tutor account is not linked to a tutor profile. Please complete the tutor signup form.
            </div>
          )}
        </div>
      )}

      {/* Iteration 5 - How to Use guide pages */}
      {currentPage === 'learner-guide' && currentUser?.role === 'learner' && (
        <LearnerGuide onReturn={() => setCurrentPage(previousPage || availablePages[0])} />
      )}
      {currentPage === 'tutor-guide' && currentUser?.role === 'tutor' && (
        <TutorGuide onReturn={() => setCurrentPage(previousPage || availablePages[0])} />
      )}

      {/* Iteration 2 - Tutor Bookings page - Only for tutors */}
      {/* Iteration 3 - Removed dropdown, automatically uses logged-in tutor's ID */}
      {/* file reference: https://react.dev/reference/react (conditional rendering - lines 696-720) */}
      {currentPage === "tutor-bookings" && currentUser?.role === 'tutor' && (
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
              My Bookings
            </h2>
          </div>
          {/* Iteration 3 - Show TutorBookings component using logged-in tutor's ID */}
          {currentUser?.tutor_id ? (
            <TutorBookings tutorId={currentUser.tutor_id} />
          ) : (
            <div className="alert alert-warning">
              <strong>Account Setup Required:</strong> Your tutor account is not linked to a tutor profile. 
              <br />
              Please complete the tutor signup form first (make sure to use the SAME email you used to register: <strong>{currentUser.email}</strong>).
              <br /><br />
              <button 
                className="btn btn-primary me-2"
                onClick={() => setCurrentPage('signup')}
              >
                Go to Tutor Signup
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  // Clear localStorage and reload to force fresh login
                  localStorage.removeItem('currentUser');
                  window.location.reload();
                }}
              >
                Refresh Account (Log Out)
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Iteration 2 - Footer with logo */}
      <footer className="mt-auto py-4 bg-white border-top">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-12 text-center">
              <img 
                src="/logo.png" 
                alt="StudyHive Logo" 
                className="logo-footer"
                style={{ 
                  height: "55px", 
                  objectFit: "contain",
                  opacity: 0.8
                }} 
                onError={(e) => {
                  // If logo doesn't load, hide it
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Iteration 3 - Authentication, role-based navigation, and conditional rendering
// End Iteration 3

/////////////////
///////////////
//// END OF ITERATION 1 CODE
////////////////
/////////////////


// Iteration 5 - Wrap App with ThemeProvider for dark mode support
// Reference: Material UI Documentation (2025) "ThemeProvider" — https://mui.com/material-ui/customization/theming/#theme-provider
// Used to provide theme context to all child components.
// Provider-in-App.js approach from ChatGPT — https://chatgpt.com/share/6990e11b-33cc-8008-ad1d-9435b9df7a9f
function AppWithTheme() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

export default AppWithTheme;
