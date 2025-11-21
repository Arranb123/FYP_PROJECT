#studyhive backend iteration 1
#flask+sqlite
#author : Arran Bearman

#Imports and flask setup
from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS  #import and flask setup   # https://flask-cors.readthedocs.io/en/latest/
# Iteration 2 additions
from datetime import datetime
from pathlib import Path

# Iteration 2 - Database path handling for corruption recovery
# Get the directory where this Python file is located
# This helps find the database file no matter where the script is run from
BASE_DIR = Path(__file__).resolve().parent
# The name of the database file
DB_FILENAME = "fyp_tutoring.db"
# The full path to the database file (combines the directory and filename)
DB_PATH = BASE_DIR / DB_FILENAME

app = Flask(__name__)
CORS(app)

# DATABASE CONNECTION HELPER
#references
#https://www.w3schools.com/python/ref_module_sqlite3.asp#:~:text=Definition%20and%20Usage,needing%20a%20separate%20database%20server.
#every time i run an sql query it calls this function
def get_db_connection():
    # Iteration 2 - Use DB_PATH instead of hardcoded filename
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row  ##this line from gpt - lets you access database results as dictionaries instead of tuples — easier for JSON formatting.
    return conn


# Iteration 2 - Database corruption recovery function - https://chatgpt.com/share/691cdc1c-f098-8008-a3a9-72ed9ea757bb
# I used chatgpt to help me understand how to backup the database and how to handle errors
def backup_corrupt_database():
    """
    This function backs up a corrupted database file before recreating it.
    It renames the corrupted file with a timestamp so I don't lose it completely.
    """
    # Check if the database file actually exists
    if not DB_PATH.exists():
        # If it doesn't exist, there's nothing to backup, so return None
        return None

    # Create a timestamp string in the format YYYYMMDD_HHMMSS (e.g., 20241111_143052)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    # Create a new filename with the timestamp (e.g., fyp_tutoring.corrupt_20241111_143052.db)
    backup_name = f"{DB_PATH.stem}.corrupt_{timestamp}{DB_PATH.suffix}"
    # Create the full path for the backup file (same directory, different name)
    backup_path = DB_PATH.with_name(backup_name)

    try:
        # Rename/move the corrupted file to the backup location
        DB_PATH.replace(backup_path)
        # Print a message telling the user where the backup was saved
        print(f"Corrupted database backed up to '{backup_path.name}'")
        # Return the backup path in case I need it later
        return backup_path
    except OSError as err:
        # If I can't create the backup (maybe file is locked), print an error
        print(f"Failed to back up corrupted database: {err}")
        # Return None to indicate the backup failed
        return None

###################
###################
# START OF ITERATION 1 CODE
###################
###################

# Iteration 2 - Enhanced database initialization with corruption recovery - https://chatgpt.com/share/691cdc1c-f098-8008-a3a9-72ed9ea757bb 
#code below is majorily my own 
#structure and query sntax +
## All of routes were pulled and incorporated from my IS3312 project Phase1 and phase 2
#IS2208 and IS2209 , Simon woodworth
# from line 34 to 250~

