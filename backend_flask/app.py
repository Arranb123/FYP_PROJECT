from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# DATABASE CONNECTION HELPER

def get_db_connection():
    conn = sqlite3.connect('fyp_tutoring.db')
    conn.row_factory = sqlite3.Row
    return conn


#   STUDENT CRUD ROUTES  


@app.route('/students', methods=['GET'])
def get_students():
    conn = get_db_connection()
    students = conn.execute("SELECT * FROM students").fetchall()
    conn.close()
    student_list = [
        {"id": s["id"], "first_name": s["first_name"], "last_name": s["last_name"], "college_email": s["college_email"]}
        for s in students
    ]
    return jsonify(student_list)


@app.route('/students', methods=['POST'])
def add_student():
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    college_email = data.get('college_email')

    if not all([first_name, last_name, college_email]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO students (first_name, last_name, college_email) VALUES (?, ?, ?)",
        (first_name, last_name, college_email)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Student added successfully"}), 201


@app.route('/students/<int:id>', methods=['PUT'])
def update_student(id):
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    college_email = data.get('college_email')

    conn = get_db_connection()
    conn.execute(
        "UPDATE students SET first_name=?, last_name=?, college_email=? WHERE id=?",
        (first_name, last_name, college_email, id)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Student updated successfully"})


@app.route('/students/<int:id>', methods=['DELETE'])
def delete_student(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM students WHERE id=?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Student deleted successfully"})



#   TUTOR ROUTES  


# CREATE TABLE (only needed once)
conn = sqlite3.connect('fyp_tutoring.db')
conn.execute("""
CREATE TABLE IF NOT EXISTS tutors (
    tutor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    college_email TEXT UNIQUE NOT NULL,
    modules TEXT NOT NULL,
    hourly_rate REAL NOT NULL,
    rating REAL DEFAULT 0,
    bio TEXT,
    profile_pic TEXT,
    verified INTEGER DEFAULT 0,
    proof_doc TEXT
);
""")
conn.commit()
conn.close()


# ADD A NEW TUTOR (Signup)
@app.route('/api/tutors', methods=['POST'])
def add_tutor():
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    college_email = data.get('college_email')
    modules = data.get('modules')
    hourly_rate = data.get('hourly_rate')
    rating = data.get('rating', 0)
    bio = data.get('bio', '')
    profile_pic = data.get('profile_pic', '')
    verified = data.get('verified', 0)
    proof_doc = data.get('proof_doc', '')

    if not all([first_name, last_name, college_email, modules, hourly_rate]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tutors (first_name, last_name, college_email, modules, hourly_rate, rating, bio, profile_pic, verified, proof_doc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (first_name, last_name, college_email, modules, hourly_rate, rating, bio, profile_pic, verified, proof_doc))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({"message": "Tutor added successfully!", "tutor_id": new_id}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 400



# GET VERIFIED TUTORS (for learners)

@app.route('/api/tutors', methods=['GET'])
def get_tutor_list():
    module_query = request.args.get("module", "").strip()
    conn = get_db_connection()
    cursor = conn.cursor()

    if module_query:
        cursor.execute("SELECT * FROM tutors WHERE verified = 1 AND modules LIKE ?", ('%' + module_query + '%',))
    else:
        cursor.execute("SELECT * FROM tutors WHERE verified = 1")

    tutors = cursor.fetchall()
    conn.close()

    tutor_list = [
        {
            "tutor_id": t["tutor_id"],
            "first_name": t["first_name"],
            "last_name": t["last_name"],
            "college_email": t["college_email"],
            "modules": t["modules"],
            "hourly_rate": t["hourly_rate"],
            "rating": t["rating"],
            "bio": t["bio"],
            "profile_pic": t["profile_pic"],
            "verified": t["verified"],
            "proof_doc": t["proof_doc"]
        }
        for t in tutors
    ]
    return jsonify(tutor_list)



# GET UNVERIFIED TUTORS (for Admin page)

@app.route('/api/tutors/unverified', methods=['GET'])
def get_unverified_tutors():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tutors WHERE verified = 0")
    tutors = cursor.fetchall()
    conn.close()

    tutor_list = [
        {
            "tutor_id": t["tutor_id"],
            "first_name": t["first_name"],
            "last_name": t["last_name"],
            "college_email": t["college_email"],
            "modules": t["modules"],
            "hourly_rate": t["hourly_rate"],
            "rating": t["rating"],
            "bio": t["bio"],
            "profile_pic": t["profile_pic"],
            "verified": t["verified"],
            "proof_doc": t["proof_doc"]
        }
        for t in tutors
    ]
    return jsonify(tutor_list)



# APPROVE TUTOR (set verified = 1)

@app.route('/api/tutors/<int:tutor_id>/verify', methods=['PUT'])
def approve_tutor(tutor_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE tutors SET verified = 1 WHERE tutor_id = ?", (tutor_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Tutor approved successfully!"}), 200



# REJECT TUTOR (delete record)

@app.route('/api/tutors/<int:tutor_id>', methods=['DELETE'])
def reject_tutor(tutor_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tutors WHERE tutor_id = ?", (tutor_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Tutor rejected and deleted."}), 200



# RUN LOCALLY PORT 5000
 

if __name__ == '__main__':
    app.run(debug=True, port=5000)
