#studyhive backend iteration 1..
##hh
#flask+sqlite
#author : Arran Bearman

#Imports and flask setup
from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS  #import and flask setup   # https://flask-cors.readthedocs.io/en/latest/
# Iteration 2 additions
from datetime import datetime, timedelta
from pathlib import Path
import os

# Iteration 2 - Database path handling for corruption recovery
# Get the directory where this Python file is located
# This helps find the database file no matter where the script is run from
BASE_DIR = Path(__file__).resolve().parent
# The name of the database file
DB_FILENAME = "fyp_tutoring.db"
# The full path to the database file (combines the directory and filename)
DB_PATH = BASE_DIR / DB_FILENAME

# Story 15 - Uploads directory for proof documents
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)  # Create uploads directory if it doesn't exist

app = Flask(__name__)
# Enhanced CORS configuration to handle all requests properly
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"]
    }
})
# Story 15 -  max file size to 10MB
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max file size

# DATABASE CONNECTION HELPER
#references
#https://www.w3schools.com/python/ref_module_sqlite3.asp#:~:text=Definition%20and%20Usage,needing%20a%20separate%20database%20server.
#every time i run an sql query it calls this function
def get_db_connection():
    # Iteration 2 - Use DB_PATH instead of hardcoded filename
    # Iteration 3 - Add timeout to prevent database locking issues
    conn = sqlite3.connect(str(DB_PATH), timeout=10.0)
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
            proof_doc BLOB,                              -- Optional proof of qualifications (stored as binary data)
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
        
        # Iteration 3 - Create reviews table if it doesn't exist
        # This table stores ratings and reviews that learners leave after sessions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            review_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Autoincrementing unique ID for each review
            booking_id INTEGER NOT NULL,                   -- ID of the booking this review is for
            learner_id INTEGER NOT NULL,                   -- ID of the learner who wrote the review
            tutor_id INTEGER NOT NULL,                     -- ID of the tutor being reviewed
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),  -- Rating from 1 to 5 stars
            comment TEXT,                                  -- Optional text comment from the learner
            created_at TIMESTAMP,                          -- When this review was created
            FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),  -- Links to bookings table
            FOREIGN KEY (learner_id) REFERENCES students(id),  -- Links to students table
            FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id)  -- Links to tutors table
        );
        """)
        
        # Iteration 3 - Create users table if it doesn't exist
        # This table stores user authentication information (login credentials)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Autoincrementing unique ID for each user
            email TEXT UNIQUE NOT NULL,                 -- User's email (used for login, must be unique)
            password TEXT NOT NULL,                     -- Hashed password for authentication
            role TEXT NOT NULL DEFAULT 'learner',       -- User role: 'learner', 'tutor', or 'admin'
            student_id INTEGER,                          -- Links to students table if role is learner
            tutor_id INTEGER,                           -- Links to tutors table if role is tutor
            created_at TIMESTAMP,                        -- When this user account was created
            updated_at TIMESTAMP,                        -- When this user account was last updated
            FOREIGN KEY (student_id) REFERENCES students(id),  -- Links to students table
            FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id)  -- Links to tutors table
        );
        """)
        # End Iteration 3 - Database tables created
        
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

# Story 15 - File upload for proof documents
# file references: https://flask.palletsprojects.com/en/3.0.x/api/#flask.Request.files (lines 377-423)
# file references: https://docs.python.org/3/library/base64.html (lines 377-423)
@app.route('/api/tutors/upload-proof', methods=['POST', 'OPTIONS'])
def upload_proof_document():
    """
    Handles file upload for tutor proof documents.
    Returns file data as base64 for storage in database.
    """
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Check file extension (allow PDF, images, etc.)
    allowed_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.gif', '.doc', '.docx'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        return jsonify({"error": f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"}), 400
    
    # Read file into memory
    try:
        file_data = file.read()
        file_size = len(file_data)
        
        # Check file size (10MB limit)
        if file_size > 10 * 1024 * 1024:
            return jsonify({"error": "File size exceeds 10MB limit"}), 400
        
        # Store file data as base64 for JSON response (or return success with size info)
        import base64
        file_base64 = base64.b64encode(file_data).decode('utf-8')
        
        return jsonify({
            "file_data": file_base64,
            "file_size": file_size,
            "file_ext": file_ext,
            "message": "File ready to be stored in database"
        }), 200
    except Exception as e:
        print(f"Error reading file: {e}")
        return jsonify({"error": f"Failed to read file: {str(e)}"}), 500
# End Story 15 - File upload endpoint

