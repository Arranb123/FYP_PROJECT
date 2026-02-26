# API integrations helper functions
# Iteration 4 - External API Integrations
# ChatGPT conversation reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951

import os
import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from pathlib import Path
import requests
from config import (
    ENABLE_GOOGLE_CALENDAR,
    ENABLE_EMAIL_NOTIFICATIONS,
    ENABLE_TIMEZONE_API,
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL,
    GMAIL_USER,
    GMAIL_APP_PASSWORD,
    GOOGLE_CALENDAR_CREDENTIALS_FILE,
    GOOGLE_CALENDAR_TOKEN_FILE,
    ENABLE_TEAMS_MEETINGS,
    TEAMS_CLIENT_ID,
    TEAMS_CLIENT_SECRET,
    TEAMS_TENANT_ID,
    TEAMS_ORGANIZER_USER_ID,
)

###################
# GOOGLE CALENDAR API
# Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
###################

def create_google_calendar_event(booking_data, learner_email, tutor_email, learner_name, tutor_name):
    # Creates a Google Calendar event for a booking
    # Returns dict with success status and event details or error message
    if not ENABLE_GOOGLE_CALENDAR:
        return {"success": False, "message": "Google Calendar API is disabled"}
    
    try:
        from google.auth.transport.requests import Request
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build
        import pickle
        
        # Google Calendar API scopes
        SCOPES = ['https://www.googleapis.com/auth/calendar']
        
        creds = None
        BASE_DIR = Path(__file__).resolve().parent
        
        # Check if token.json exists (user has already authorized)
        token_path = BASE_DIR / GOOGLE_CALENDAR_TOKEN_FILE
        if token_path.exists():
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        
        # If there are no valid credentials, prompt user to log in
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                credentials_path = BASE_DIR / GOOGLE_CALENDAR_CREDENTIALS_FILE
                if not credentials_path.exists():
                    return {
                        "success": False,
                        "message": "Google Calendar credentials not found. Please set up credentials.json"
                    }
                flow = InstalledAppFlow.from_client_secrets_file(
                    str(credentials_path), SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save credentials for next time
            with open(token_path, 'w') as token:
                token.write(creds.to_json())
        
        # Build the Calendar service
        service = build('calendar', 'v3', credentials=creds)
        
        # Iteration 4 - Log calendar event creation
        print(f"[INFO] Creating calendar event in Google Calendar")
        
        # Parse date and time
        session_date = booking_data.get('session_date')
        session_time = booking_data.get('session_time')
        duration = booking_data.get('duration', 60)
        
        # Combine date and time
        datetime_str = f"{session_date} {session_time}"
        try:
            start_datetime = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
        except ValueError:
            start_datetime = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M:%S")
        
        end_datetime = start_datetime + timedelta(minutes=duration)
        
        # Create event
        event = {
            'summary': f'Tutoring Session: {learner_name} with {tutor_name}',
            'description': f'Tutoring session between {learner_name} and {tutor_name}.\nDuration: {duration} minutes',
            'start': {
                'dateTime': start_datetime.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_datetime.isoformat(),
                'timeZone': 'UTC',
            },
            'attendees': [
                {'email': learner_email},
                {'email': tutor_email},
            ],
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                    {'method': 'popup', 'minutes': 30},  # 30 minutes before
                ],
            },
        }
        
        # Insert event
        event = service.events().insert(calendarId='primary', body=event).execute()
        
        return {
            "success": True,
            "message": "Event created successfully",
            "event_id": event.get('id'),
            "event_link": event.get('htmlLink')
        }
    
    except Exception as e:
        pass
        return {
            "success": False,
            "message": f"Failed to create calendar event: {str(e)}"
        }


###################
# EMAIL API (Gmail SMTP)
# Iteration 8 - Switched from SendGrid to Gmail SMTP to avoid sender deferral issues
# Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
###################

