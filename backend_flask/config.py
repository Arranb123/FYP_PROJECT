# API Configuration File
# Store your API keys here
# IMPORTANT: Add this file to .gitignore to keep your keys secure!

import os
from pathlib import Path

# Load .env file from backend_flask directory (keeps API keys out of code)
_env_path = Path(__file__).resolve().parent / ".env"
if _env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(_env_path)

# Google Calendar API Configuration
# Get your credentials from: https://console.cloud.google.com/
# 1. Create a new project
# 2. Enable Google Calendar API
# 3. Create OAuth 2.0 credentials
# 4. Download credentials.json and place it in backend_flask/
# Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
GOOGLE_CALENDAR_CREDENTIALS_FILE = os.getenv('GOOGLE_CALENDAR_CREDENTIALS', 'credentials.json')
GOOGLE_CALENDAR_TOKEN_FILE = os.getenv('GOOGLE_CALENDAR_TOKEN', 'token.json')

# SendGrid Email API Configuration
# Get your API key from: https://app.sendgrid.com/settings/api_keys
# Free tier: 100 emails/day
# Iteration 4 - SendGrid API key configured
# Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY', 'YOUR_SENDGRID_API_KEY_HERE')
SENDGRID_FROM_EMAIL = os.getenv('SENDGRID_FROM_EMAIL', '122375536@umail.ucc.ie')  # Iteration 4 - Verified sender email

# Timezone API Configuration
# Using free API: https://timezoneapi.io/ (free tier available)
# Alternative: WorldTimeAPI (completely free, no key needed)
# Reference: https://chatgpt.com/share/6984a96d-f0cc-8008-abdc-dc3fe4261951
TIMEZONE_API_ENABLED = True

# Feature flags - enable/disable APIs
# Set to True to enable, False to disable
# You can also use environment variables: export ENABLE_GOOGLE_CALENDAR=true
ENABLE_GOOGLE_CALENDAR = os.getenv('ENABLE_GOOGLE_CALENDAR', 'true').lower() == 'true'  # Enabled by default
ENABLE_EMAIL_NOTIFICATIONS = os.getenv('ENABLE_EMAIL_NOTIFICATIONS', 'true').lower() == 'true'  # Iteration 4 - Email notifications enabled
ENABLE_TIMEZONE_API = os.getenv('ENABLE_TIMEZONE_API', 'true').lower() == 'true'

# Auto-disable email notifications if API key is not set
if not SENDGRID_API_KEY and ENABLE_EMAIL_NOTIFICATIONS:
    print("[WARNING] SendGrid API key not found. Email notifications disabled.")
    ENABLE_EMAIL_NOTIFICATIONS = False
