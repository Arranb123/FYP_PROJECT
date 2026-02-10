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
    # Backs up corrupted database before recreating it
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
    # Sets up database tables on server start
    # retry_on_corruption: if True, tries to fix corrupted database automatically
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
        
        # Iteration 4 - Add module column to bookings table if it doesn't exist
        # added this so each booking can have a specific module instead of all tutor modules
        # ref: SQLite ALTER TABLE - https://www.sqlite.org/lang_altertable.html
        try:
            cursor.execute("ALTER TABLE bookings ADD COLUMN module TEXT")
            conn.commit()
        except sqlite3.OperationalError:
            pass  # Column already exists
        
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
            is_active INTEGER DEFAULT 1,                 -- Iteration 4 - Account status: 1=active, 0=deactivated
            -- ref: SQLite user management - https://www.sqlitetutorial.net/sqlite-alter-table/
            created_at TIMESTAMP,                        -- When this user account was created
            updated_at TIMESTAMP,                        -- When this user account was last updated
            FOREIGN KEY (student_id) REFERENCES students(id),  -- Links to students table
            FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id)  -- Links to tutors table
        );
        """)
        
        # Iteration 4 - Add is_active column to users table if it doesn't exist
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1")
            # Update all existing users to be active by default
            cursor.execute("UPDATE users SET is_active = 1 WHERE is_active IS NULL")
            conn.commit()
            print("[INFO] Added 'is_active' column to users table.")
        except sqlite3.OperationalError as e:
            if "duplicate column name: is_active" in str(e):
                print("[INFO] 'is_active' column already exists in users table.")
            else:
                print(f"[ERROR] Failed to add 'is_active' column to users table: {e}")
        
        # Iteration 4 - Create tutor availability table
        # This table stores when tutors are available for sessions
        # ref: https://www.w3schools.com/sql/sql_create_table.asp
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tutor_availability (
            availability_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Autoincrementing unique ID
            tutor_id INTEGER NOT NULL,                          -- ID of the tutor
            day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0=Monday, 6=Sunday
            start_time TIME NOT NULL,                           -- Start time (e.g., '09:00:00')
            end_time TIME NOT NULL,                             -- End time (e.g., '17:00:00')
            is_available INTEGER DEFAULT 1,                     -- 1=available, 0=unavailable
            created_at TIMESTAMP,                               -- When this availability was created
            updated_at TIMESTAMP,                                -- When this availability was last updated
            FOREIGN KEY (tutor_id) REFERENCES tutors(tutor_id)    -- Links to tutors table
        );
        """)
        
        # Iteration 4 - Create messages table for booking communication
        # This table stores messages between learners and tutors for accepted bookings
        # ChatGPT conversation reference for messaging feature implementation:
        # https://chatgpt.com/share/6984af21-d9ac-8008-a016-f00a20286dd1
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            message_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Autoincrementing unique ID for each message
            booking_id INTEGER NOT NULL,                   -- ID of the booking this message belongs to
            sender_id INTEGER NOT NULL,                     -- ID of the sender (learner_id or tutor_id)
            sender_role TEXT NOT NULL,                      -- Role of sender: 'learner' or 'tutor'
            message_text TEXT NOT NULL,                     -- The actual message content
            read_at TIMESTAMP,                              -- When the message was read (NULL if unread)
            created_at TIMESTAMP,                           -- When this message was created
            FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)  -- Links to bookings table
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

