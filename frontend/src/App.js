// import react and hooks
import React, { useEffect, useState } from "react"; 

function App() { // function component for app
  const [students, setStudents] = useState([]); //stores list of all students fetched from backend
  const [formData, setFormData] = useState({ // stores input data from the form
    first_name: "",
    last_name: "",
    college_email: "",
  });
  const [editId, setEditId] = useState(null); //keeps track of what student is being edited

  const API_URL = "http://localhost:5000/students"; // flask backend api url

  // Fetch all students on load
  useEffect(() => {
    fetchStudents();
  }, []);

  //use effect - runs auto when page loads and fetches studnets from backend
  const fetchStudents = async () => {
    try {
      const res = await fetch(API_URL); // sends get request to flask
      const data = await res.json(); //converts json resonse to json object
      setStudents(data); // saves it and renders table
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };
//function to add or update form
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload

    if (!formData.first_name || !formData.last_name || !formData.college_email) {
      alert("Please fill out all fields");
      return;
    }

    try { // fpr editing students will upodate here
      if (editId) {
        // UPDATE existing student
        await fetch(`${API_URL}/${editId}`, {
          method: "PUT", // update request
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

      // Clear form & reload students
      setFormData({ first_name: "", last_name: "", college_email: "" });
      fetchStudents();
    } catch (error) {
      console.error("Error saving student:", error);
    }
  };
// function populates form when editing
  const handleEdit = (student) => {
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      college_email: student.college_email,
    });
    setEditId(student.id);  // stores id of student being edited
  };

  //delete student
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  return (
    <div style={{ width: "80%", margin: "40px auto", textAlign: "center" }}>
      <h1 style={{ fontWeight: "bold" }}>Student Registration</h1>
        {/* Form section for input fields */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <input
          placeholder="First Name"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
        />
        <input
          placeholder="Last Name"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
        />
        <input
          placeholder="College Email"
          value={formData.college_email}
          onChange={(e) => setFormData({ ...formData, college_email: e.target.value })}
        />
        <button type="submit" style={{ marginLeft: "10px" }}>
          {editId ? "Update" : "Save"}
        </button>
      </form>
      {/* Table shows all saved students */}
      <h2>Saved Students</h2>
      <table
        border="1"
        style={{
          width: "70%",
          margin: "0 auto",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        {/* loops through students and displays each record */}
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
                    style={{ marginRight: "10px" }}
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDelete(student.id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No students found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;  // exports component to allow react to render it