def _send_gmail(to_email, subject, html_content):
    # Helper: sends a single HTML email via Gmail SMTP using App Password
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"StudyHive <{GMAIL_USER}>"
    msg['To'] = to_email
    msg.attach(MIMEText(html_content, 'html'))
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, to_email, msg.as_string())


def send_booking_confirmation_email(learner_email, tutor_email, learner_name, tutor_name, booking_data):
    # Sends booking confirmation emails to both learner and tutor
    # Returns dict with success status and message
    if not ENABLE_EMAIL_NOTIFICATIONS:
        return {"success": False, "message": "Email notifications are disabled"}

    if not GMAIL_APP_PASSWORD:
        return {"success": False, "message": "Gmail App Password not configured"}

    try:
        session_date = booking_data.get('session_date')
        session_time = booking_data.get('session_time')
        duration = booking_data.get('duration', 60)

        learner_subject = f"Booking Confirmed: Tutoring Session with {tutor_name}"
        learner_content = f"""
        <html>
        <body>
            <h2>Booking Confirmation</h2>
            <p>Hello {learner_name},</p>
            <p>Your tutoring session has been confirmed!</p>
            <p><strong>Details:</strong></p>
            <ul>
                <li><strong>Tutor:</strong> {tutor_name}</li>
                <li><strong>Date:</strong> {session_date}</li>
                <li><strong>Time:</strong> {session_time}</li>
                <li><strong>Duration:</strong> {duration} minutes</li>
            </ul>
            <p>We look forward to your session!</p>
            <p>Best regards,<br>StudyHive Team</p>
        </body>
        </html>
        """

        tutor_subject = f"New Booking: Tutoring Session with {learner_name}"
        tutor_content = f"""
        <html>
        <body>
            <h2>New Booking Received</h2>
            <p>Hello {tutor_name},</p>
            <p>You have a new tutoring session booking!</p>
            <p><strong>Details:</strong></p>
            <ul>
                <li><strong>Learner:</strong> {learner_name}</li>
                <li><strong>Date:</strong> {session_date}</li>
                <li><strong>Time:</strong> {session_time}</li>
                <li><strong>Duration:</strong> {duration} minutes</li>
            </ul>
            <p>Please confirm your availability.</p>
            <p>Best regards,<br>StudyHive Team</p>
        </body>
        </html>
        """

        print(f"[INFO] Attempting to send emails to learner ({learner_email}) and tutor ({tutor_email})")
        _send_gmail(learner_email, learner_subject, learner_content)
        _send_gmail(tutor_email, tutor_subject, tutor_content)
        print(f"[SUCCESS] Emails sent successfully via Gmail SMTP")

        return {"success": True, "message": "Confirmation emails sent successfully"}

    except Exception as e:
        return {"success": False, "message": f"Failed to send emails: {str(e)}"}


###################
# TIMEZONE API
# Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
###################

def get_timezone_info(latitude=None, longitude=None, timezone_name=None):
    # Gets timezone info using WorldTimeAPI (free, no API key needed)
    # Returns dict with timezone information
    if not ENABLE_TIMEZONE_API:
        return {"success": False, "message": "Timezone API is disabled"}
    
    try:
        if timezone_name:
            # Get timezone by name
            url = f"http://worldtimeapi.org/api/timezone/{timezone_name}"
        elif latitude and longitude:
            # Get timezone by coordinates
            url = f"http://worldtimeapi.org/api/timezone/{latitude},{longitude}"
        else:
            # Get IP-based timezone (default)
            url = "http://worldtimeapi.org/api/ip"
        
        # Iteration 4 - Increased timeout and better error handling for timezone API
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        return {
            "success": True,
            "timezone": data.get('timezone'),
            "datetime": data.get('datetime'),
            "utc_offset": data.get('utc_offset'),
            "day_of_week": data.get('day_of_week'),
            "day_of_year": data.get('day_of_year')
        }
    
    except requests.exceptions.Timeout:
        print(f"[WARNING] Timezone API timeout - service may be slow")
        return {
            "success": False,
            "message": "Timezone information unavailable (service timeout)"
        }
    except requests.exceptions.ConnectionError as e:
        print(f"[WARNING] Timezone API connection error: {e}")
        return {
            "success": False,
            "message": "Timezone information unavailable (connection issue)"
        }
    except Exception as e:
        print(f"[WARNING] Timezone API error: {e}")
        return {
            "success": False,
            "message": "Timezone information unavailable"
        }


