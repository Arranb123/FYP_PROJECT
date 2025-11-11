// import react and hooks
import React, { useEffect, useState } from "react";
import TutorSearch from "./components/TutorSearch"; // ✅ Tutor Search component
import TutorSignup from "./components/TutorSignup"; // ✅ Tutor Signup component
import AdminDashboard from "./components/AdminDashboard"; // ✅ Admin Dashboard component
import TutorBookings from "./components/TutorBookings"; // ✅ Tutor Bookings component
import LearnerBookings from "./components/LearnerBookings"; // ✅ Learner Bookings component

function App() {
  // ✅ Controls which page is shown
  const [currentPage, setCurrentPage] = useState("students");
  const [selectedTutorId, setSelectedTutorId] = useState(null);
  const [selectedLearnerId, setSelectedLearnerId] = useState(null);

  // ------------------------------
  // STUDENT SYSTEM STATE + LOGIC
  // ------------------------------
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    college_email: "",
  });
  const [editId, setEditId] = useState(null);

  const API_URL = "http://127.0.0.1:5000/students"; // Flask backend API URL

  // Fetch all students on load
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  // Add or update a student
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.college_email) {
      alert("Please fill out all fields");
      return;
    }

    try {
      if (editId) {
        // UPDATE existing student
        await fetch(`${API_URL}/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        setEditId(null);
      } else {
        // ADD new student
        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      // Clear form and reload
      setFormData({ first_name: "", last_name: "", college_email: "" });
      fetchStudents();
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };

  const handleEdit = (student) => {
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      college_email: student.college_email,
    });
    setEditId(student.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  // ------------------------------
  // FRONTEND DISPLAY
  // ------------------------------
  return (
    <div className="container-fluid py-4">
      {/* ✅ Navigation buttons */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4 rounded">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold">StudyHive</span>
          <div className="navbar-nav">
            {["students", "tutors", "signup", "admin", "learner-bookings", "tutor-bookings"].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`btn me-2 ${currentPage === page ? "btn-primary" : "btn-outline-secondary"}`}
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

      {/* ✅ Conditional Rendering */}
      {currentPage === "students" && (
        <div className="container">
          <h1 className="mb-4 fw-bold">Student Registration</h1>
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="col-md-4">
                <input
                  type="email"
                  className="form-control"
                  placeholder="College Email"
                  value={formData.college_email}
                  onChange={(e) =>
                    setFormData({ ...formData, college_email: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              {editId ? "Update Student" : "Add Student"}
            </button>
          </form>

          <h2 className="mb-3">Saved Students</h2>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length > 0 ? (
                  students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.first_name}</td>
                      <td>{student.last_name}</td>
                      <td>{student.college_email}</td>
                      <td>
                        <button
                          onClick={() => handleEdit(student)}
                          className="btn btn-sm btn-warning me-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="btn btn-sm btn-danger"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted">No students found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ✅ Tutor Search Page */}
      {currentPage === "tutors" && <TutorSearch />}

      {/* ✅ Tutor Signup Page */}
      {currentPage === "signup" && <TutorSignup />}

      {/* ✅ Admin Dashboard Page */}
      {currentPage === "admin" && <AdminDashboard />}

      {/* ✅ Learner Bookings Page */}
      {currentPage === "learner-bookings" && (
        <div className="container">
          <h2 className="mb-3">Select a Learner to View Bookings</h2>
          <select
            className="form-select mb-3"
            style={{ maxWidth: "400px" }}
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
          {selectedLearnerId && <LearnerBookings learnerId={selectedLearnerId} />}
        </div>
      )}

      {/* ✅ Tutor Bookings Page */}
      {currentPage === "tutor-bookings" && (
        <div className="container">
          <h2 className="mb-3">Select a Tutor to View Bookings</h2>
          <p className="text-muted mb-3">Note: In a full implementation, tutors would log in and see their own bookings automatically.</p>
          <select
            className="form-select mb-3"
            style={{ maxWidth: "400px" }}
            value={selectedTutorId || ""}
            onChange={(e) => setSelectedTutorId(parseInt(e.target.value))}
          >
            <option value="">-- Select Tutor --</option>
            {/* You would fetch verified tutors here - for now using a placeholder */}
            <option value="1">Tutor ID 1</option>
            <option value="2">Tutor ID 2</option>
          </select>
          {selectedTutorId && <TutorBookings tutorId={selectedTutorId} />}
        </div>
      )}
    </div>
  );
}

export default App;
