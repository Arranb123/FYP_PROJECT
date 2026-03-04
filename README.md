# StudyHive

StudyHive is a peer-to-peer tutoring web application built as my Final Year Project. It connects learners with student tutors at University College Cork, allowing learners to browse tutor profiles, book sessions, leave reviews, and message tutors directly through the platform.

The idea came from the lack of a centralised, easy-to-use platform for student-to-student tutoring at UCC. Most alternatives like Superprof or Chegg are paid, commercial services — StudyHive is built specifically for students.

---

## Live Demo

The app is deployed and accessible at:

- **Frontend (Vercel):** https://your-vercel-url.vercel.app
- **Backend (Render):** https://your-render-url.onrender.com

---

## Features

- Register and log in as a learner or tutor
- Tutors submit a profile (subject, hourly rate, bio) and wait for admin approval
- Learners can browse approved tutors and filter by subject
- Learners can book a session with a tutor, specifying date, time, and duration
- Tutors can accept or reject bookings from their dashboard
- Both users receive email notifications when a booking is made or accepted
- Google Calendar event is created automatically when a booking is confirmed
- Learners can leave a star rating and written review after a session
- Built-in messaging system between learners and tutors
- Admin dashboard to approve/reject tutors and manage all users and bookings
- Timezone detection using WorldTimeAPI

---

## Tech Stack

**Frontend**
- React (Create React App)
- Material UI (MUI) for components and styling
- React Router for page navigation
- Axios for API requests

**Backend**
- Python / Flask
- Flask-CORS for cross-origin requests
- psycopg2 for PostgreSQL connectivity
- SHA-256 password hashing (no third-party auth library)

**Database**
- PostgreSQL (hosted on Render)

**External APIs**
- SendGrid — booking confirmation emails
- Google Calendar API — automatic calendar events on booking confirmation
- WorldTimeAPI — timezone detection (free, no API key required)

**Deployment**
- Frontend → Vercel
- Backend + Database → Render

---

## Project Structure

```
FYP_Project/
├── frontend/                  # React app
│   ├── public/
│   └── src/
│       ├── components/        # All page components
│       │   ├── LandingPage.js
│       │   ├── LoginPage.js
│       │   ├── RegisterPage.js
│       │   ├── TutorList.js
│       │   ├── TutorProfile.js
│       │   ├── BookingForm.js
│       │   ├── LearnerBookings.js
│       │   ├── TutorBookings.js
│       │   ├── ReviewForm.js
│       │   ├── Messages.js
│       │   └── AdminDashboard.js
│       └── App.js
│
└── backend_flask/             # Flask API
    ├── app.py                 # All routes and database logic
    ├── api_integrations.py    # Google Calendar, email, timezone helpers
    ├── config.py              # API keys and feature flags (loaded from .env)
    ├── requirements.txt
    └── .env                   # API keys — not committed to git
```

---

## Prerequisites

Make sure you have the following installed:

- Node.js (v18 or higher)
- Python 3.10+
- pip
- A PostgreSQL database (local or hosted)

---

## Setup — Backend

1. Navigate to the backend directory:

```bash
cd backend_flask
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the `backend_flask/` folder with the following:

```env
DATABASE_URL=postgresql://username:password@host:port/dbname

SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender@email.com

ENABLE_GOOGLE_CALENDAR=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_TIMEZONE_API=true
```

5. Run the Flask server:

```bash
python app.py
```

The backend will start at `http://localhost:5000`.

---

## Setup — Frontend

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The app will open at `http://localhost:3000`.

---

## Google Calendar Setup (Optional)

To enable automatic calendar events on booking confirmation:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable the Google Calendar API
3. Create OAuth 2.0 credentials and download `credentials.json`
4. Place `credentials.json` in the `backend_flask/` folder
5. On first run, a browser window will open asking you to authorise the app — after that a `token.json` is saved automatically

If you don't set this up, the booking system still works fine — calendar events are just skipped.

---

## Database

The app uses PostgreSQL. On first run, Flask automatically creates all the required tables if they don't exist. There is no migration step needed.

Tables created:
- `users` — login credentials and role (learner/tutor/admin)
- `students` — learner profile info
- `tutors` — tutor profile info, approval status
- `bookings` — session bookings between learner and tutor
- `reviews` — ratings and comments on completed sessions
- `tutor_availability` — days and times a tutor is available
- `messages` — direct messages between users

---

## Environment Variables Reference

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SENDGRID_API_KEY` | SendGrid API key for emails | No |
| `SENDGRID_FROM_EMAIL` | Verified sender email address | No |
| `ENABLE_GOOGLE_CALENDAR` | Enable/disable calendar events | No |
| `ENABLE_EMAIL_NOTIFICATIONS` | Enable/disable email sending | No |
| `ENABLE_TIMEZONE_API` | Enable/disable timezone detection | No |

---

## Known Limitations

- Password reset functionality is not implemented — users cannot recover a forgotten password
- No real-time notifications — the app requires a page refresh to see new messages or booking updates
- Google Calendar integration requires manual OAuth authorisation on first run, which is not suitable for a fully automated deployment
- The messaging system has no read receipts beyond a basic `is_read` flag

---

## Development Notes

The project was developed iteratively across 6 iterations:

1. Project setup, basic React structure, Flask skeleton
2. User registration and login, role-based routing
3. Tutor profiles, learner browse and search
4. Booking system, availability, admin dashboard
5. Reviews, messaging between users
6. PostgreSQL migration (from SQLite), email notifications, Google Calendar, timezone API, deployment to Vercel and Render

---

## Acknowledgements

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Material UI](https://mui.com/)
- [Google Calendar API Docs](https://developers.google.com/calendar/api)
- [SendGrid Docs](https://docs.sendgrid.com/)
- [WorldTimeAPI](https://worldtimeapi.org/)
- [psycopg2 Documentation](https://www.psycopg.org/docs/)