def convert_to_utc(local_datetime, timezone_name):
    # Converts local datetime to UTC using timezone info
    # Returns UTC datetime object
    try:
        import pytz
        local_tz = pytz.timezone(timezone_name)
        local_dt = local_tz.localize(local_datetime)
        utc_dt = local_dt.astimezone(pytz.UTC)
        return utc_dt
    except Exception as e:
        print(f"[ERROR] Timezone conversion error: {e}")
        return local_datetime  # Return original if conversion fails


###################
# WEATHER API (Bonus - OpenWeatherMap)
###################

###################
# MICROSOFT TEAMS API (Microsoft Graph)
# Iteration 7 - Creates a Teams online meeting when a booking is accepted
# Reference: https://learn.microsoft.com/en-us/graph/api/application-post-onlinemeetings
###################

def create_teams_meeting(subject, start_datetime, end_datetime):
    # Creates a Microsoft Teams online meeting via Microsoft Graph API
    # Returns dict with success status, join_url, and message
    if not ENABLE_TEAMS_MEETINGS:
        return {"success": False, "message": "Teams meetings are disabled"}

    if not all([TEAMS_CLIENT_ID, TEAMS_CLIENT_SECRET, TEAMS_TENANT_ID, TEAMS_ORGANIZER_USER_ID]):
        return {"success": False, "message": "Teams credentials not fully configured"}

    try:
        import msal

        authority = f"https://login.microsoftonline.com/{TEAMS_TENANT_ID}"
        app = msal.ConfidentialClientApplication(
            TEAMS_CLIENT_ID,
            authority=authority,
            client_credential=TEAMS_CLIENT_SECRET,
        )

        token_response = app.acquire_token_for_client(
            scopes=["https://graph.microsoft.com/.default"]
        )

        if "access_token" not in token_response:
            error_desc = token_response.get("error_description", "Unknown error")
            return {"success": False, "message": f"Failed to get Teams access token: {error_desc}"}

        headers = {
            "Authorization": f"Bearer {token_response['access_token']}",
            "Content-Type": "application/json",
        }

        meeting_body = {
            "subject": subject,
            "startDateTime": start_datetime.strftime("%Y-%m-%dT%H:%M:%S") + "Z",
            "endDateTime": end_datetime.strftime("%Y-%m-%dT%H:%M:%S") + "Z",
        }

        response = requests.post(
            f"https://graph.microsoft.com/v1.0/users/{TEAMS_ORGANIZER_USER_ID}/onlineMeetings",
            headers=headers,
            json=meeting_body,
            timeout=15,
        )

        if response.status_code in (200, 201):
            data = response.json()
            join_url = data.get("joinWebUrl")
            print(f"[SUCCESS] Teams meeting created: {join_url}")
            return {"success": True, "join_url": join_url, "message": "Teams meeting created successfully"}
        else:
            error_text = response.text
            print(f"[WARNING] Teams API returned {response.status_code}: {error_text}")
            return {"success": False, "message": f"Teams API error {response.status_code}: {error_text}"}

    except Exception as e:
        print(f"[WARNING] Teams meeting creation failed: {e}")
        return {"success": False, "message": f"Failed to create Teams meeting: {str(e)}"}