# ADD A NEW TUTOR- unverfied by default 
###https://www.youtube.com/watch?v=KO0FufpqC7c#### - Video used to help create route
@app.route('/api/tutors', methods=['POST', 'OPTIONS'])
def add_tutor():
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided. Please ensure Content-Type is application/json"}), 400
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    college_email = data.get('college_email')
    modules = data.get('modules')
    hourly_rate = data.get('hourly_rate')
    rating = data.get('rating', 0)
    bio = data.get('bio', '')
    profile_pic = data.get('profile_pic', '')
    verified = data.get('verified', 0)
    
    # Story 15 - Store file as BLOB in database
    # proof_doc is base64 encoded string that gets decoded to binary for storage
    # file reference: https://docs.python.org/3/library/base64.html (lines 446-455)
    proof_doc_base64 = data.get('proof_doc', '')
    proof_doc_binary = None
    if proof_doc_base64:
        try:
            import base64
            proof_doc_binary = base64.b64decode(proof_doc_base64)
        except Exception as e:
            return jsonify({"error": "Invalid proof document format. Must be base64 encoded."}), 400
    #validate required fields
    if not all([first_name, last_name, college_email, modules, hourly_rate]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = None
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
        """, (first_name, last_name, college_email, modules, hourly_rate, rating, bio, profile_pic, verified, proof_doc_binary, now, now))
        conn.commit()
        new_id = cursor.lastrowid
        
        # Story 11 - If user account exists with this email and role is tutor, link them
        # Use case-insensitive email matching
        cursor.execute("SELECT user_id, email FROM users WHERE LOWER(email) = LOWER(?) AND role = 'tutor'", (college_email,))
        user_record = cursor.fetchone()
        if user_record:
            # Link the tutor record to the user account
            now = datetime.now()
            cursor.execute("""
                UPDATE users SET tutor_id = ?, updated_at = ? WHERE user_id = ?
            """, (new_id, now, user_record["user_id"]))
            conn.commit()
        else:
            # Debug: Check what users exist (only print if not found)
            cursor.execute("SELECT user_id, email, role FROM users WHERE role = 'tutor'")
            all_tutor_users = cursor.fetchall()
        
        return jsonify({
            "message": "Tutor added successfully!", 
            "tutor_id": new_id,
            "linked": user_record is not None
        }), 201
    except sqlite3.IntegrityError as e:
        if conn:
            conn.rollback()
        #handles duplicate email constraint
        return jsonify({"error": "Email already exists"}), 400
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        print(f"[ERROR] Database error: {e}")  # Debug log
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    finally:
        # Always close the connection, even if there's an error
        if conn:
            conn.close()
# End Story 15 - Tutor creation with file upload

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
            "proof_doc": "exists" if t["proof_doc"] else None  # Don't return BLOB in list, just flag
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
            "proof_doc": "exists" if t["proof_doc"] else None  # Don't return BLOB in list, just flag
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

# create booking endpoint
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
    Automatically marks bookings as 'completed' if session time has passed.
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
    
    # Auto-complete bookings where session time has passed
    now = datetime.now()
    for booking in bookings:
        if booking["status"] in ["pending", "confirmed"]:
            # Check if session time has passed
            session_date = booking["session_date"]
            session_time = booking["session_time"]
            
            if session_date and session_time:
                try:
                    # Parse session date and time - handle different formats
                    session_date_str = str(session_date)
                    session_time_str = str(session_time)
                    
                    # Extract date part (remove time if present)
                    if ' ' in session_date_str:
                        date_part = session_date_str.split(' ')[0]
                    else:
                        date_part = session_date_str
                    
                    # Extract time part (handle different formats)
                    if ':' in session_time_str:
                        # Time might be "HH:MM:SS" or "HH:MM"
                        time_parts = session_time_str.split(':')
                        if len(time_parts) >= 2:
                            time_str = f"{time_parts[0].zfill(2)}:{time_parts[1].zfill(2)}:00"
                        else:
                            time_str = session_time_str
                    else:
                        time_str = "00:00:00"
                    
                    # Combine date and time
                    try:
                        session_datetime = datetime.strptime(f"{date_part} {time_str}", "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        # Try alternative format
                        session_datetime = datetime.strptime(f"{date_part} {time_str}", "%Y-%m-%d %H:%M")
                    
                    # Add duration to session end time
                    duration_minutes = booking["duration"] if booking["duration"] is not None else 60
                    session_end = session_datetime + timedelta(minutes=duration_minutes)
                    
                    # If session end time has passed, mark as completed
                    if now > session_end:
                        print(f"[INFO] Auto-completing booking {booking['booking_id']}: session ended at {session_end}, current time {now}")
                        cursor.execute("""
                            UPDATE bookings 
                            SET status = 'completed', updated_at = ? 
                            WHERE booking_id = ? AND status IN ('pending', 'confirmed')
                        """, (now, booking["booking_id"]))
                        conn.commit()
                except Exception as e:
                    print(f"[WARNING] Error auto-completing booking {booking['booking_id']}: {e}")
                    import traceback
                    traceback.print_exc()
    
    # Re-fetch bookings to get updated statuses
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
    Automatically marks bookings as 'completed' if session time has passed.
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
    
    # Auto-complete bookings where session time has passed
    now = datetime.now()
    for booking in bookings:
        if booking["status"] in ["pending", "confirmed"]:
            # Check if session time has passed
            session_date = booking["session_date"]
            session_time = booking["session_time"]
            
            if session_date and session_time:
                try:
                    # Parse session date and time - handle different formats
                    session_date_str = str(session_date)
                    session_time_str = str(session_time)
                    
                    # Extract date part (remove time if present)
                    if ' ' in session_date_str:
                        date_part = session_date_str.split(' ')[0]
                    else:
                        date_part = session_date_str
                    
                    # Extract time part (handle different formats)
                    if ':' in session_time_str:
                        # Time might be "HH:MM:SS" or "HH:MM"
                        time_parts = session_time_str.split(':')
                        if len(time_parts) >= 2:
                            time_str = f"{time_parts[0].zfill(2)}:{time_parts[1].zfill(2)}:00"
                        else:
                            time_str = session_time_str
                    else:
                        time_str = "00:00:00"
                    
                    # Combine date and time
                    try:
                        session_datetime = datetime.strptime(f"{date_part} {time_str}", "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        # Try alternative format
                        session_datetime = datetime.strptime(f"{date_part} {time_str}", "%Y-%m-%d %H:%M")
                    
                    # Add duration to session end time
                    duration_minutes = booking["duration"] if booking["duration"] is not None else 60
                    session_end = session_datetime + timedelta(minutes=duration_minutes)
                    
                    # If session end time has passed, mark as completed
                    if now > session_end:
                        print(f"[INFO] Auto-completing booking {booking['booking_id']}: session ended at {session_end}, current time {now}")
                        cursor.execute("""
                            UPDATE bookings 
                            SET status = 'completed', updated_at = ? 
                            WHERE booking_id = ? AND status IN ('pending', 'confirmed')
                        """, (now, booking["booking_id"]))
                        conn.commit()
                except Exception as e:
                    print(f"[WARNING] Error auto-completing booking {booking['booking_id']}: {e}")
                    import traceback
                    traceback.print_exc()
    
    # Re-fetch bookings to get updated statuses
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


# Story 12 - mark booking as completed
# file references: https://flask.palletsprojects.com/en/3.0.x/quickstart/#routing (lines 883-949)
# file references: https://docs.python.org/3/library/sqlite3.html (lines 883-949)
# file references: https://docs.python.org/3/library/datetime.html (lines 904, 930)
@app.route('/api/bookings/<int:booking_id>/complete', methods=['PUT'])
def complete_booking(booking_id):
    """
    Marks a booking as completed.
    Can be called by either the tutor or learner after the session.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if booking exists
        cursor.execute("SELECT * FROM bookings WHERE booking_id = ?", (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        
        # Update status to completed
        cursor.execute("UPDATE bookings SET status = 'completed', updated_at = ? WHERE booking_id = ?", (datetime.now(), booking_id))
        conn.commit()
        
        return jsonify({"message": "Booking marked as completed", "booking_id": booking_id}), 200
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()
# End Story 12 - Complete booking

# Story 12 - Mark booking as missed
# This route allows tutors or learners to mark a session as missed
@app.route('/api/bookings/<int:booking_id>/missed', methods=['PUT'])
def mark_booking_missed(booking_id):
    """
    Marks a booking as missed (no-show).
    Can be called by either the tutor or learner if someone didn't show up.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if booking exists
        cursor.execute("SELECT * FROM bookings WHERE booking_id = ?", (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        
        # Update status to missed
        cursor.execute("UPDATE bookings SET status = 'missed', updated_at = ? WHERE booking_id = ?", (datetime.now(), booking_id))
        conn.commit()
        
        return jsonify({"message": "Booking marked as missed", "booking_id": booking_id}), 200
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()
# End Story 12 - Mark booking as missed

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


###################
###################
# Iteration 3 - Admin routes for viewing all bookings and reviews
###################
###################
# file references: https://flask.palletsprojects.com/en/3.0.x/quickstart/#routing (lines 1016-1415)
# file references: https://docs.python.org/3/library/sqlite3.html (lines 1019-1145, 1293-1336)
# file references: https://flask.palletsprojects.com/en/3.0.x/api/#flask.json.jsonify (lines 1016-1415)

# Story 9 - admin view all bookings
@app.route('/api/admin/bookings', methods=['GET'])
def get_all_bookings():
    """
    Gets all bookings in the system for admin oversight.
    Includes learner names, tutor names, and booking details.
    Automatically marks bookings as 'completed' if session time has passed.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Join bookings with both students and tutors tables to get all information
        cursor.execute("""
            SELECT b.*, 
                   s.first_name as learner_first_name, s.last_name as learner_last_name, s.college_email as learner_email,
                   t.first_name as tutor_first_name, t.last_name as tutor_last_name, t.modules, t.hourly_rate
            FROM bookings b
            JOIN students s ON b.learner_id = s.id
            JOIN tutors t ON b.tutor_id = t.tutor_id
            ORDER BY b.created_at DESC
        """)
        bookings = cursor.fetchall()
        
        # Auto-complete bookings where session time has passed
        now = datetime.now()
        completed_count = 0
        print(f"[DEBUG] Admin bookings: Checking {len(bookings)} bookings for auto-completion. Current time: {now}")
        for booking in bookings:
            if booking["status"] in ["pending", "confirmed"]:
                # Check if session time has passed
                session_date = booking["session_date"]
                session_time = booking["session_time"]
                
                if session_date and session_time:
                    try:
                        # Parse session date and time - handle different formats
                        session_date_str = str(session_date)
                        session_time_str = str(session_time)
                        
                        # Extract date part (remove time if present)
                        if ' ' in session_date_str:
                            date_part = session_date_str.split(' ')[0]
                        else:
                            date_part = session_date_str
                        
                        # Extract time part (handle different formats)
                        if ':' in session_time_str:
                            # Time might be "HH:MM:SS" or "HH:MM"
                            time_parts = session_time_str.split(':')
                            if len(time_parts) >= 2:
                                time_str = f"{time_parts[0].zfill(2)}:{time_parts[1].zfill(2)}:00"
                            else:
                                time_str = session_time_str
                        else:
                            time_str = "00:00:00"
                        
                        # Combine date and time
                        try:
                            session_datetime = datetime.strptime(f"{date_part} {time_str}", "%Y-%m-%d %H:%M:%S")
                        except ValueError:
                            try:
                                # Try alternative format without seconds
                                session_datetime = datetime.strptime(f"{date_part} {time_str}", "%Y-%m-%d %H:%M")
                            except ValueError:
                                # Try with just date and time parts separately
                                time_obj = datetime.strptime(time_str, "%H:%M:%S").time()
                                session_datetime = datetime.combine(datetime.strptime(date_part, "%Y-%m-%d").date(), time_obj)
                        
                        # Add duration to session end time
                        duration_minutes = booking["duration"] if booking["duration"] is not None else 60
                        session_end = session_datetime + timedelta(minutes=duration_minutes)
                        
                        # Debug: Print booking info for first few bookings
                        
                        # If session end time has passed, mark as completed
                        if now > session_end:
                            print(f"[INFO] Auto-completing booking {booking['booking_id']}: session ended at {session_end}, current time {now}")
                            cursor.execute("""
                                UPDATE bookings 
                                SET status = 'completed', updated_at = ? 
                                WHERE booking_id = ? AND status IN ('pending', 'confirmed')
                            """, (now, booking["booking_id"]))
                            conn.commit()
                            completed_count += 1
                            print(f"[SUCCESS] Booking {booking['booking_id']} marked as completed")
                    except Exception as e:
                        print(f"[WARNING] Error auto-completing booking {booking['booking_id']}: {e}")
                        import traceback
                        traceback.print_exc()
        
        if completed_count > 0:
            print(f"[INFO] Admin bookings: Auto-completed {completed_count} booking(s)")
        # Re-fetch bookings to get updated statuses
        cursor.execute("""
            SELECT b.*, 
                   s.first_name as learner_first_name, s.last_name as learner_last_name, s.college_email as learner_email,
                   t.first_name as tutor_first_name, t.last_name as tutor_last_name, t.modules, t.hourly_rate
            FROM bookings b
            JOIN students s ON b.learner_id = s.id
            JOIN tutors t ON b.tutor_id = t.tutor_id
            ORDER BY b.created_at DESC
        """)
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
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
# End Story 9 - Admin view all bookings

# Story 12 - Create review endpoint
# Story 12 - create review
# file references: https://flask.palletsprojects.com/en/3.0.x/quickstart/#routing (lines 1147-1291)
# file references: https://docs.python.org/3/library/sqlite3.html (lines 1147-1291)
# file references: https://docs.python.org/3/library/datetime.html (lines 1200-1205)
@app.route('/api/reviews', methods=['POST'])
def create_review():
    """
    Creates a new review for a completed booking.
    Requires booking_id, learner_id, tutor_id, rating (1-5), and optional comment.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    booking_id = data.get('booking_id')
    learner_id = data.get('learner_id')
    tutor_id = data.get('tutor_id')
    rating = data.get('rating')
    comment = data.get('comment', '')
    
    # Validate required fields
    if not all([booking_id, learner_id, tutor_id, rating]):
        return jsonify({"error": "Missing required fields: booking_id, learner_id, tutor_id, and rating"}), 400
    
    # Validate rating is between 1 and 5
    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            return jsonify({"error": "Rating must be between 1 and 5"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Rating must be a number between 1 and 5"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if booking exists and belongs to this learner
        cursor.execute("SELECT * FROM bookings WHERE booking_id = ? AND learner_id = ?", (booking_id, learner_id))
        booking = cursor.fetchone()
        if not booking:
            return jsonify({"error": "Booking not found or does not belong to this learner"}), 404
        
        # Check if a review already exists for this booking
        cursor.execute("SELECT review_id FROM reviews WHERE booking_id = ?", (booking_id,))
        existing_review = cursor.fetchone()
        if existing_review:
            return jsonify({"error": "A review already exists for this booking"}), 400
        
        # Check if booking is in the past (can only review completed sessions)
        # Check both date and time to ensure the session has actually passed
        from datetime import datetime, date
        try:
            booking_date_str = booking["session_date"]
            
            try:
                booking_time_str = booking["session_time"]
            except (KeyError, IndexError):
                booking_time_str = "00:00"
            
            # Parse the date
            booking_date = datetime.strptime(booking_date_str, "%Y-%m-%d").date()
            
            # Parse the time (handle different formats)
            if isinstance(booking_time_str, str) and booking_time_str:
                # Remove seconds if present (e.g., "14:30:00" -> "14:30")
                if len(booking_time_str) > 5:
                    booking_time_str = booking_time_str[:5]
                # Combine date and time to create a full datetime
                booking_datetime = datetime.strptime(f"{booking_date_str} {booking_time_str}", "%Y-%m-%d %H:%M")
            else:
                # If time is not a string, just check the date
                booking_datetime = datetime.combine(booking_date, datetime.min.time())
            
            now = datetime.now()
            if booking_datetime > now:
                return jsonify({"error": "You can only review sessions that have already taken place"}), 400
        except (ValueError, KeyError) as e:
            # If datetime parsing fails, log error but allow review (fallback to date-only check)
            print(f"Warning: Could not parse booking datetime: {e}")
            booking_date = datetime.strptime(booking["session_date"], "%Y-%m-%d").date()
            today = date.today()
            if booking_date > today:
                return jsonify({"error": "You can only review sessions that have already taken place"}), 400
        
        # Insert the review into the database
        now = datetime.now()
        cursor.execute("""
            INSERT INTO reviews (booking_id, learner_id, tutor_id, rating, comment, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (booking_id, learner_id, tutor_id, rating, comment, now))
        
        # Commit the transaction to save the review to the database
        conn.commit()
        review_id = cursor.lastrowid
        
        
        return jsonify({
            "message": "Review submitted successfully",
            "review_id": review_id
        }), 201
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        if conn:
            conn.rollback()
        import traceback
        traceback.print_exc()  # Print full traceback for debugging
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()
# End Story 12 - Create review

# Story 12 - check if booking has review
# file references: https://flask.palletsprojects.com/en/3.0.x/quickstart/#routing (lines 1275-1291)
# file references: https://docs.python.org/3/library/sqlite3.html (lines 1275-1291)
@app.route('/api/reviews/booking/<int:booking_id>', methods=['GET'])
def get_review_for_booking(booking_id):
    """
    Gets the review for a specific booking, if it exists.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM reviews WHERE booking_id = ?", (booking_id,))
        review = cursor.fetchone()
        
        if not review:
            return jsonify({"exists": False}), 200
        
        return jsonify({
            "exists": True,
            "review_id": review["review_id"],
            "rating": review["rating"],
            "comment": review["comment"],
            "created_at": review["created_at"]
        }), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()
# End Story 12 - Check review

# Story 9 - admin view all reviews
@app.route('/api/admin/reviews', methods=['GET'])
def get_all_reviews():
    """
    Gets all reviews in the system for admin oversight.
    Includes learner names, tutor names, ratings, and comments.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Join reviews with bookings, students, and tutors tables to get all information
        cursor.execute("""
            SELECT r.*, 
                   s.first_name as learner_first_name, s.last_name as learner_last_name,
                   t.first_name as tutor_first_name, t.last_name as tutor_last_name, t.modules
            FROM reviews r
            JOIN students s ON r.learner_id = s.id
            JOIN tutors t ON r.tutor_id = t.tutor_id
            ORDER BY r.created_at DESC
        """)
        reviews = cursor.fetchall()
        conn.close()

        # Convert to list of dictionaries
        review_list = [
            {
                "review_id": r["review_id"],
                "booking_id": r["booking_id"],
                "learner_id": r["learner_id"],
                "learner_name": f"{r['learner_first_name']} {r['learner_last_name']}",
                "tutor_id": r["tutor_id"],
                "tutor_name": f"{r['tutor_first_name']} {r['tutor_last_name']}",
                "tutor_modules": r["modules"],
                "rating": r["rating"],
                "comment": r["comment"],
                "created_at": r["created_at"]
            }
            for r in reviews
        ]
        return jsonify(review_list)
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
# End Story 9 - Admin reviews

# Story 15 - Serve proof documents from database
# file references: https://flask.palletsprojects.com/en/3.0.x/api/#flask.Response (lines 1338-1411)
# file references: https://docs.python.org/3/library/sqlite3.html (lines 1346-1352)
# file references: https://docs.python.org/3/library/base64.html (lines 1363-1393)
@app.route('/api/tutors/<int:tutor_id>/proof-doc', methods=['GET'])
def serve_proof_document(tutor_id):
    """
    Serves proof documents from database to admins for viewing/downloading.
    Files are stored as BLOB in the database.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get proof_doc BLOB from database
        cursor.execute("SELECT proof_doc FROM tutors WHERE tutor_id = ?", (tutor_id,))
        tutor = cursor.fetchone()
        conn.close()
        
        if not tutor:
            return jsonify({"error": "Tutor not found"}), 404
        
        if not tutor["proof_doc"]:
            return jsonify({"error": "Proof document not found"}), 404
        
        # Get file data from database
        proof_doc = tutor["proof_doc"]
        
        # Handle BLOB (bytes) format - files are stored as binary data
        if isinstance(proof_doc, bytes):
            file_data = proof_doc
        elif isinstance(proof_doc, str):
            # If stored as filename string, try to read from filesystem
            try:
                file_path = UPLOADS_DIR / proof_doc
                if file_path.exists():
                    with open(file_path, 'rb') as f:
                        file_data = f.read()
                else:
                    return jsonify({"error": "Proof document file not found"}), 404
            except Exception as e:
                return jsonify({"error": f"Error reading file: {str(e)}"}), 500
        else:
            return jsonify({"error": "Invalid proof document format"}), 500
        
        # Determine content type based on file signature (first few bytes)
        content_type = "application/octet-stream"
        if len(file_data) >= 4:
            if file_data[:4] == b'\x89PNG':
                content_type = "image/png"
            elif file_data[:4] == b'%PDF':
                content_type = "application/pdf"
            elif file_data[:2] == b'\xff\xd8':
                content_type = "image/jpeg"
            elif file_data[:4] == b'GIF8':
                content_type = "image/gif"
            elif file_data[:2] == b'PK' and file_data[2:4] in [b'\x03\x04', b'\x05\x06']:
                # ZIP file (could be .docx)
                content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        
        
        from flask import Response, make_response
        # Set headers to allow embedding and proper content display
        # Content-Disposition: inline allows the file to be displayed in browser
        response = make_response(file_data)
        response.headers['Content-Type'] = content_type
        response.headers['Content-Disposition'] = 'inline'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        # Add CORS headers explicitly for cross-origin requests
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET'
        return response
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Error serving file: {str(e)}"}), 500
# End Story 15 - Serve proof documents

###################
###################
# End Iteration 3 - Admin routes
###################
###################

###################
###################
# Iteration 3 - Tutor profile edit routes
###################
###################
# file references: https://flask.palletsprojects.com/en/3.0.x/quickstart/#routing (lines 1425-1523)
# file references: https://docs.python.org/3/library/sqlite3.html (lines 1425-1523)
# file references: https://flask.palletsprojects.com/en/3.0.x/api/#flask.json.jsonify (lines 1425-1523)

# Story 10 - get tutor by ID for editing
@app.route('/api/tutors/<int:tutor_id>', methods=['GET'])
def get_tutor_by_id(tutor_id):
    """
    Gets a specific tutor's information by ID.
    Returns tutor data regardless of verification status (so tutors can edit their own profile).
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get tutor by ID (no verification filter - tutors can edit their own profile)
        cursor.execute("SELECT * FROM tutors WHERE tutor_id = ?", (tutor_id,))
        tutor = cursor.fetchone()
        
        if not tutor:
            return jsonify({"error": "Tutor not found"}), 404
        
        # Format tutor data as dictionary
        tutor_data = {
            "tutor_id": tutor["tutor_id"],
            "first_name": tutor["first_name"],
            "last_name": tutor["last_name"],
            "college_email": tutor["college_email"],
            "modules": tutor["modules"],
            "hourly_rate": tutor["hourly_rate"],
            "rating": tutor["rating"],
            "bio": tutor["bio"],
            "profile_pic": tutor["profile_pic"],
            "verified": tutor["verified"],
            "proof_doc": "exists" if tutor["proof_doc"] else None,  # Don't return BLOB, just flag
            "created_at": tutor["created_at"],
            "updated_at": tutor["updated_at"]
        }
        
        return jsonify(tutor_data), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()
# End Story 10 - Get tutor by ID

# Story 10 - Update tutor profile endpoint
# Story 10 - update tutor profile
@app.route('/api/tutors/<int:tutor_id>', methods=['PUT'])
def update_tutor_profile(tutor_id):
    """
    Updates a tutor's profile information.
    Allows updating modules, hourly_rate, bio, and other details.
    """
    data = request.get_json()
    
    # Get the fields that can be updated
    modules = data.get('modules')
    hourly_rate = data.get('hourly_rate')
    bio = data.get('bio', '')
    
    # Validate required fields
    if not modules or hourly_rate is None:
        return jsonify({"error": "Missing required fields: modules and hourly_rate"}), 400
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Update tutor information with new timestamp
        cursor.execute("""
            UPDATE tutors 
            SET modules = ?, hourly_rate = ?, bio = ?, updated_at = ?
            WHERE tutor_id = ?
        """, (modules, hourly_rate, bio, datetime.now(), tutor_id))
        
        # Check if tutor exists
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Tutor not found"}), 404
        
        conn.commit()
        conn.close()
        return jsonify({"message": "Tutor profile updated successfully!"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
# End Story 10 - Update tutor profile

###################
###################
# End Iteration 3 - Tutor profile edit routes
###################
###################

###################
###################
# Iteration 3 - Authentication routes
###################
###################
# file references: https://flask.palletsprojects.com/en/3.0.x/quickstart/#routing (lines 1525-1721)
# file references: https://docs.python.org/3/library/sqlite3.html (lines 1525-1721)
# file references: https://docs.python.org/3/library/hashlib.html (lines 1570-1572)
# file references: https://docs.python.org/3/library/datetime.html (lines 1574-1578, 1656-1672)

# Story 11 - User registration endpoint
# Story 11 - user registration
@app.route('/api/auth/register', methods=['POST'])
def register_user():
    """
    Registers a new user account.
    Creates a user record with email, password (hashed), and role.
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'learner')  # Default to learner if not specified
    student_id = data.get('student_id')  # Optional: link to student record
    tutor_id = data.get('tutor_id')  # Optional: link to tutor record
    
    # Validate required fields
    if not email or not password:
        return jsonify({"error": "Missing required fields: email and password"}), 400
    
    # Basic password validation (minimum 6 characters)
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Simple password hashing (in production, use bcrypt or similar)
        # For now, we'll store a basic hash (this is NOT secure for production!)
        # In a real system, use: import bcrypt; hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Story 11 - If registering as learner and no student_id provided, create a student record
        created_student_id = student_id
        if role == 'learner' and not student_id:
            # Extract name from email (before @) for initial student record
            email_name = email.split('@')[0]
            # Create a student record for this learner
            now = datetime.now()
            cursor.execute("""
                INSERT INTO students (first_name, last_name, college_email, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, (email_name, "", email, now, now))
            created_student_id = cursor.lastrowid
        
        # Story 11 - Note: Tutors need to complete tutor signup separately to get tutor_id
        # We don't auto-create tutor records here because tutors need to provide modules, rates, etc.
        
        # Insert new user
        now = datetime.now()
        cursor.execute("""
            INSERT INTO users (email, password, role, student_id, tutor_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (email, password_hash, role, created_student_id, tutor_id, now, now))
        
        conn.commit()
        new_id = cursor.lastrowid
        
        return jsonify({
            "message": "User registered successfully!",
            "user_id": new_id,
            "email": email,
            "role": role,
            "student_id": created_student_id
        }), 201
    except sqlite3.IntegrityError:
        if conn:
            conn.rollback()
        return jsonify({"error": "Email already exists"}), 400
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        # Always close the connection, even if there's an error
        if conn:
            conn.close()


# Story 11 - user login
# file references: https://flask.palletsprojects.com/en/3.0.x/quickstart/#routing (lines 1628-1721)
# file references: https://docs.python.org/3/library/sqlite3.html (lines 1628-1721)
# file references: https://docs.python.org/3/library/hashlib.html (lines 1635-1637)
@app.route('/api/auth/login', methods=['POST'])
def login_user():
    """
    Authenticates a user with email and password.
    Returns user information if credentials are correct.
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # Validate required fields
    if not email or not password:
        return jsonify({"error": "Missing required fields: email and password"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find user by email (case-insensitive)
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Verify password (simple hash comparison - NOT secure for production!)
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        if user["password"] != password_hash:
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Story 11 - If learner doesn't have student_id, create one automatically
        student_id = user["student_id"]
        if user["role"] == 'learner' and not student_id:
            # Create a student record for this learner
            email_name = user["email"].split('@')[0]
            now = datetime.now()
            cursor.execute("""
                INSERT INTO students (first_name, last_name, college_email, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
            """, (email_name, "", user["email"], now, now))
            student_id = cursor.lastrowid
            # Update user record with student_id
            cursor.execute("""
                UPDATE users SET student_id = ?, updated_at = ? WHERE user_id = ?
            """, (student_id, now, user["user_id"]))
            conn.commit()
        
        # Story 11 - Check if tutor needs to be linked to a tutor record
        # If user registered as tutor but hasn't completed tutor signup, try to find their tutor record by email
        tutor_id = user["tutor_id"]
        if user["role"] == 'tutor' and not tutor_id:
            # Try to find a tutor record with matching email (case-insensitive)
            cursor.execute("SELECT tutor_id, college_email FROM tutors WHERE LOWER(college_email) = LOWER(?)", (user["email"],))
            tutor_record = cursor.fetchone()
            if tutor_record:
                tutor_id = tutor_record["tutor_id"]
                # Update user record with tutor_id
                now = datetime.now()
                cursor.execute("""
                    UPDATE users SET tutor_id = ?, updated_at = ? WHERE user_id = ?
                """, (tutor_id, now, user["user_id"]))
                conn.commit()
                print(f"[SUCCESS] Auto-linked tutor record {tutor_id} to user {user['user_id']} on login (email: {user['email']})")  # Debug log
            else:
                # Debug: Show what tutor records exist
                cursor.execute("SELECT tutor_id, college_email FROM tutors")
                all_tutors = cursor.fetchall()
        
        # Refresh user data from database to get latest tutor_id/student_id after any updates
        cursor.execute("SELECT student_id, tutor_id FROM users WHERE user_id = ?", (user["user_id"],))
        updated_user = cursor.fetchone()
        final_student_id = updated_user["student_id"] if updated_user else student_id
        final_tutor_id = updated_user["tutor_id"] if updated_user else tutor_id
        
        # Return user information (without password)
        return jsonify({
            "message": "Login successful",
            "user_id": user["user_id"],
            "email": user["email"],
            "role": user["role"],
            "student_id": final_student_id,
            "tutor_id": final_tutor_id
        }), 200
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[ERROR] Unexpected error in login_user: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    finally:
        # Always close the connection, even if there's an error
        if conn:
            conn.close()
# End Story 11 - User login

###################
###################
# End Iteration 3 - Authentication routes
###################
###################

###################
###################
# Iteration 3 - Debug and utility routes
###################
################


###################
#################
# End Iteration 3 - Debug and utility routes
################
###################

# Health check endpoint for testing connectivity
@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint to verify server is running"""
    return jsonify({"status": "ok", "message": "Server is running"}), 200

# RUN LOCALLY PORT 5000
#app entry point
if __name__ == '__main__':
    print("=" * 50)
    print("Starting Flask server...")
    print("Server will be available at: http://127.0.0.1:5000")
    print("Health check: http://127.0.0.1:5000/api/health")
    print("=" * 50)
    app.run(debug=True, port=5000, host='127.0.0.1')
