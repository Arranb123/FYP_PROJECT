from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# DATABASE CONNECTION HELPER

def get_db_connection():
    conn = sqlite3.connect('fyp_tutoring.db')
    conn.row_factory = sqlite3.Row
    return conn

# DATABASE INITIALIZATION AND MIGRATIONS
def init_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Add timestamps to students table if they don't exist
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Add timestamps to tutors table if they don't exist
    try:
        cursor.execute("ALTER TABLE tutors ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    try:
        cursor.execute("ALTER TABLE tutors ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Create bookings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bookings (
        booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
        learner_id INTEGER NOT NULL,
        tutor_id INTEGER NOT NULL,
        session_date DATE NOT NULL,
        session_time TIME NOT NULL,
        duration INTEGER NOT NULL DEFAULT 60,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (learner_id) REFERENCES students(id),
        FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id)
    );
    """)
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_database()


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
        "INSERT INTO students (first_name, last_name, college_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (first_name, last_name, college_email, datetime.now(), datetime.now())
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
        "UPDATE students SET first_name=?, last_name=?, college_email=?, updated_at=? WHERE id=?",
        (first_name, last_name, college_email, datetime.now(), id)
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
    rating = 0  # Ratings should come from learner reviews, not self-assigned
    bio = data.get('bio', '')
    profile_pic = data.get('profile_pic', '')
    verified = data.get('verified', 0)
    proof_doc = data.get('proof_doc', '')

    if not all([first_name, last_name, college_email, modules, hourly_rate]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now()
        cursor.execute("""
            INSERT INTO tutors (first_name, last_name, college_email, modules, hourly_rate, rating, bio, profile_pic, verified, proof_doc, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (first_name, last_name, college_email, modules, hourly_rate, rating, bio, profile_pic, verified, proof_doc, now, now))
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
    cursor.execute("UPDATE tutors SET verified = 1, updated_at = ? WHERE tutor_id = ?", (datetime.now(), tutor_id))
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



#   BOOKING ROUTES

# CREATE A NEW BOOKING
@app.route('/api/bookings', methods=['POST'])
def create_booking():
    data = request.get_json()
    learner_id = data.get('learner_id')
    tutor_id = data.get('tutor_id')
    session_date = data.get('session_date')
    session_time = data.get('session_time')
    duration = data.get('duration', 60)  # Default 60 minutes

    if not all([learner_id, tutor_id, session_date, session_time]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now()
        cursor.execute("""
            INSERT INTO bookings (learner_id, tutor_id, session_date, session_time, duration, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
        """, (learner_id, tutor_id, session_date, session_time, duration, now, now))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({"message": "Booking created successfully!", "booking_id": new_id}), 201
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 400


# GET BOOKINGS FOR A TUTOR
@app.route('/api/bookings/tutor/<int:tutor_id>', methods=['GET'])
def get_tutor_bookings(tutor_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.*, s.first_name as learner_first_name, s.last_name as learner_last_name, s.college_email as learner_email
        FROM bookings b
        JOIN students s ON b.learner_id = s.id
        WHERE b.tutor_id = ?
        ORDER BY b.session_date DESC, b.session_time DESC
    """, (tutor_id,))
    bookings = cursor.fetchall()
    conn.close()

    booking_list = [
        {
            "booking_id": b["booking_id"],
            "learner_id": b["learner_id"],
            "learner_name": f"{b['learner_first_name']} {b['learner_last_name']}",
            "learner_email": b["learner_email"],
            "tutor_id": b["tutor_id"],
            "session_date": b["session_date"],
            "session_time": b["session_time"],
            "duration": b["duration"],
            "status": b["status"],
            "created_at": b["created_at"],
            "updated_at": b["updated_at"]
        }
        for b in bookings
    ]
    return jsonify(booking_list)


# GET BOOKINGS FOR A LEARNER
@app.route('/api/bookings/learner/<int:learner_id>', methods=['GET'])
def get_learner_bookings(learner_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.*, t.first_name as tutor_first_name, t.last_name as tutor_last_name, t.modules, t.hourly_rate
        FROM bookings b
        JOIN tutors t ON b.tutor_id = t.tutor_id
        WHERE b.learner_id = ?
        ORDER BY b.session_date DESC, b.session_time DESC
    """, (learner_id,))
    bookings = cursor.fetchall()
    conn.close()

    booking_list = [
        {
            "booking_id": b["booking_id"],
            "learner_id": b["learner_id"],
            "tutor_id": b["tutor_id"],
            "tutor_name": f"{b['tutor_first_name']} {b['tutor_last_name']}",
            "tutor_modules": b["modules"],
            "tutor_hourly_rate": b["hourly_rate"],
            "session_date": b["session_date"],
            "session_time": b["session_time"],
            "duration": b["duration"],
            "status": b["status"],
            "created_at": b["created_at"],
            "updated_at": b["updated_at"]
        }
        for b in bookings
    ]
    return jsonify(booking_list)


# CANCEL A BOOKING
@app.route('/api/bookings/<int:booking_id>/cancel', methods=['PUT'])
def cancel_booking(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE booking_id = ?", (datetime.now(), booking_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Booking cancelled successfully!"}), 200


# RESCHEDULE A BOOKING
@app.route('/api/bookings/<int:booking_id>/reschedule', methods=['PUT'])
def reschedule_booking(booking_id):
    data = request.get_json()
    new_date = data.get('session_date')
    new_time = data.get('session_time')

    if not all([new_date, new_time]):
        return jsonify({"error": "Missing required fields: session_date and session_time"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE bookings 
        SET session_date = ?, session_time = ?, updated_at = ?, status = 'rescheduled'
        WHERE booking_id = ?
    """, (new_date, new_time, datetime.now(), booking_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Booking rescheduled successfully!"}), 200


# RUN LOCALLY PORT 5000
 

if __name__ == '__main__':
    app.run(debug=True, port=5000)