def send_booking_accepted_email(learner_email, tutor_email, learner_name, tutor_name, booking_data, meeting_url=None):
    # Sends acceptance confirmation emails to both learner and tutor
    # Includes Teams meeting link if one was generated
    # Returns dict with success status and message
    if not ENABLE_EMAIL_NOTIFICATIONS:
        return {"success": False, "message": "Email notifications are disabled"}

    if not GMAIL_APP_PASSWORD:
        return {"success": False, "message": "Gmail App Password not configured"}

    try:
        session_date = booking_data.get('session_date')
        session_time = booking_data.get('session_time')
        duration = booking_data.get('duration', 60)
        module = booking_data.get('module', '')

        meeting_section = ""
        if meeting_url:
            meeting_section = f"""
            <div style="margin: 20px 0; padding: 15px; background-color: #e8f0fe; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 10px 0; font-weight: bold;">Your Teams Meeting Link</p>
                <a href="{meeting_url}"
                   style="display: inline-block; padding: 12px 24px; background-color: #6264a7; color: white;
                          text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Join Teams Meeting
                </a>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #555;">
                    Or copy this link: {meeting_url}
                </p>
            </div>
            """

        module_line = f"<li><strong>Module:</strong> {module}</li>" if module else ""

        learner_content = f"""
        <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4a90d9; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">StudyHive</h1>
            </div>
            <div style="padding: 20px;">
                <h2>Your Booking Has Been Confirmed!</h2>
                <p>Hello {learner_name},</p>
                <p>Great news! Your tutor <strong>{tutor_name}</strong> has accepted your booking.</p>
                <p><strong>Session Details:</strong></p>
                <ul>
                    <li><strong>Tutor:</strong> {tutor_name}</li>
                    <li><strong>Date:</strong> {session_date}</li>
                    <li><strong>Time:</strong> {session_time}</li>
                    <li><strong>Duration:</strong> {duration} minutes</li>
                    {module_line}
                </ul>
                {meeting_section}
                <p>Best regards,<br>StudyHive Team</p>
            </div>
        </body></html>
        """

        tutor_content = f"""
        <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4a90d9; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">StudyHive</h1>
            </div>
            <div style="padding: 20px;">
                <h2>Booking Accepted</h2>
                <p>Hello {tutor_name},</p>
                <p>You have accepted a tutoring session with <strong>{learner_name}</strong>.</p>
                <p><strong>Session Details:</strong></p>
                <ul>
                    <li><strong>Learner:</strong> {learner_name}</li>
                    <li><strong>Date:</strong> {session_date}</li>
                    <li><strong>Time:</strong> {session_time}</li>
                    <li><strong>Duration:</strong> {duration} minutes</li>
                    {module_line}
                </ul>
                {meeting_section}
                <p>Best regards,<br>StudyHive Team</p>
            </div>
        </body></html>
        """

        print(f"[INFO] Sending acceptance emails to {learner_email} and {tutor_email}")
        _send_gmail(learner_email, f"Booking Confirmed: Session with {tutor_name}", learner_content)
        _send_gmail(tutor_email, f"Booking Accepted: Session with {learner_name}", tutor_content)
        print(f"[SUCCESS] Acceptance emails sent via Gmail SMTP")

        return {"success": True, "message": "Acceptance emails sent successfully"}

    except Exception as e:
        return {"success": False, "message": f"Failed to send acceptance emails: {str(e)}"}


def get_weather_info(city_name, api_key=None):
    # Gets weather info for a city using OpenWeatherMap API
    # Optional feature - can be used to show weather on booking day
    # Returns dict with weather information
    if not api_key:
        return {"success": False, "message": "Weather API key not provided"}
    
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather"
        params = {
            'q': city_name,
            'appid': api_key,
            'units': 'metric'
        }
        
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        return {
            "success": True,
            "city": data.get('name'),
            "temperature": data.get('main', {}).get('temp'),
            "description": data.get('weather', [{}])[0].get('description'),
            "humidity": data.get('main', {}).get('humidity'),
            "wind_speed": data.get('wind', {}).get('speed')
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to get weather info: {str(e)}"
        }
