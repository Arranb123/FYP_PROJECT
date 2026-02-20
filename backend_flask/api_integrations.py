# API integrations helper functions
# Iteration 4 - External API Integrations
# ChatGPT conversation reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951

import os
import json
from datetime import datetime, timedelta
from pathlib import Path
import requests
from config import (
    ENABLE_GOOGLE_CALENDAR,
    ENABLE_EMAIL_NOTIFICATIONS,
    ENABLE_TIMEZONE_API,
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL,
    GOOGLE_CALENDAR_CREDENTIALS_FILE,
    GOOGLE_CALENDAR_TOKEN_FILE
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
# EMAIL API (SendGrid)
# Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
###################

def send_booking_confirmation_email(learner_email, tutor_email, learner_name, tutor_name, booking_data):
    # Sends booking confirmation emails to both learner and tutor
    # Returns dict with success status and message
    if not ENABLE_EMAIL_NOTIFICATIONS:
        return {"success": False, "message": "Email notifications are disabled"}
    
    if not SENDGRID_API_KEY:
        return {"success": False, "message": "SendGrid API key not configured"}
    
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        
        session_date = booking_data.get('session_date')
        session_time = booking_data.get('session_time')
        duration = booking_data.get('duration', 60)
        
        # Email to learner
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
        
        # Email to tutor
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
        
        # Send email to learner
        message_learner = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=learner_email,
            subject=learner_subject,
            html_content=learner_content
        )
        
        # Send email to tutor
        message_tutor = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=tutor_email,
            subject=tutor_subject,
            html_content=tutor_content
        )
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        
        # Iteration 4 - Send both emails with logging
        print(f"[INFO] Attempting to send emails to learner ({learner_email}) and tutor ({tutor_email})")
        response_learner = sg.send(message_learner)
        response_tutor = sg.send(message_tutor)
        
        print(f"[SUCCESS] Emails sent successfully - Learner status: {response_learner.status_code}, Tutor status: {response_tutor.status_code}")
        
        return {
            "success": True,
            "message": "Confirmation emails sent successfully",
            "learner_status": response_learner.status_code,
            "tutor_status": response_tutor.status_code
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to send emails: {str(e)}"
        }


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