# GET VERIFIED TUTORS (for learners search)
###https://www.youtube.com/watch?v=KO0FufpqC7c#### - Video used to help create route
# Iteration 4 - Added search filters (price range, rating, sorting)
# ref: SQL WHERE clause - https://www.w3schools.com/sql/sql_where.asp
@app.route('/api/tutors', methods=['GET'])
def get_tutor_list():
    #returns verified tutors when searched for module
    module_query = request.args.get("module", "").strip() ##looks for query eg if frontend sends is3319 , this will store that
    
    # Iteration 4 - Get filter parameters
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    min_rating = request.args.get("min_rating", type=float)
    sort_by = request.args.get("sort_by", "default")  # default, price_low, price_high, rating_high, rating_low
    
    conn = get_db_connection()#db conn
    cursor = conn.cursor()

    # Iteration 4 - Build query with filters
    query = "SELECT * FROM tutors WHERE verified = 1"
    params = []
    
    # Module filter
    if module_query:
        query += " AND modules LIKE ?"
        params.append('%' + module_query + '%')
    
    # Price range filters
    if min_price is not None:
        query += " AND hourly_rate >= ?"
        params.append(min_price)
    
    if max_price is not None:
        query += " AND hourly_rate <= ?"
        params.append(max_price)
    
    # Rating filter
    if min_rating is not None:
        query += " AND rating >= ?"
        params.append(min_rating)
    
    # Sorting
    if sort_by == "price_low":
        query += " ORDER BY hourly_rate ASC"
    elif sort_by == "price_high":
        query += " ORDER BY hourly_rate DESC"
    elif sort_by == "rating_high":
        query += " ORDER BY rating DESC, hourly_rate ASC"
    elif sort_by == "rating_low":
        query += " ORDER BY rating ASC, hourly_rate ASC"
    else:
        # Default: sort by rating (high to low), then by price (low to high)
        query += " ORDER BY rating DESC, hourly_rate ASC"

    cursor.execute(query, tuple(params) if params else None)
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
# Iteration 4 - Added API integrations (Google Calendar, Email, Timezone)
# ChatGPT conversation reference for API integration guidance:
# https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
@app.route('/api/bookings', methods=['POST'])
def create_booking():
    """
    Creates a new booking in the database.
    Links a learner with a tutor for a specific date and time.
    Integrates with Google Calendar API, Email API, and Timezone API.
    """
    # Get booking data from request
    data = request.get_json()
    learner_id = data.get('learner_id')
    tutor_id = data.get('tutor_id')
    session_date = data.get('session_date')
    session_time = data.get('session_time')
    duration = data.get('duration', 60)
    module = data.get('module')  # Iteration 4 - Module for this specific booking

    # Check all required fields are provided
    if not all([learner_id, tutor_id, session_date, session_time, module]):
        return jsonify({"error": "Missing required fields. Please select a module."}), 400

    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get learner and tutor information for API integrations
        cursor.execute("SELECT first_name, last_name, college_email FROM students WHERE id = ?", (learner_id,))
        learner = cursor.fetchone()
        cursor.execute("SELECT first_name, last_name, college_email FROM tutors WHERE tutor_id = ?", (tutor_id,))
        tutor = cursor.fetchone()
        
        if not learner or not tutor:
            return jsonify({"error": "Learner or tutor not found"}), 404
        
        learner_name = f"{learner['first_name']} {learner['last_name']}".strip()
        tutor_name = f"{tutor['first_name']} {tutor['last_name']}".strip()
        learner_email = learner['college_email']
        tutor_email = tutor['college_email']
        
        # Iteration 4 - Check tutor availability for the requested time
        # ref: SQL date time validation - https://www.sqlitetutorial.net/sqlite-date/
        # ref: Python datetime - https://docs.python.org/3/library/datetime.html
        try:
            booking_date = datetime.strptime(session_date, "%Y-%m-%d")
            day_of_week = booking_date.weekday()  # 0=Monday, 6=Sunday
            
            # Check if tutor has availability set for this day
            cursor.execute("""
                SELECT start_time, end_time FROM tutor_availability 
                WHERE tutor_id = ? AND day_of_week = ? AND is_available = 1
            """, (tutor_id, day_of_week))
            availability = cursor.fetchone()
            
            if availability:
                # Check if requested time is within available hours
                start_time = availability["start_time"]
                end_time = availability["end_time"]
                session_time_obj = datetime.strptime(session_time, "%H:%M").time()
                start_time_obj = datetime.strptime(start_time, "%H:%M:%S").time()
                end_time_obj = datetime.strptime(end_time, "%H:%M:%S").time()
                
                # Check if session time is within available window
                if session_time_obj < start_time_obj or session_time_obj >= end_time_obj:
                    return jsonify({
                        "error": f"Tutor is only available between {start_time[:5]} and {end_time[:5]} on this day"
                    }), 400
                
                # Check if session end time exceeds available window
                session_end_time = (datetime.combine(booking_date.date(), session_time_obj) + timedelta(minutes=duration)).time()
                if session_end_time > end_time_obj:
                    return jsonify({
                        "error": f"Session duration would exceed tutor's available time. Tutor available until {end_time[:5]}"
                    }), 400
                
                # Check for conflicts with existing bookings
                cursor.execute("""
                    SELECT session_time, duration FROM bookings 
                    WHERE tutor_id = ? AND session_date = ? 
                    AND status IN ('pending', 'confirmed')
                """, (tutor_id, session_date))
                existing_bookings = cursor.fetchall()
                
                for booking in existing_bookings:
                    existing_time_str = booking["session_time"]
                    if isinstance(existing_time_str, str):
                        existing_hour, existing_min = map(int, existing_time_str.split(':')[:2])
                        existing_datetime = datetime.combine(booking_date.date(), datetime.strptime(f"{existing_hour:02d}:{existing_min:02d}", "%H:%M").time())
                        existing_duration = booking["duration"] or 60
                        existing_end = existing_datetime + timedelta(minutes=existing_duration)
                        
                        requested_datetime = datetime.combine(booking_date.date(), session_time_obj)
                        requested_end = requested_datetime + timedelta(minutes=duration)
                        
                        # Check for overlap
                        if not (requested_end <= existing_datetime or requested_datetime >= existing_end):
                            return jsonify({
                                "error": "This time slot is already booked. Please select another time."
                            }), 400
            else:
                # Tutor hasn't set availability for this day - allow booking but warn
                print(f"[WARNING] Tutor {tutor_id} has no availability set for {day_of_week}, allowing booking anyway")
        except ValueError as e:
            return jsonify({"error": f"Invalid date or time format: {str(e)}"}), 400
        except Exception as e:
            print(f"[WARNING] Error checking availability: {e}")
            # Continue with booking if availability check fails (backward compatibility)
        
        # Get current timestamp - used to track when booking was created and last updated
        now = datetime.now()
        # Insert booking into database with status 'pending'
        # Timestamps: created_at and updated_at both set to now when booking is first created
        # This lets me track when bookings were made and when they were last changed
        # Iteration 4 - Insert booking with module
        cursor.execute("""
            INSERT INTO bookings (learner_id, tutor_id, session_date, session_time, duration, status, module, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
        """, (learner_id, tutor_id, session_date, session_time, duration, module, now, now))
        conn.commit()
        new_id = cursor.lastrowid
        
        # Prepare booking data for API calls
        booking_data = {
            'session_date': session_date,
            'session_time': session_time,
            'duration': duration
        }
        
        # Iteration 4 - API Integrations
        api_results = {}
        
        # 1. Google Calendar API - Create calendar event
        # Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
        try:
            from api_integrations import create_google_calendar_event
            print(f"[INFO] Attempting to create Google Calendar event for booking {new_id}")
            calendar_result = create_google_calendar_event(
                booking_data, learner_email, tutor_email, learner_name, tutor_name
            )
            api_results['google_calendar'] = calendar_result
            if calendar_result.get('success'):
                print(f"[SUCCESS] Google Calendar event created: {calendar_result.get('event_id')}")
            else:
                print(f"[INFO] Google Calendar: {calendar_result.get('message')}")
        except ImportError as e:
            print(f"[WARNING] Google Calendar API dependencies not installed: {e}")
            print(f"[INFO] Install with: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib")
            api_results['google_calendar'] = {"success": False, "message": f"Dependencies not installed: {str(e)}"}
        except Exception as e:
            print(f"[WARNING] Google Calendar integration failed: {e}")
            import traceback
            traceback.print_exc()
            api_results['google_calendar'] = {"success": False, "message": str(e)}
        
        # 2. Email API - Send confirmation emails
        # Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
        try:
            from api_integrations import send_booking_confirmation_email
            print(f"[INFO] Attempting to send booking confirmation emails")
            email_result = send_booking_confirmation_email(
                learner_email, tutor_email, learner_name, tutor_name, booking_data
            )
            api_results['email'] = email_result
            if email_result.get('success'):
                print(f"[SUCCESS] Email API: {email_result.get('message')}")
            else:
                print(f"[WARNING] Email API failed: {email_result.get('message')}")
        except Exception as e:
            print(f"[ERROR] Email integration failed: {e}")
            traceback.print_exc()
            api_results['email'] = {"success": False, "message": str(e)}
        
        # 3. Timezone API - Get timezone information (optional)
        # Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
        try:
            from api_integrations import get_timezone_info
            timezone_result = get_timezone_info()
            api_results['timezone'] = timezone_result
        except Exception as e:
            print(f"[WARNING] Timezone API integration failed: {e}")
            api_results['timezone'] = {"success": False, "message": str(e)}
        
        conn.close()
        
        return jsonify({
            "message": "Booking created successfully!",
            "booking_id": new_id,
            "api_integrations": api_results
        }), 201
    except sqlite3.Error as e:
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        if conn:
            conn.close()
        print(f"[ERROR] Unexpected error in create_booking: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500


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
    # Iteration 5 - Filter out cancelled bookings older than 24 hours
    twenty_four_hours_ago = now - timedelta(hours=24)
    twenty_four_hours_ago_str = twenty_four_hours_ago.strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        SELECT b.*, s.first_name as learner_first_name, s.last_name as learner_last_name, s.college_email as learner_email
        FROM bookings b
        JOIN students s ON b.learner_id = s.id
        WHERE b.tutor_id = ?
          AND NOT (b.status = 'cancelled' AND b.updated_at < ?)
        ORDER BY b.session_date DESC, b.session_time DESC
    """, (tutor_id, twenty_four_hours_ago_str))
    bookings = cursor.fetchall()
    conn.close()

    # Convert to list of dictionaries
    # Iteration 4 - Helper function to safely get module from sqlite3.Row
    def get_module_safe(booking_row):
        try:
            return booking_row["module"]
        except (KeyError, IndexError):
            return ""
    
    booking_list = [
        {
            "booking_id": b["booking_id"],
            "learner_id": b["learner_id"],
            "learner_name": f"{b['learner_first_name']} {b['learner_last_name']}",
            "learner_email": b["learner_email"],
            "tutor_id": b["tutor_id"],
            "module": get_module_safe(b),  # Iteration 4 - Specific module for this booking
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
    # Iteration 5 - Filter out cancelled bookings older than 24 hours
    twenty_four_hours_ago = now - timedelta(hours=24)
    twenty_four_hours_ago_str = twenty_four_hours_ago.strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        SELECT b.*, t.first_name as tutor_first_name, t.last_name as tutor_last_name, t.modules, t.hourly_rate
        FROM bookings b
        JOIN tutors t ON b.tutor_id = t.tutor_id
        WHERE b.learner_id = ?
          AND NOT (b.status = 'cancelled' AND b.updated_at < ?)
        ORDER BY b.session_date DESC, b.session_time DESC
    """, (learner_id, twenty_four_hours_ago_str))
    bookings = cursor.fetchall()
    conn.close()

    # Convert to list of dictionaries
    # Iteration 4 - Helper function to safely get module from sqlite3.Row
    def get_module_safe(booking_row):
        try:
            return booking_row["module"]
        except (KeyError, IndexError):
            return ""
    
    booking_list = [
        {
            "booking_id": b["booking_id"],
            "learner_id": b["learner_id"],
            "tutor_id": b["tutor_id"],
            "tutor_name": f"{b['tutor_first_name']} {b['tutor_last_name']}",
            "tutor_modules": b["modules"],  # All modules tutor teaches
            "module": get_module_safe(b),  # Iteration 4 - Specific module for this booking
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
        # Iteration 5 - Filter out cancelled bookings older than 24 hours
        twenty_four_hours_ago = now - timedelta(hours=24)
        twenty_four_hours_ago_str = twenty_four_hours_ago.strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            SELECT b.*, 
                   s.first_name as learner_first_name, s.last_name as learner_last_name, s.college_email as learner_email,
                   t.first_name as tutor_first_name, t.last_name as tutor_last_name, t.modules, t.hourly_rate
            FROM bookings b
            JOIN students s ON b.learner_id = s.id
            JOIN tutors t ON b.tutor_id = t.tutor_id
            WHERE NOT (b.status = 'cancelled' AND b.updated_at < ?)
            ORDER BY b.created_at DESC
        """, (twenty_four_hours_ago_str,))
        bookings = cursor.fetchall()
        conn.close()

        # Convert to list of dictionaries
        # Iteration 4 - Helper function to safely get module from sqlite3.Row
        def get_module_safe(booking_row):
            try:
                return booking_row["module"]
            except (KeyError, IndexError):
                return ""
        
        booking_list = [
            {
                "booking_id": b["booking_id"],
                "learner_id": b["learner_id"],
                "learner_name": f"{b['learner_first_name']} {b['learner_last_name']}",
                "learner_email": b["learner_email"],
                "tutor_id": b["tutor_id"],
                "tutor_name": f"{b['tutor_first_name']} {b['tutor_last_name']}",
                "tutor_modules": b["modules"],  # All modules tutor teaches
                "module": get_module_safe(b),  # Iteration 4 - Specific module for this booking
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

# Iteration 4 - Admin platform report endpoint
# ref: SQL aggregation functions - https://www.w3schools.com/sql/sql_count_avg_sum.asp
@app.route('/api/admin/report', methods=['GET'])
def generate_platform_report():
    """
    Generates a comprehensive platform report with statistics.
    Includes user counts, booking statistics, tutor metrics, and more.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        report = {
            "generated_at": datetime.now().isoformat(),
            "summary": {},
            "users": {},
            "bookings": {},
            "tutors": {},
            "modules": {},
            "reviews": {},
            "recent_activity": {}
        }
        
        # User Statistics
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'learner'")
        learner_count = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'tutor'")
        tutor_user_count = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
        admin_count = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM students")
        student_count = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM tutors")
        tutor_record_count = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM tutors WHERE verified = 1")
        verified_tutor_count = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM tutors WHERE verified = 0")
        unverified_tutor_count = cursor.fetchone()["count"]
        
        report["users"] = {
            "total_learners": learner_count,
            "total_students": student_count,
            "total_tutor_users": tutor_user_count,
            "total_tutor_records": tutor_record_count,
            "verified_tutors": verified_tutor_count,
            "unverified_tutors": unverified_tutor_count,
            "total_admins": admin_count,
            "total_users": learner_count + tutor_user_count + admin_count
        }
        
        # Booking Statistics
        cursor.execute("SELECT COUNT(*) as count FROM bookings")
        total_bookings = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'")
        pending_bookings = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'")
        confirmed_bookings = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'accepted'")
        accepted_bookings = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'")
        completed_bookings = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'cancelled'")
        cancelled_bookings = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'denied'")
        denied_bookings = cursor.fetchone()["count"]
        
        cursor.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'missed'")
        missed_bookings = cursor.fetchone()["count"]
        
        # Booking trends (last 30 days)
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        cursor.execute("""
            SELECT COUNT(*) as count FROM bookings 
            WHERE created_at >= ?
        """, (thirty_days_ago,))
        bookings_last_30_days = cursor.fetchone()["count"]
        
        # Booking trends (last 7 days)
        seven_days_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        cursor.execute("""
            SELECT COUNT(*) as count FROM bookings 
            WHERE created_at >= ?
        """, (seven_days_ago,))
        bookings_last_7_days = cursor.fetchone()["count"]
        
        # Average booking duration
        cursor.execute("SELECT AVG(duration) as avg_duration FROM bookings")
        avg_duration_result = cursor.fetchone()
        avg_duration = round(avg_duration_result["avg_duration"], 2) if avg_duration_result["avg_duration"] else 0
        
        report["bookings"] = {
            "total": total_bookings,
            "by_status": {
                "pending": pending_bookings,
                "confirmed": confirmed_bookings,
                "accepted": accepted_bookings,
                "completed": completed_bookings,
                "cancelled": cancelled_bookings,
                "denied": denied_bookings,
                "missed": missed_bookings
            },
            "trends": {
                "last_7_days": bookings_last_7_days,
                "last_30_days": bookings_last_30_days
            },
            "average_duration_minutes": avg_duration
        }
        
        # Tutor Statistics
        cursor.execute("SELECT AVG(rating) as avg_rating FROM tutors WHERE rating > 0")
        avg_rating_result = cursor.fetchone()
        avg_rating = round(avg_rating_result["avg_rating"], 2) if avg_rating_result["avg_rating"] else 0
        
        cursor.execute("SELECT AVG(hourly_rate) as avg_rate FROM tutors WHERE verified = 1")
        avg_rate_result = cursor.fetchone()
        avg_rate = round(avg_rate_result["avg_rate"], 2) if avg_rate_result["avg_rate"] else 0
        
        cursor.execute("SELECT MIN(hourly_rate) as min_rate FROM tutors WHERE verified = 1")
        min_rate_result = cursor.fetchone()
        min_rate = round(min_rate_result["min_rate"], 2) if min_rate_result["min_rate"] else 0
        
        cursor.execute("SELECT MAX(hourly_rate) as max_rate FROM tutors WHERE verified = 1")
        max_rate_result = cursor.fetchone()
        max_rate = round(max_rate_result["max_rate"], 2) if max_rate_result["max_rate"] else 0
        
        # Top tutors by rating
        cursor.execute("""
            SELECT tutor_id, first_name, last_name, rating, hourly_rate, 
                   (SELECT COUNT(*) FROM bookings WHERE tutor_id = tutors.tutor_id) as booking_count
            FROM tutors 
            WHERE verified = 1 AND rating > 0
            ORDER BY rating DESC, booking_count DESC
            LIMIT 5
        """)
        top_tutors = [
            {
                "tutor_id": t["tutor_id"],
                "name": f"{t['first_name']} {t['last_name']}",
                "rating": round(t["rating"], 2),
                "hourly_rate": t["hourly_rate"],
                "total_bookings": t["booking_count"]
            }
            for t in cursor.fetchall()
        ]
        
        report["tutors"] = {
            "average_rating": avg_rating,
            "average_hourly_rate": avg_rate,
            "price_range": {
                "min": min_rate,
                "max": max_rate
            },
            "top_tutors": top_tutors
        }
        
        # Module Popularity
        cursor.execute("""
            SELECT module, COUNT(*) as count 
            FROM bookings 
            WHERE module IS NOT NULL AND module != ''
            GROUP BY module 
            ORDER BY count DESC 
            LIMIT 10
        """)
        popular_modules = [
            {
                "module": m["module"],
                "booking_count": m["count"]
            }
            for m in cursor.fetchall()
        ]
        
        report["modules"] = {
            "most_popular": popular_modules
        }
        
        # Review Statistics
        cursor.execute("SELECT COUNT(*) as count FROM reviews")
        total_reviews = cursor.fetchone()["count"]
        
        cursor.execute("SELECT AVG(rating) as avg_rating FROM reviews")
        avg_review_rating_result = cursor.fetchone()
        avg_review_rating = round(avg_review_rating_result["avg_rating"], 2) if avg_review_rating_result["avg_rating"] else 0
        
        cursor.execute("""
            SELECT rating, COUNT(*) as count 
            FROM reviews 
            GROUP BY rating 
            ORDER BY rating DESC
        """)
        rating_distribution = {
            str(r["rating"]): r["count"]
            for r in cursor.fetchall()
        }
        
        report["reviews"] = {
            "total": total_reviews,
            "average_rating": avg_review_rating,
            "rating_distribution": rating_distribution
        }
        
        # Recent Activity (last 10 bookings)
        cursor.execute("""
            SELECT b.*, 
                   s.first_name as learner_first_name, s.last_name as learner_last_name,
                   t.first_name as tutor_first_name, t.last_name as tutor_last_name
            FROM bookings b
            JOIN students s ON b.learner_id = s.id
            JOIN tutors t ON b.tutor_id = t.tutor_id
            ORDER BY b.created_at DESC
            LIMIT 10
        """)
        recent_bookings = [
            {
                "booking_id": b["booking_id"],
                "learner_name": f"{b['learner_first_name']} {b['learner_last_name']}",
                "tutor_name": f"{b['tutor_first_name']} {b['tutor_last_name']}",
                "session_date": b["session_date"],
                "status": b["status"],
                "created_at": b["created_at"]
            }
            for b in cursor.fetchall()
        ]
        
        report["recent_activity"] = {
            "recent_bookings": recent_bookings
        }
        
        # Summary Statistics
        completion_rate = (completed_bookings / total_bookings * 100) if total_bookings > 0 else 0
        cancellation_rate = ((cancelled_bookings + denied_bookings) / total_bookings * 100) if total_bookings > 0 else 0
        
        report["summary"] = {
            "total_users": report["users"]["total_users"],
            "total_bookings": total_bookings,
            "total_tutors": verified_tutor_count,
            "completion_rate_percent": round(completion_rate, 2),
            "cancellation_rate_percent": round(cancellation_rate, 2),
            "average_tutor_rating": avg_rating,
            "total_reviews": total_reviews
        }
        
        conn.close()
        return jsonify(report), 200
        
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Error generating report: {str(e)}"}), 500
# End Iteration 4 - Admin platform report

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

# Iteration 4 - Admin user management endpoints
# ref: Flask request handling - https://flask.palletsprojects.com/en/3.0.x/api/#flask.Request
@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """
    Gets all users in the system for admin management.
    Includes user email, role, account status, and linked records.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all users with their linked student/tutor information
        cursor.execute("""
            SELECT 
                u.user_id,
                u.email,
                u.role,
                u.is_active,
                u.student_id,
                u.tutor_id,
                u.created_at,
                u.updated_at,
                s.first_name as student_first_name,
                s.last_name as student_last_name,
                t.first_name as tutor_first_name,
                t.last_name as tutor_last_name,
                t.verified as tutor_verified
            FROM users u
            LEFT JOIN students s ON u.student_id = s.id
            LEFT JOIN tutors t ON u.tutor_id = t.tutor_id
            ORDER BY u.created_at DESC
        """)
        users = cursor.fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        user_list = []
        for u in users:
            # Iteration 4 - Safely get is_active (handle legacy accounts)
            try:
                is_active = u["is_active"]
                if is_active is None:
                    is_active = 1  # Default to active for legacy accounts
            except (KeyError, IndexError):
                is_active = 1  # Default to active if column doesn't exist
            
            user_list.append({
                "user_id": u["user_id"],
                "email": u["email"],
                "role": u["role"],
                "is_active": is_active,
                "student_id": u["student_id"],
                "tutor_id": u["tutor_id"],
                "created_at": u["created_at"],
                "updated_at": u["updated_at"],
                "student_name": f"{u['student_first_name']} {u['student_last_name']}".strip() if u["student_first_name"] else None,
                "tutor_name": f"{u['tutor_first_name']} {u['tutor_last_name']}".strip() if u["tutor_first_name"] else None,
                "tutor_verified": u["tutor_verified"] if u["tutor_verified"] is not None else None
            })
        
        return jsonify(user_list), 200
    except sqlite3.Error as e:
        if conn:
            conn.close()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        if conn:
            conn.close()
        print(f"[ERROR] Unexpected error in get_all_users: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/api/admin/users/<int:user_id>/status', methods=['PUT'])
def update_user_status(user_id):
    """
    Updates a user's account status (activate/deactivate).
    Only admins can perform this action.
    """
    conn = None
    try:
        data = request.get_json()
        is_active = data.get('is_active')
        
        # Validate is_active value
        if is_active is None:
            return jsonify({"error": "Missing required field: is_active"}), 400
        
        # Convert to integer (0 or 1)
        is_active = 1 if is_active else 0
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT user_id, email, role FROM users WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({"error": "User not found"}), 404
        
        # Prevent deactivating admin accounts (safety measure)
        if user["role"] == "admin" and is_active == 0:
            conn.close()
            return jsonify({"error": "Cannot deactivate admin accounts"}), 400
        
        # Update user status
        now = datetime.now()
        cursor.execute("""
            UPDATE users 
            SET is_active = ?, updated_at = ?
            WHERE user_id = ?
        """, (is_active, now, user_id))
        conn.commit()
        conn.close()
        
        status_text = "activated" if is_active == 1 else "deactivated"
        return jsonify({
            "message": f"User account {status_text} successfully",
            "user_id": user_id,
            "email": user["email"],
            "is_active": is_active
        }), 200
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
            conn.close()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print(f"[ERROR] Unexpected error in update_user_status: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

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

# UX Improvement - Get tutor profile with reviews for public viewing
@app.route('/api/tutors/<int:tutor_id>/profile', methods=['GET'])
def get_tutor_profile(tutor_id):
    """
    Gets a tutor's public profile including all reviews and statistics.
    Used for displaying tutor profile page to learners.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get tutor information
        cursor.execute("SELECT * FROM tutors WHERE tutor_id = ? AND verified = 1", (tutor_id,))
        tutor = cursor.fetchone()
        
        if not tutor:
            return jsonify({"error": "Tutor not found or not verified"}), 404
        
        # Get all reviews for this tutor
        cursor.execute("""
            SELECT r.*, 
                   s.first_name as learner_first_name, 
                   s.last_name as learner_last_name,
                   b.session_date,
                   b.module
            FROM reviews r
            JOIN students s ON r.learner_id = s.id
            LEFT JOIN bookings b ON r.booking_id = b.booking_id
            WHERE r.tutor_id = ?
            ORDER BY r.created_at DESC
        """, (tutor_id,))
        reviews = cursor.fetchall()
        
        # Calculate review statistics
        total_reviews = len(reviews)
        rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for review in reviews:
            rating = review["rating"]
            if rating in rating_counts:
                rating_counts[rating] += 1
        
        # Get booking statistics
        cursor.execute("""
            SELECT 
                COUNT(*) as total_bookings,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
                SUM(CASE WHEN status = 'confirmed' OR status = 'accepted' THEN 1 ELSE 0 END) as confirmed_bookings
            FROM bookings
            WHERE tutor_id = ?
        """, (tutor_id,))
        booking_stats = cursor.fetchone()
        
        # Format reviews
        review_list = [
            {
                "review_id": r["review_id"],
                "rating": r["rating"],
                "comment": r["comment"],
                "learner_name": f"{r['learner_first_name']} {r['learner_last_name']}",
                "module": r["module"] or "N/A",
                "session_date": r["session_date"],
                "created_at": r["created_at"]
            }
            for r in reviews
        ]
        
        # Format tutor profile data
        profile_data = {
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
            "created_at": tutor["created_at"],
            "reviews": review_list,
            "review_stats": {
                "total_reviews": total_reviews,
                "average_rating": tutor["rating"],
                "rating_distribution": rating_counts
            },
            "booking_stats": {
                "total_bookings": booking_stats["total_bookings"] or 0,
                "completed_bookings": booking_stats["completed_bookings"] or 0,
                "confirmed_bookings": booking_stats["confirmed_bookings"] or 0
            }
        }
        
        return jsonify(profile_data), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

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
# Iteration 4 - Tutor Availability and Booking Confirmation System
# ref: Flask REST API tutorial - https://flask.palletsprojects.com/en/3.0.x/quickstart/#routing
###################
###################

# Set tutor availability
@app.route('/api/tutors/<int:tutor_id>/availability', methods=['POST', 'PUT'])
def set_tutor_availability(tutor_id):
    """
    Sets or updates tutor availability.
    Expects JSON with: day_of_week (0-6), start_time, end_time, is_available (1 or 0)
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    day_of_week = data.get('day_of_week')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    is_available = data.get('is_available', 1)
    
    # Validate required fields
    if day_of_week is None or not start_time or not end_time:
        return jsonify({"error": "Missing required fields: day_of_week, start_time, end_time"}), 400
    
    # Validate day_of_week (0-6)
    try:
        day_of_week = int(day_of_week)
        if day_of_week < 0 or day_of_week > 6:
            return jsonify({"error": "day_of_week must be between 0 (Monday) and 6 (Sunday)"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "day_of_week must be a number"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if tutor exists
        cursor.execute("SELECT tutor_id FROM tutors WHERE tutor_id = ?", (tutor_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Tutor not found"}), 404
        
        # Check if availability already exists for this day
        cursor.execute("""
            SELECT availability_id FROM tutor_availability 
            WHERE tutor_id = ? AND day_of_week = ?
        """, (tutor_id, day_of_week))
        existing = cursor.fetchone()
        
        now = datetime.now()
        if existing:
            # Update existing availability
            cursor.execute("""
                UPDATE tutor_availability 
                SET start_time = ?, end_time = ?, is_available = ?, updated_at = ?
                WHERE tutor_id = ? AND day_of_week = ?
            """, (start_time, end_time, is_available, now, tutor_id, day_of_week))
        else:
            # Insert new availability
            cursor.execute("""
                INSERT INTO tutor_availability (tutor_id, day_of_week, start_time, end_time, is_available, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (tutor_id, day_of_week, start_time, end_time, is_available, now, now))
        
        conn.commit()
        return jsonify({"message": "Availability updated successfully"}), 200
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# Get tutor availability
@app.route('/api/tutors/<int:tutor_id>/availability', methods=['GET'])
def get_tutor_availability(tutor_id):
    """
    Gets all availability slots for a tutor.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM tutor_availability 
            WHERE tutor_id = ? AND is_available = 1
            ORDER BY day_of_week, start_time
        """, (tutor_id,))
        
        availability = cursor.fetchall()
        
        availability_list = [
            {
                "availability_id": a["availability_id"],
                "day_of_week": a["day_of_week"],
                "start_time": a["start_time"],
                "end_time": a["end_time"],
                "is_available": a["is_available"]
            }
            for a in availability
        ]
        
        return jsonify(availability_list), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# Get available time slots for a specific date
@app.route('/api/tutors/<int:tutor_id>/available-slots', methods=['GET'])
def get_available_slots(tutor_id):
    """
    Gets available time slots for a tutor on a specific date.
    Takes query parameter: date (YYYY-MM-DD)
    Returns available time slots based on:
    1. Tutor's weekly availability
    2. Existing bookings on that date
    """
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({"error": "Missing required parameter: date"}), 400
    
    try:
        # Parse the date and get day of week (0=Monday, 6=Sunday)
        booking_date = datetime.strptime(date_str, "%Y-%m-%d")
        day_of_week = booking_date.weekday()  # 0=Monday, 6=Sunday
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get tutor's availability for this day of week
        cursor.execute("""
            SELECT start_time, end_time FROM tutor_availability 
            WHERE tutor_id = ? AND day_of_week = ? AND is_available = 1
        """, (tutor_id, day_of_week))
        
        availability = cursor.fetchone()
        if not availability:
            return jsonify({"available_slots": [], "message": "Tutor not available on this day"}), 200
        
        start_time_str = availability["start_time"]
        end_time_str = availability["end_time"]
        
        # Iteration 4 - Parse times (handle both HH:MM and HH:MM:SS formats)
        # Split and take only first 2 parts (hour and minute), ignore seconds if present
        # ref: Python string split - https://www.w3schools.com/python/ref_string_split.asp
        # ref: Python datetime parsing - https://docs.python.org/3/library/datetime.html#strftime-strptime-behavior
        start_parts = start_time_str.split(':')
        end_parts = end_time_str.split(':')
        start_hour, start_min = int(start_parts[0]), int(start_parts[1])
        end_hour, end_min = int(end_parts[0]), int(end_parts[1])
        
        # Get existing bookings for this date
        cursor.execute("""
            SELECT session_time, duration FROM bookings 
            WHERE tutor_id = ? AND session_date = ? AND status IN ('pending', 'confirmed')
        """, (tutor_id, date_str))
        
        existing_bookings = cursor.fetchall()
        
        # Generate 30-minute time slots
        available_slots = []
        current_hour = start_hour
        current_min = start_min
        
        while (current_hour < end_hour) or (current_hour == end_hour and current_min < end_min):
            slot_time = f"{current_hour:02d}:{current_min:02d}"
            slot_datetime = datetime.strptime(f"{date_str} {slot_time}", "%Y-%m-%d %H:%M")
            slot_end = slot_datetime + timedelta(minutes=30)
            
            # Check if this slot conflicts with existing bookings
            is_available = True
            for booking in existing_bookings:
                booking_time_str = booking["session_time"]
                if isinstance(booking_time_str, str):
                    booking_hour, booking_min = map(int, booking_time_str.split(':')[:2])
                    booking_datetime = datetime.strptime(f"{date_str} {booking_hour:02d}:{booking_min:02d}", "%Y-%m-%d %H:%M")
                    booking_duration = booking["duration"] or 60
                    booking_end = booking_datetime + timedelta(minutes=booking_duration)
                    
                    # Check for overlap
                    if not (slot_end <= booking_datetime or slot_datetime >= booking_end):
                        is_available = False
                        break
            
            if is_available:
                available_slots.append(slot_time)
            
            # Move to next 30-minute slot
            current_min += 30
            if current_min >= 60:
                current_min = 0
                current_hour += 1
        
        return jsonify({
            "date": date_str,
            "available_slots": available_slots,
            "tutor_availability": {
                "start_time": start_time_str,
                "end_time": end_time_str
            }
        }), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Error generating slots: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# Tutor accept booking
@app.route('/api/bookings/<int:booking_id>/accept', methods=['PUT'])
def accept_booking(booking_id):
    """
    Allows tutor to accept a pending booking.
    Changes status from 'pending' to 'confirmed'.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if booking exists and is pending
        cursor.execute("SELECT * FROM bookings WHERE booking_id = ?", (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        
        if booking["status"] != "pending":
            return jsonify({"error": f"Booking is already {booking['status']}. Only pending bookings can be accepted."}), 400
        
        # Update status to confirmed
        cursor.execute("""
            UPDATE bookings 
            SET status = 'confirmed', updated_at = ?
            WHERE booking_id = ?
        """, (datetime.now(), booking_id))
        
        conn.commit()
        return jsonify({"message": "Booking accepted successfully", "booking_id": booking_id}), 200
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# Tutor deny/reject booking
@app.route('/api/bookings/<int:booking_id>/deny', methods=['PUT'])
def deny_booking(booking_id):
    """
    Allows tutor to deny/reject a pending booking.
    Changes status from 'pending' to 'cancelled'.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if booking exists and is pending
        cursor.execute("SELECT * FROM bookings WHERE booking_id = ?", (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        
        if booking["status"] != "pending":
            return jsonify({"error": f"Booking is already {booking['status']}. Only pending bookings can be denied."}), 400
        
        # Update status to cancelled
        cursor.execute("""
            UPDATE bookings 
            SET status = 'cancelled', updated_at = ?
            WHERE booking_id = ?
        """, (datetime.now(), booking_id))
        
        conn.commit()
        return jsonify({"message": "Booking denied successfully", "booking_id": booking_id}), 200
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# Iteration 4 - Send a message for a booking
# ChatGPT conversation reference: https://chatgpt.com/share/6984af21-d9ac-8008-a016-f00a20286dd1
@app.route('/api/bookings/<int:booking_id>/messages', methods=['POST'])
def send_message(booking_id):
    """
    Allows learners and tutors to send messages for accepted bookings.
    Only works for bookings with status 'confirmed' or 'accepted'.
    """
    data = request.get_json()
    sender_id = data.get('sender_id')
    sender_role = data.get('sender_role')  # 'learner' or 'tutor'
    message_text = data.get('message_text', '').strip()
    
    # Validate required fields
    if not all([sender_id, sender_role, message_text]):
        return jsonify({"error": "Missing required fields: sender_id, sender_role, and message_text"}), 400
    
    # Validate sender_role
    if sender_role not in ['learner', 'tutor']:
        return jsonify({"error": "sender_role must be 'learner' or 'tutor'"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if booking exists and is confirmed/accepted
        cursor.execute("SELECT * FROM bookings WHERE booking_id = ?", (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        
        # Only allow messaging for confirmed/accepted bookings
        if booking["status"] not in ['confirmed', 'accepted']:
            return jsonify({"error": f"Messaging is only available for confirmed bookings. Current status: {booking['status']}"}), 400
        
        # Verify sender is part of this booking
        if sender_role == 'learner':
            if booking["learner_id"] != sender_id:
                return jsonify({"error": "You are not authorized to send messages for this booking"}), 403
        else:  # sender_role == 'tutor'
            if booking["tutor_id"] != sender_id:
                return jsonify({"error": "You are not authorized to send messages for this booking"}), 403
        
        # Insert message into database
        now = datetime.now()
        cursor.execute("""
            INSERT INTO messages (booking_id, sender_id, sender_role, message_text, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (booking_id, sender_id, sender_role, message_text, now))
        
        conn.commit()
        message_id = cursor.lastrowid
        
        return jsonify({
            "message": "Message sent successfully",
            "message_id": message_id,
            "booking_id": booking_id
        }), 201
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# Iteration 4 - Get all messages for a booking
# ChatGPT conversation reference: https://chatgpt.com/share/6984af21-d9ac-8008-a016-f00a20286dd1
@app.route('/api/bookings/<int:booking_id>/messages', methods=['GET'])
def get_booking_messages(booking_id):
    """
    Retrieves all messages for a specific booking.
    Only accessible by the learner or tutor associated with the booking.
    """
    # Get query parameters for authorization
    user_id = request.args.get('user_id', type=int)
    user_role = request.args.get('user_role')
    
    if not user_id or not user_role:
        return jsonify({"error": "Missing required query parameters: user_id and user_role"}), 400
    
    if user_role not in ['learner', 'tutor']:
        return jsonify({"error": "user_role must be 'learner' or 'tutor'"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if booking exists
        cursor.execute("SELECT * FROM bookings WHERE booking_id = ?", (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        
        # Verify user is part of this booking
        if user_role == 'learner':
            if booking["learner_id"] != user_id:
                return jsonify({"error": "You are not authorized to view messages for this booking"}), 403
        else:  # user_role == 'tutor'
            if booking["tutor_id"] != user_id:
                return jsonify({"error": "You are not authorized to view messages for this booking"}), 403
        
        # Get all messages for this booking, ordered by creation time
        cursor.execute("""
            SELECT message_id, booking_id, sender_id, sender_role, message_text, 
                   read_at, created_at
            FROM messages
            WHERE booking_id = ?
            ORDER BY created_at ASC
        """, (booking_id,))
        
        messages = cursor.fetchall()
        
        # Convert to list of dictionaries
        message_list = [
            {
                "message_id": msg["message_id"],
                "booking_id": msg["booking_id"],
                "sender_id": msg["sender_id"],
                "sender_role": msg["sender_role"],
                "message_text": msg["message_text"],
                "read_at": msg["read_at"],
                "created_at": msg["created_at"]
            }
            for msg in messages
        ]
        
        return jsonify(message_list), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# Iteration 4 - Get all messages for a user (learner or tutor)
# ChatGPT conversation reference: https://chatgpt.com/share/6984af21-d9ac-8008-a016-f00a20286dd1
@app.route('/api/messages', methods=['GET'])
def get_user_messages():
    """
    Retrieves all messages for a user (learner or tutor) across all their bookings.
    Groups messages by booking and includes booking details.
    """
    try:
        user_id = request.args.get('user_id', type=int)
        user_role = request.args.get('user_role')
        
        print(f"[INFO] get_user_messages called with user_id={user_id}, user_role={user_role}")
        
        if not user_id or not user_role:
            print(f"[ERROR] Missing required parameters: user_id={user_id}, user_role={user_role}")
            return jsonify({"error": "Missing required query parameters: user_id and user_role"}), 400
        
        if user_role not in ['learner', 'tutor']:
            print(f"[ERROR] Invalid user_role: {user_role}")
            return jsonify({"error": "user_role must be 'learner' or 'tutor'"}), 400
        
        conn = None
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all bookings for this user
        if user_role == 'learner':
            cursor.execute("""
                SELECT booking_id, tutor_id, session_date, session_time, status, module
                FROM bookings
                WHERE learner_id = ? AND status IN ('confirmed', 'accepted')
            """, (user_id,))
        else:  # user_role == 'tutor'
            cursor.execute("""
                SELECT booking_id, learner_id, session_date, session_time, status, module
                FROM bookings
                WHERE tutor_id = ? AND status IN ('confirmed', 'accepted')
            """, (user_id,))
        
        bookings = cursor.fetchall()
        
        if not bookings:
            return jsonify([]), 200
        
        # Get all messages for these bookings
        booking_ids = [b["booking_id"] for b in bookings]
        
        # If no booking IDs, return empty list
        if not booking_ids:
            return jsonify([]), 200
        
        placeholders = ','.join(['?'] * len(booking_ids))
        
        cursor.execute(f"""
            SELECT m.message_id, m.booking_id, m.sender_id, m.sender_role, 
                   m.message_text, m.read_at, m.created_at,
                   b.session_date, b.session_time, b.status, b.module
            FROM messages m
            JOIN bookings b ON m.booking_id = b.booking_id
            WHERE m.booking_id IN ({placeholders})
            ORDER BY b.booking_id DESC, m.created_at ASC
        """, booking_ids)
        
        messages = cursor.fetchall()
        
        # If no messages, return empty list
        if not messages:
            return jsonify([]), 200
        
        # Get names for learners/tutors
        result = []
        booking_groups = {}
        
        for msg in messages:
            booking_id = msg["booking_id"]
            
            if booking_id not in booking_groups:
                # Get the other party's name
                if user_role == 'learner':
                    cursor.execute("""
                        SELECT first_name, last_name, college_email
                        FROM tutors
                        WHERE tutor_id = (SELECT tutor_id FROM bookings WHERE booking_id = ?)
                    """, (booking_id,))
                else:  # user_role == 'tutor'
                    cursor.execute("""
                        SELECT first_name, last_name, college_email
                        FROM students
                        WHERE id = (SELECT learner_id FROM bookings WHERE booking_id = ?)
                    """, (booking_id,))
                
                other_party = cursor.fetchone()
                other_party_name = f"{other_party['first_name']} {other_party['last_name']}" if other_party else "Unknown"
                
                # Iteration 4 - Safely get module field
                try:
                    module_value = msg["module"] if msg["module"] else ""
                except (KeyError, IndexError):
                    module_value = ""
                
                booking_groups[booking_id] = {
                    "booking_id": booking_id,
                    "session_date": msg["session_date"],
                    "session_time": msg["session_time"],
                    "status": msg["status"],
                    "module": module_value,
                    "other_party_name": other_party_name,
                    "messages": []
                }
            
            booking_groups[booking_id]["messages"].append({
                "message_id": msg["message_id"],
                "sender_id": msg["sender_id"],
                "sender_role": msg["sender_role"],
                "message_text": msg["message_text"],
                "read_at": msg["read_at"],
                "created_at": msg["created_at"]
            })
        
        # Convert to list
        result = list(booking_groups.values())
        
        print(f"[INFO] Returning {len(result)} message groups")
        return jsonify(result), 200
    except sqlite3.Error as e:
        print(f"[ERROR] Database error in get_user_messages: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        print(f"[ERROR] Unexpected error in get_user_messages: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# Iteration 4 - Get learner earnings
# ref: SQL JOIN - https://www.w3schools.com/sql/sql_join.asp
@app.route('/api/learners/<int:learner_id>/earnings', methods=['GET'])
def get_learner_earnings(learner_id):
    """
    Calculates and returns earnings for a learner.
    Earnings can come from completed sessions, referrals, credits, etc.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all completed bookings for this learner
        cursor.execute("""
            SELECT b.booking_id, b.session_date, b.session_time, b.duration, b.status, b.module,
                   t.first_name as tutor_first_name, t.last_name as tutor_last_name, t.hourly_rate
            FROM bookings b
            JOIN tutors t ON b.tutor_id = t.tutor_id
            WHERE b.learner_id = ? AND b.status = 'completed'
            ORDER BY b.session_date DESC, b.session_time DESC
        """, (learner_id,))
        
        completed_bookings = cursor.fetchall()
        
        # Calculate earnings
        total_earnings = 0.0
        total_sessions = len(completed_bookings)
        total_hours = 0.0
        earnings_breakdown = []
        
        for booking in completed_bookings:
            duration_minutes = booking["duration"] if booking["duration"] else 60
            duration_hours = duration_minutes / 60.0
            hourly_rate = booking["hourly_rate"] if booking["hourly_rate"] else 0.0
            
            # Iteration 4 - Calculate session cost (what learner paid)
            session_cost = duration_hours * hourly_rate
            
            # Iteration 4 - For now, earnings = 0 (can be extended with referral credits, cashback, etc.)
            # In a real system, learners might earn:
            # - Referral bonuses
            # - Cashback on sessions
            # - Credits for completed sessions
            session_earnings = 0.0  # Placeholder - can be extended later
            
            total_earnings += session_earnings
            total_hours += duration_hours
            
            # Safely get module
            try:
                module_value = booking["module"] if booking["module"] else ""
            except (KeyError, IndexError):
                module_value = ""
            
            earnings_breakdown.append({
                "booking_id": booking["booking_id"],
                "session_date": booking["session_date"],
                "session_time": booking["session_time"],
                "duration_hours": round(duration_hours, 2),
                "tutor_name": f"{booking['tutor_first_name']} {booking['tutor_last_name']}",
                "hourly_rate": hourly_rate,
                "session_cost": round(session_cost, 2),
                "earnings": round(session_earnings, 2),
                "module": module_value
            })
        
        # Get pending/confirmed bookings (potential future earnings)
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM bookings
            WHERE learner_id = ? AND status IN ('pending', 'confirmed', 'accepted')
        """, (learner_id,))
        pending_count = cursor.fetchone()["count"]
        
        result = {
            "learner_id": learner_id,
            "total_earnings": round(total_earnings, 2),
            "total_sessions_completed": total_sessions,
            "total_hours": round(total_hours, 2),
            "pending_sessions": pending_count,
            "earnings_breakdown": earnings_breakdown
        }
        
        return jsonify(result), 200
    except sqlite3.Error as e:
        print(f"[ERROR] Database error in get_learner_earnings: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        print(f"[ERROR] Unexpected error in get_learner_earnings: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# Iteration 4 - Get tutor earnings
# ref: Python datetime calculations - https://docs.python.org/3/library/datetime.html
@app.route('/api/tutors/<int:tutor_id>/earnings', methods=['GET'])
def get_tutor_earnings(tutor_id):
    """
    Calculates and returns earnings for a tutor.
    Earnings come from completed tutoring sessions.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get tutor's hourly rate
        cursor.execute("SELECT hourly_rate FROM tutors WHERE tutor_id = ?", (tutor_id,))
        tutor = cursor.fetchone()
        
        if not tutor:
            return jsonify({"error": "Tutor not found"}), 404
        
        hourly_rate = tutor["hourly_rate"] if tutor["hourly_rate"] else 0.0
        
        # Get all completed bookings for this tutor
        cursor.execute("""
            SELECT b.booking_id, b.session_date, b.session_time, b.duration, b.status, b.module,
                   s.first_name as learner_first_name, s.last_name as learner_last_name
            FROM bookings b
            JOIN students s ON b.learner_id = s.id
            WHERE b.tutor_id = ? AND b.status = 'completed'
            ORDER BY b.session_date DESC, b.session_time DESC
        """, (tutor_id,))
        
        completed_bookings = cursor.fetchall()
        
        # Calculate earnings
        total_earnings = 0.0
        total_sessions = len(completed_bookings)
        total_hours = 0.0
        earnings_breakdown = []
        
        for booking in completed_bookings:
            duration_minutes = booking["duration"] if booking["duration"] else 60
            duration_hours = duration_minutes / 60.0
            
            # Iteration 4 - Calculate session earnings (tutor earns based on hourly rate and duration)
            session_earnings = duration_hours * hourly_rate
            
            total_earnings += session_earnings
            total_hours += duration_hours
            
            # Safely get module
            try:
                module_value = booking["module"] if booking["module"] else ""
            except (KeyError, IndexError):
                module_value = ""
            
            earnings_breakdown.append({
                "booking_id": booking["booking_id"],
                "session_date": booking["session_date"],
                "session_time": booking["session_time"],
                "duration_hours": round(duration_hours, 2),
                "learner_name": f"{booking['learner_first_name']} {booking['learner_last_name']}",
                "hourly_rate": hourly_rate,
                "earnings": round(session_earnings, 2),
                "module": module_value
            })
        
        # Get pending/confirmed bookings (potential future earnings)
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM bookings
            WHERE tutor_id = ? AND status IN ('pending', 'confirmed', 'accepted')
        """, (tutor_id,))
        pending_count = cursor.fetchone()["count"]
        
        result = {
            "tutor_id": tutor_id,
            "hourly_rate": hourly_rate,
            "total_earnings": round(total_earnings, 2),
            "total_sessions_completed": total_sessions,
            "total_hours": round(total_hours, 2),
            "pending_sessions": pending_count,
            "earnings_breakdown": earnings_breakdown
        }
        
        return jsonify(result), 200
    except sqlite3.Error as e:
        print(f"[ERROR] Database error in get_tutor_earnings: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        print(f"[ERROR] Unexpected error in get_tutor_earnings: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

# Iteration 4 - Mark message as read
# ChatGPT conversation reference: https://chatgpt.com/share/6984af21-d9ac-8008-a016-f00a20286dd1
@app.route('/api/messages/<int:message_id>/read', methods=['PUT'])
def mark_message_read(message_id):
    """
    Marks a message as read by setting read_at timestamp.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if message exists
        cursor.execute("SELECT * FROM messages WHERE message_id = ?", (message_id,))
        message = cursor.fetchone()
        
        if not message:
            return jsonify({"error": "Message not found"}), 404
        
        # Update read_at timestamp
        cursor.execute("""
            UPDATE messages 
            SET read_at = ?
            WHERE message_id = ?
        """, (datetime.now(), message_id))
        
        conn.commit()
        return jsonify({"message": "Message marked as read", "message_id": message_id}), 200
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

###################
###################
# End Iteration 4 - Tutor Availability, Booking Confirmation, and Messaging
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
        
        # Iteration 4 - Check if account is active
        # sqlite3.Row doesn't support .get(), so use try/except or direct access
        try:
            is_active = user["is_active"]
        except (KeyError, IndexError):
            # Handle legacy accounts (set to active by default if column doesn't exist)
            is_active = 1
        
        if is_active is None:
            # Handle legacy accounts (set to active by default)
            is_active = 1
        if is_active == 0:
            return jsonify({"error": "Your account has been deactivated. Please contact an administrator."}), 403
        
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

# Iteration 4 - API Test Endpoints
@app.route('/api/test/timezone', methods=['GET'])
def test_timezone_api():
    """Test endpoint for timezone API"""
    # Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
    try:
        from api_integrations import get_timezone_info
        result = get_timezone_info()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/test/email', methods=['POST'])
def test_email_api():
    """Test endpoint for email API (requires SendGrid setup)"""
    # Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
    try:
        from api_integrations import send_booking_confirmation_email
        data = request.get_json()
        
        # Test with sample data
        result = send_booking_confirmation_email(
            data.get('learner_email', 'test@example.com'),
            data.get('tutor_email', 'tutor@example.com'),
            data.get('learner_name', 'Test Learner'),
            data.get('tutor_name', 'Test Tutor'),
            {
                'session_date': data.get('session_date', '2024-01-01'),
                'session_time': data.get('session_time', '10:00'),
                'duration': data.get('duration', 60)
            }
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/test/google-calendar', methods=['GET'])
def test_google_calendar_api():
    """Test endpoint for Google Calendar API - checks if it's configured"""
    # Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
    try:
        from config import ENABLE_GOOGLE_CALENDAR, GOOGLE_CALENDAR_CREDENTIALS_FILE
        from pathlib import Path
        import os
        
        BASE_DIR = Path(__file__).resolve().parent
        credentials_path = BASE_DIR / GOOGLE_CALENDAR_CREDENTIALS_FILE
        
        status = {
            "enabled": ENABLE_GOOGLE_CALENDAR,
            "credentials_file_exists": credentials_path.exists(),
            "credentials_file_path": str(credentials_path),
            "dependencies_installed": False
        }
        
        # Check if dependencies are installed
        try:
            import google.auth.transport.requests
            import google.oauth2.credentials
            import google_auth_oauthlib.flow
            import googleapiclient.discovery
            status["dependencies_installed"] = True
        except ImportError as e:
            status["dependencies_error"] = str(e)
        
        if not ENABLE_GOOGLE_CALENDAR:
            status["message"] = "Google Calendar API is disabled in config.py"
        elif not credentials_path.exists():
            status["message"] = f"credentials.json not found at {credentials_path}. See API_SETUP.md for setup instructions."
        elif not status["dependencies_installed"]:
            status["message"] = "Google Calendar dependencies not installed. Run: pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib"
        else:
            status["message"] = "Google Calendar API is ready! Try creating a booking to test it."
        
        return jsonify(status), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# RUN LOCALLY PORT 5000
#app entry point
if __name__ == '__main__':
    print("=" * 50)
    print("Starting Flask server...")
    print("Server will be available at: http://127.0.0.1:5000")
    print("Health check: http://127.0.0.1:5000/api/health")
    print("=" * 50)
    app.run(debug=True, port=5000, host='127.0.0.1')
