# import libraries
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

#create flask instance
app = Flask(__name__)

#enable cors to allow frontend and backend to communicate
CORS(app)


#connect to DB
def get_db_connection():
    conn = sqlite3.connect('fyp_tutoring.db')
    conn.row_factory = sqlite3.Row
    return conn

#confirm if working
@app.route('/')
def home():
    return "Appear if api works and DB connects!"

#add student
@app.route('/students', methods=['POST'])
def add_student():
    data = request.get_json() #recieve json data from react
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    college_email = data.get('college_email')

#conn to db and add new student
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO students (first_name, last_name, college_email) VALUES (?, ?, ?)",
        (first_name, last_name, college_email)
    )
    conn.commit()
    conn.close()
#send confurmation back to front
    return jsonify({"message": "Student added successfully!"}), 201

@app.route('/students', methods=['GET'])
def get_students():
    conn = get_db_connection()
    students = conn.execute('SELECT * FROM students').fetchall()
    conn.close()
    #returns db rows to dictionary as JSON
    return jsonify([dict(row) for row in students])

# Update a student
@app.route('/students/<int:id>', methods=['PUT'])
def update_student(id):
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    college_email = data.get('college_email')

    conn = get_db_connection()
    conn.execute(
        "UPDATE students SET first_name = ?, last_name = ?, college_email = ? WHERE id = ?",
        (first_name, last_name, college_email, id)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Student updated successfully!"})


# Delete a student
@app.route('/students/<int:id>', methods=['DELETE'])
def delete_student(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM students WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "  Student deleted successfully!"})

#run locallly on 5000
if __name__ == '__main__':
    app.run(debug=True, port=5000)
