// StudyHive Frontend – Iteration 1
// Tutor Search Component
// Author: Arran Ethan Bearman
//reference ,mdn resource for develpers (2025) https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch used throughout majority of file to assist with
//understanding how to make HTTP requests (GET, POST, PUT, DELETE) to the Flask backend, handle JSON responses, and update React state based on returned data.
//
// Pagination
// Reference: Bootstrap 5.3 Documentation (2025) "Pagination" — https://getbootstrap.com/docs/5.3/components/pagination/
// Used to split tutor search results across multiple pages (10 items per page).
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
// UX Improvement - Tutor Profile component
import TutorProfile from "./TutorProfile";

/////////////////
///////////////
//// START OF ITERATION 1 CODE
///////////////
/////////////////

// https://chatgpt.com/share/690e5570-588c-8008-97af-9d6eac98aae2 - -- Chat Gpt conversation used to lead me in the right direction to be able to adapt code myself
// Iteration 3 - TutorSearch receives learnerId as prop from logged-in user
const TutorSearch = ({ learnerId }) => {
  const [module, setModule] = useState(""); //stores what the user types in the search box
  const [tutors, setTutors] = useState([]);  //stores the list of tutors returned from the Flask
  const [loading, setLoading] = useState(false);   // Controls whether Loading… message shows during API call
  const [error, setError] = useState(""); //stores any error message (like "no tutors found"

  // Iteration 4 - Filter state
  // ref:  - https://www.youtube.com/watch?v=0ZJgIjIuY7U 
  // ref:  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minRating: "",
    sortBy: "default"
  });
  const [showFilters, setShowFilters] = useState(false);

  // Iteration 5 - Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset to page 1 whenever search results change
  useEffect(() => {
    setCurrentPage(1);
  }, [tutors]);

  // Iteration 5 - Learner's own modules for quick-filter buttons
  const [learnerModules, setLearnerModules] = useState([]);

  // Iteration 5 - Fetch learner's modules on mount for quick-filter buttons
  useEffect(() => {
    if (!learnerId) return;
    const fetchLearnerModules = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/students/${learnerId}`);
        const modulesStr = res.data.modules || "";
        if (modulesStr.trim()) {
          const parsed = modulesStr.split(',').map(m => m.trim()).filter(m => m.length > 0);
          setLearnerModules(parsed);
        }
      } catch (err) {
        console.error("Error fetching learner modules:", err);
      }
    };
    fetchLearnerModules();
  }, [learnerId]);

  // Iteration 3 - Removed learner dropdown, uses learnerId from props
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  // UX Improvement - State for showing tutor profile
  const [viewingProfileId, setViewingProfileId] = useState(null);

  // Iteration 4 - Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Iteration 4 - Clear all filters
  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      minRating: "",
      sortBy: "default"
    });
  };

  // Iteration 5 - Added optional searchTerm parameter for quick-filter buttons
  const handleSearch = async (e, searchTerm) => {
    // Iteration 4 - Allow form submission via Enter key
    if (e) e.preventDefault();

    // Use explicit searchTerm if provided (from quick-filter), otherwise use module state
    const searchModule = searchTerm || module;

    //validation ensure user has typed something
    if (!searchModule.trim()) {
      setError("Please enter a module name to search");  //this part checks if a user enters a module and if not gives an error
      if (window.showToast) {
        window.showToast("Please enter a module name to search", "warning", 3000);
      }
      return;
    }
    //reset errors and show loading state
    setLoading(true);
    setError("");
    try {  //this calls the flask route . then it returns all verified tutors
      // Iteration 4 - Build query string with filters
      let queryParams = `module=${encodeURIComponent(searchModule)}`;
      
      if (filters.minPrice) {
        queryParams += `&min_price=${filters.minPrice}`;
      }
      if (filters.maxPrice) {
        queryParams += `&max_price=${filters.maxPrice}`;
      }
      if (filters.minRating) {
        queryParams += `&min_rating=${filters.minRating}`;
      }
      if (filters.sortBy && filters.sortBy !== "default") {
        queryParams += `&sort_by=${filters.sortBy}`;
      }
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/tutors?${queryParams}`);
      setTutors(response.data);//stores list of tutors in component state
      if (response.data.length === 0) { //if no tutor found show this message
        setError("No tutors found matching your criteria. Try adjusting your filters.");
        if (window.showToast) {
          window.showToast("No tutors found. Try adjusting your search or filters.", "info", 4000);
        }
      } else {
        // Iteration 4 - Show success toast
        if (window.showToast) {
          window.showToast(`Found ${response.data.length} tutor${response.data.length === 1 ? '' : 's'}`, "success", 2000);
        }
      }
    } catch (err) { // handles api and network errors
      const errorMsg = err?.response?.data?.error || "Error fetching tutors. Please try again later.";
      setError(errorMsg);
      if (window.showToast) {
        window.showToast(errorMsg, "error", 4000);
      }
    }
    setLoading(false);
  };

  // Iteration 3 - Function to handle booking a session (uses learnerId from props)
  const handleBookSession = (tutor) => {
    if (!learnerId) {
      setError("You must be logged in as a learner to book sessions. Please ensure your account is linked to a student record.");
      console.error("learnerId is missing:", learnerId);
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

      {/* Iteration 3 - Removed learner dropdown, uses logged-in user automatically */}

      {/* Professional Search Section */}
      <div className="card mb-5">
        <div className="card-body">
          <div className="page-header mb-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h2 className="mb-2">Find Your Perfect Tutor</h2>
                <p className="text-muted mb-0">Search by module, filter by price and rating</p>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setShowFilters(!showFilters)}
                type="button"
              >
                <i className={`bi ${showFilters ? 'bi-chevron-up' : 'bi-funnel'} me-2`}></i>
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>
          </div>

          {/* Iteration 5 - Quick-filter buttons from learner's own modules */}
          {learnerModules.length > 0 && (
            <div className="mb-3">
              <small className="text-muted d-block mb-2">
                <i className="bi bi-bookmark-star me-1"></i>My Modules:
              </small>
              <div className="d-flex flex-wrap gap-2">
                {learnerModules.map((mod, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`btn btn-sm ${module === mod ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => {
                      setModule(mod);
                      handleSearch(null, mod);
                    }}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleSearch(e)}>
            <div className="input-group input-group-lg mb-3">
              <span className="input-group-text bg-white">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="Enter module name (e.g. Accounting, Mathematics, Physics)"
                autoFocus
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Searching...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-2"></i>
                    Search
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Professional Filter Panel */}
          {showFilters && (
            <div className="border-top pt-4 mt-4">
              <h5 className="fw-bold mb-4">Filter Results</h5>
              <div className="row g-4">
                {/* Price Range */}
                <div className="col-md-6">
                  <label className="form-label small">Min Price (€/hour)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    placeholder="e.g. 10"
                    min="0"
                    step="0.50"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Max Price (€/hour)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    placeholder="e.g. 50"
                    min="0"
                    step="0.50"
                  />
                </div>
                {/* Rating Filter */}
                <div className="col-md-6">
                  <label className="form-label small">Minimum Rating</label>
                  <select
                    className="form-select form-select-sm"
                    name="minRating"
                    value={filters.minRating}
                    onChange={handleFilterChange}
                  >
                    <option value="">Any Rating</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4.0">4.0+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                    <option value="3.0">3.0+ Stars</option>
                    <option value="2.5">2.5+ Stars</option>
                    <option value="2.0">2.0+ Stars</option>
                  </select>
                </div>
                {/* Sort By */}
                <div className="col-md-6">
                  <label className="form-label small">Sort By</label>
                  <select
                    className="form-select form-select-sm"
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                  >
                    <option value="default">Default (Rating High to Low)</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="rating_high">Rating: High to Low</option>
                    <option value="rating_low">Rating: Low to High</option>
                  </select>
                </div>
                {/* Clear Filters Button */}
                <div className="col-12">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={clearFilters}
                    type="button"
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
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

      {/* Professional Results Header */}
      {!loading && tutors.length > 0 && (
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h3 className="fw-bold mb-1">Search Results</h3>
              <p className="text-muted mb-0">
                Found {tutors.length} {tutors.length === 1 ? 'tutor' : 'tutors'} matching your search
              </p>
            </div>
            {filters.minPrice || filters.maxPrice || filters.minRating || filters.sortBy !== 'default' ? (
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={clearFilters}
              >
                <i className="bi bi-x-circle me-2"></i>
                Clear Filters
              </button>
            ) : null}
          </div>
        </div>
      )}
      
      {/* Iteration 2 - Enhanced tutor cards with Bootstrap grid */}
      {/* Iteration 5 - Pagination slice */}
      <div className="row g-4">
        {tutors.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((tutor) => (
          <div key={tutor.tutor_id} className="col-md-6 col-lg-4">
            <div 
              className="card h-100" 
              style={{ 
                borderTop: "4px solid var(--primary)",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "var(--shadow-lg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title mb-0 fw-bold" style={{ color: "#1f2937", fontSize: "1.25rem" }}>
                    {tutor.first_name} {tutor.last_name}
                  </h5>
                  {/* UX Improvement - Enhanced verified badge */}
                  {tutor.verified === 1 && (
                    <span className="badge bg-success d-flex align-items-center" style={{ fontSize: "0.75rem" }}>
                      <i className="bi bi-check-circle-fill me-1"></i>
                      Verified
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <p className="card-text mb-2">
                    <strong>Modules:</strong>
                  </p>
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    {tutor.modules 
                      ? tutor.modules.split(',').map((module, idx) => (
                          <span key={idx} className="badge bg-primary">
                            {module.trim()}
                          </span>
                        ))
                      : <span className="text-muted">No modules listed</span>
                    }
                  </div>
                  {/* UX Improvement - Better rate and rating display */}
                  <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                    <div>
                      <small className="text-muted d-block">Hourly Rate</small>
                      <span className="text-success fw-bold fs-5">€{tutor.hourly_rate}</span>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block">Rating</small>
                      {tutor.rating > 0 ? (
                        <span className="text-warning fw-bold fs-5">
                          <i className="bi bi-star-fill me-1"></i>
                          {tutor.rating.toFixed(1)}/5
                        </span>
                      ) : (
                        <span className="text-muted small">No ratings</span>
                      )}
                    </div>
                  </div>
                  {/* Iteration 2 - Bio display */}
                  {tutor.bio && (
                    <p className="card-text text-muted small" style={{ fontStyle: "italic" }}>
                      "{tutor.bio}"
                    </p>
                  )}
                </div>

                {/* Professional Action buttons */}
                <div className="d-flex gap-2 mt-auto pt-3" style={{ borderTop: "1px solid var(--gray-200)" }}>
                  <button
                    className="btn btn-outline-primary flex-fill"
                    onClick={() => setViewingProfileId(tutor.tutor_id)}
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    View Profile
                  </button>
                  <button
                    className="btn btn-success flex-fill"
                    onClick={() => handleBookSession(tutor)}
                  >
                    <i className="bi bi-calendar-plus me-2"></i>
                    Book Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Iteration 5 - Pagination controls */}
      {Math.ceil(tutors.length / ITEMS_PER_PAGE) > 1 && (
        <nav className="mt-4 d-flex justify-content-center">
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
            </li>
            {Array.from({ length: Math.ceil(tutors.length / ITEMS_PER_PAGE) }, (_, i) => (
              <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
              </li>
            ))}
            <li className={`page-item ${currentPage === Math.ceil(tutors.length / ITEMS_PER_PAGE) ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>Next</button>
            </li>
          </ul>
        </nav>
      )}

      {/* UX Improvement - Enhanced empty state */}
      {!loading && !error && tutors.length === 0 && module && (
        <div className="card shadow-sm mt-4">
          <div className="card-body text-center py-5">
            <div className="mb-4" style={{ fontSize: "4rem", opacity: 0.3 }}>
              <i className="bi bi-search"></i>
            </div>
            <h5 className="fw-semibold mb-2">No Tutors Found</h5>
            <p className="text-muted mb-4">
              We couldn't find any tutors for "{module}". Try searching for a different module or adjust your filters.
            </p>
            <button 
              className="btn btn-outline-primary"
              onClick={clearFilters}
            >
              <i className="bi bi-x-circle me-2"></i>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* UX Improvement - Tutor Profile Modal */}
      {viewingProfileId && (
        <TutorProfile
          tutorId={viewingProfileId}
          learnerId={learnerId}
          onClose={() => setViewingProfileId(null)}
        />
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
            learnerId={learnerId}
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