def init_database(retry_on_corruption=True):
    """
    This function sets up the database by creating all the tables needed.
    It's called when the server starts to make sure the database structure exists.
    
    retry_on_corruption: If True and the database is corrupted, try to fix it automatically
    """
    # Start with no connection (conn = None)
    conn = None
    try:
        # Get a connection to the database
        conn = get_db_connection()
        # Create a cursor - this is what I use to execute SQL commands
        cursor = conn.cursor()
        
        # Create the students table if it doesn't already exist
        # This table stores information about students/learners who use the platform
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Auto-incrementing unique ID for each student
            first_name TEXT,                       -- Student's first name
            last_name TEXT,                        -- Student's last name
            college_email TEXT,                    -- Student's email address
            created_at TIMESTAMP,                 -- When this record was created
            updated_at TIMESTAMP                   -- When this record was last updated
        );
        """)
        
        # Try to add created_at column to students table if it doesn't exist
        # This is for databases that were created before I added timestamps
        # SQLite doesn't support DEFAULT CURRENT_TIMESTAMP in ALTER TABLE, so I add without default
        try:
            # Try to add the created_at column
            cursor.execute("ALTER TABLE students ADD COLUMN created_at TIMESTAMP")
            # Save the changes
            conn.commit()
        except sqlite3.OperationalError:
            # If I get an error, it means the column already exists, so I just ignore it
            pass  # Column already exists
        
        # Try to add updated_at column to students table if it doesn't exist
        try:
            # Try to add the updated_at column
            cursor.execute("ALTER TABLE students ADD COLUMN updated_at TIMESTAMP")
            # Save the changes
            conn.commit()
        except sqlite3.OperationalError:
            # If I get an error, it means the column already exists, so I just ignore it
            pass  # Column already exists
        
        # Create the tutors table if it doesn't already exist
        # This table stores information about tutors who offer tutoring services
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tutors (
            tutor_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Auto-incrementing unique ID for each tutor
            first_name TEXT NOT NULL,                    -- Tutor's first name (required)
            last_name TEXT NOT NULL,                     -- Tutor's last name (required)
            college_email TEXT UNIQUE NOT NULL,          -- Tutor's email (must be unique, required)
            modules TEXT NOT NULL,                       -- What subjects/modules the tutor teaches (required)
            hourly_rate REAL NOT NULL,                   -- How much the tutor charges per hour (required)
            rating REAL DEFAULT 0,                        -- Tutor's average rating (starts at 0)
            bio TEXT,                                    -- Optional description about the tutor
            profile_pic TEXT,                            -- Optional path to tutor's profile picture
            verified INTEGER DEFAULT 0,                 -- Whether admin has approved this tutor (0 = no, 1 = yes)
            proof_doc TEXT,                              -- Optional path to proof of qualifications
            created_at TIMESTAMP,                        -- When this record was created
            updated_at TIMESTAMP                          -- When this record was last updated
        );
        """)
        
        # Try to add created_at column to tutors table if it doesn't exist
        try:
            cursor.execute("ALTER TABLE tutors ADD COLUMN created_at TIMESTAMP")
            conn.commit()
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        # Try to add updated_at column to tutors table if it doesn't exist
        try:
            cursor.execute("ALTER TABLE tutors ADD COLUMN updated_at TIMESTAMP")
            conn.commit()
        except sqlite3.OperationalError:
            pass  # Column already exists
        
        # Create the bookings table if it doesn't already exist
        # This table stores information about tutoring sessions that have been booked
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            booking_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Autoincrementing unique ID for each booking
            learner_id INTEGER NOT NULL,                   -- ID of the student who made the booking 
            tutor_id INTEGER NOT NULL,                     -- ID of the tutor for this session 
            session_date DATE NOT NULL,                    -- Date when the session will happen 
            session_time TIME NOT NULL,                    -- Time when the session will happen 
            duration INTEGER NOT NULL DEFAULT 60,          -- How long the session is in minutes (defaults to 60)
            status TEXT NOT NULL DEFAULT 'pending',        -- Status of the booking (pending, confirmed, cancelled
            created_at TIMESTAMP,                          -- When this booking was created (set once when booking is made)
            updated_at TIMESTAMP,                           -- When this booking was last updated changes every time booking is modified cancel, reschedule
            FOREIGN KEY (learner_id) REFERENCES students(id),  -- Links to students table
            FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id)  -- Links to tutors table
        );
        """)
        
        # Save all the changes made to the database
        conn.commit()
        # Close the database connection
        conn.close()
    except sqlite3.DatabaseError as e:
        # If I get a database error (like corruption), handle it here
        print(f"Database error during initialization: {e}")
        # If I'm allowed to retry and the database is corrupted
        if retry_on_corruption:
            print("Attempting automatic recovery...")
            # Try to close the connection if it exists
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass
            # Backup the corrupted database
            backup_corrupt_database()
            print("Recreating a fresh database file...")
            # Try to initialize again, but don't retry if it fails again
            return init_database(retry_on_corruption=False)
        else:
            # If I already tried once or retry is disabled, give up
            print("Recovery attempt failed.")
            # Try to close the connection if it exists
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass
            # Raise the error so the program knows something went wrong
            raise
    except Exception as e:
        # If I get any other unexpected error, print it 
        print(f"Unexpected error during database initialization: {e}")
        raise

# Try to initialize the database when the server starts
try:
    # Call the init_database function to set up all the tables
    init_database()
    # If successful, print a success message
    print("Database initialized successfully")
except sqlite3.DatabaseError as e:
    # If the database is corrupted and couldn't be fixed automatically
    print(f"CRITICAL: Database initialization failed after automatic recovery attempt. Error: {e}")
    print("ACTION REQUIRED: Inspect the backup '*.corrupt_YYYYMMDD_HHMMSS.db' file and restore manually if needed.")
    print("You can delete the corrupted file and restart the server to generate a fresh empty database.")
except Exception as e:
    # If any other error occurs, print it and stop the server
    print(f"Error initializing database: {e}")
    raise


@app.route('/students', methods=['GET'])
def get_students():
    #receive all student records
    conn = get_db_connection()
    students = conn.execute("SELECT * FROM students").fetchall()
    conn.close()
    student_list = [
        {"id": s["id"], "first_name": s["first_name"], "last_name": s["last_name"], "college_email": s["college_email"]} #loops through student records and converts to dict then returns as json
        #and displays
        for s in students
    ]
    return jsonify(student_list)


###https://www.youtube.com/watch?v=KO0FufpqC7c#### - Video used to help create route
@app.route('/students', methods=['POST'])
def add_student():
    #insert a new student into the database
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    college_email = data.get('college_email')

    if not all([first_name, last_name, college_email]):
        return jsonify({"error": "Missing required fields"}), 400 # validates input so incomplete fields cant be used

    conn = get_db_connection()# opens connection to DB
    cursor = conn.cursor()#
    # Iteration 2 - Added created_at and updated_at timestamps
    # Timestamps track when student was added and when their info was last changed
    cursor.execute(
        "INSERT INTO students (first_name, last_name, college_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",#runs sql insert command to add a new line to the db
        (first_name, last_name, college_email, datetime.now(), datetime.now()) # this provides the actual values to be inserted - both timestamps set to now when created
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Student added successfully"}), 201


###https://www.youtube.com/watch?v=KO0FufpqC7c#### - Video used to help create route
@app.route('/students/<int:id>', methods=['PUT']) # route for when frontend wants to edit student record. Uses put and includes student id in url
def update_student(id):#defines the function
    #update a students record by id
    data = request.get_json() #extracts data from react in json format to update the db
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    college_email = data.get('college_email')

    conn = get_db_connection() #opens a connection to db
    # Iteration 2 - Added updated_at timestamp and error handling
    # updated_at timestamp shows when student info was last modified - useful for tracking changes
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE students SET first_name=?, last_name=?, college_email=?, updated_at=? WHERE id=?",
        (first_name, last_name, college_email, datetime.now(), id)#gives the actual values to update it - updated_at set to current time
    )
    # Iteration 2 - Check if student exists
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Student not found"}), 404
    conn.commit()#saves changes to db
    conn.close()#closes connection to db
    return jsonify({"message": "Student updated successfully"}) # returns a json confirmation to frontend and shows a success message


###https://www.youtube.com/watch?v=KO0FufpqC7c#### - Video used to help create route
@app.route('/students/<int:id>', methods=['DELETE'])
def delete_student(id):
    #delete a student by id
    conn = get_db_connection()
    # Iteration 2 - Added error handling
    cursor = conn.cursor()
    cursor.execute("DELETE FROM students WHERE id=?", (id,))
    # Iteration 2 - Check if student exists
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Student not found"}), 404
    conn.commit()
    conn.close()
    return jsonify({"message": "Student deleted successfully"})


#   TUTOR ROUTES  

# Iteration 2 - Tutor table creation moved to init_database() function
# Creates a tutor table (only needed once) if one is not present
# (Now handled in init_database function above)

# ADD A NEW TUTOR- unverfied by default 
###https://www.youtube.com/watch?v=KO0FufpqC7c#### - Video used to help create route
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
    #validate required fields
    if not all([first_name, last_name, college_email, modules, hourly_rate]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        #insert tutor into database
        # Iteration 2 - Added created_at and updated_at timestamps
        # Timestamps track when tutor signed up and when their info was last changed
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
        #handles duplicate email constraint
        return jsonify({"error": "Email already exists"}), 400


# GET VERIFIED TUTORS (for learners serch)
###https://www.youtube.com/watch?v=KO0FufpqC7c#### - Video used to help create route
@app.route('/api/tutors', methods=['GET'])
def get_tutor_list():
    #returns verifed tutors when searched for module
    module_query = request.args.get("module", "").strip() ##looks for query eg if frontend sends is3319 , this will store that
    conn = get_db_connection()#db conn
    cursor = conn.cursor()

    #if module is specified , filter by module name
    if module_query:
        cursor.execute("SELECT * FROM tutors WHERE verified = 1 AND modules LIKE ?", ('%' + module_query + '%',))  #query logic 
    else:
        cursor.execute("SELECT * FROM tutors WHERE verified = 1")

    tutors = cursor.fetchall()  #fetches 
    conn.close()  #closes connection

    #format sql results into list of dictionaries
    tutor_list = [  ##this formats the sql results to a list of dictionaries so can be sent as json to frontend
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
    return jsonify(tutor_list) #returns json result to  frontend display


# GET UNVERIFIED TUTORS (for Admin page)
###https://www.youtube.com/watch?v=KO0FufpqC7c#### - Video used to help create route
@app.route('/api/tutors/unverified', methods=['GET'])
def get_unverified_tutors():
    #shows unverified tutors on admin dashboard
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
###https://www.youtube.com/watch?v=KO0FufpqC7c#### - Video used to help create route
@app.route('/api/tutors/<int:tutor_id>/verify', methods=['PUT'])
def approve_tutor(tutor_id):
    #approves a tutor by setting vefified = 1
    conn = get_db_connection()#db connection
    cursor = conn.cursor()
    # Iteration 2 - Added updated_at timestamp and error handling
    # updated_at timestamp tracks when tutor was approved - useful for admin to see when verification happened
    cursor.execute("UPDATE tutors SET verified = 1, updated_at = ? WHERE tutor_id = ?", (datetime.now(), tutor_id))#sql query to change id to 1
    # Iteration 2 - Check if tutor exists
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Tutor not found"}), 404
    conn.commit()#save  
    conn.close()#change
    return jsonify({"message": "Tutor approved successfully!"}), 200


# REJECT TUTOR (delete record)
###https://www.youtube.com/watch?v=KO0FufpqC7c#### - Video used to help create route
@app.route('/api/tutors/<int:tutor_id>', methods=['DELETE'])
def reject_tutor(tutor_id):
    #rejects a tutor and deleted them from db
    conn = get_db_connection()#db conn
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tutors WHERE tutor_id = ?", (tutor_id,))##deletes record from db
    # Iteration 2 - Check if tutor exists
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"error": "Tutor not found"}), 404
    conn.commit()
    conn.close()
    return jsonify({"message": "Tutor rejected and deleted."}), 200

###################
###################
#End of Iteration 1 code
###################
###################

# Iteration 2 - BOOKING ROUTES
# 

# This route handles POST requests to /api/bookings
# Creates a new booking when learner books a session
@app.route('/api/bookings', methods=['POST'])
def create_booking():
    """
    Creates a new booking in the database.
    Links a learner with a tutor for a specific date and time.
    """
    # Get booking data from request
    data = request.get_json()
    learner_id = data.get('learner_id')
    tutor_id = data.get('tutor_id')
    session_date = data.get('session_date')
    session_time = data.get('session_time')
    duration = data.get('duration', 60)

    # Check all required fields are provided
    if not all([learner_id, tutor_id, session_date, session_time]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Get current timestamp - used to track when booking was created and last updated
        now = datetime.now()
        # Insert booking into database with status 'pending'
        # Timestamps: created_at and updated_at both set to now when booking is first created
        # This lets me track when bookings were made and when they were last changed
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


# Gets all bookings for a specific tutor
@app.route('/api/bookings/tutor/<int:tutor_id>', methods=['GET'])
def get_tutor_bookings(tutor_id):
    """
    Gets all bookings for a tutor.
    Includes learner names and emails using SQL JOIN.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    # Join bookings with students table to get learner info
    cursor.execute("""
        SELECT b.*, s.first_name as learner_first_name, s.last_name as learner_last_name, s.college_email as learner_email
        FROM bookings b
        JOIN students s ON b.learner_id = s.id
        WHERE b.tutor_id = ?
        ORDER BY b.session_date DESC, b.session_time DESC
    """, (tutor_id,))
    bookings = cursor.fetchall()
    conn.close()

    # Convert to list of dictionaries
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


# Gets all bookings for a specific learner
@app.route('/api/bookings/learner/<int:learner_id>', methods=['GET'])
def get_learner_bookings(learner_id):
    """
    Gets all bookings for a learner.
    Includes tutor names, modules, and rates using SQL JOIN.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    # Join bookings with tutors table to get tutor info
    cursor.execute("""
        SELECT b.*, t.first_name as tutor_first_name, t.last_name as tutor_last_name, t.modules, t.hourly_rate
        FROM bookings b
        JOIN tutors t ON b.tutor_id = t.tutor_id
        WHERE b.learner_id = ?
        ORDER BY b.session_date DESC, b.session_time DESC
    """, (learner_id,))
    bookings = cursor.fetchall()
    conn.close()

    # Convert to list of dictionaries
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


# Cancels a booking by changing status to 'cancelled'
@app.route('/api/bookings/<int:booking_id>/cancel', methods=['PUT'])
def cancel_booking(booking_id):
    """
    Cancels a booking by changing status to 'cancelled'.
    Booking stays in database but shows as cancelled.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Update status to cancelled and update timestamp
        # updated_at timestamp shows when the booking was cancelled - useful for tracking user activity
        cursor.execute("UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE booking_id = ?", (datetime.now(), booking_id))
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Booking not found"}), 404
        conn.commit()
        conn.close()
        return jsonify({"message": "Booking cancelled successfully!"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500


# Reschedules a booking by updating date and time
@app.route('/api/bookings/<int:booking_id>/reschedule', methods=['PUT'])
def reschedule_booking(booking_id):
    """
    Updates booking date and time.
    Changes status to 'rescheduled'.
    """
    # Get new date and time from request
    data = request.get_json()
    new_date = data.get('session_date', '').strip()
    new_time = data.get('session_time', '').strip()

    # Check both fields provided
    if not all([new_date, new_time]):
        return jsonify({"error": "Missing required fields: session_date and session_time"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Update booking with new date, time, and status
        # updated_at timestamp shows when the booking was rescheduled - helps track when changes were made
        cursor.execute("""
            UPDATE bookings 
            SET session_date = ?, session_time = ?, updated_at = ?, status = 'rescheduled'
            WHERE booking_id = ?
        """, (new_date, new_time, datetime.now(), booking_id))
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Booking not found"}), 404
        conn.commit()
        conn.close()
        return jsonify({"message": "Booking rescheduled successfully!"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500


# RUN LOCALLY PORT 5000
#app entry point
if __name__ == '__main__':
    app.run(debug=True, port=5000)
