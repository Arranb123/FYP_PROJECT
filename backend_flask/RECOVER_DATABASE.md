# Database Recovery Instructions

If you're getting "database disk image is malformed" error:

## Option 1: Delete and Recreate (Loses all data)
1. Stop the Flask server (Ctrl+C)
2. Delete the database file: `fyp_tutoring.db`
3. Restart Flask - it will create a fresh database automatically

## Option 2: Try to Recover (Keep existing data)
1. Stop the Flask server
2. Run: `sqlite3 fyp_tutoring.db ".recover" | sqlite3 fyp_tutoring_recovered.db`
3. If recovery works, replace the old file with the recovered one

## Option 3: Backup and Start Fresh
1. Stop the Flask server
2. Backup: `cp fyp_tutoring.db fyp_tutoring.db.backup`
3. Delete: `rm fyp_tutoring.db` (or delete it manually)
4. Restart Flask - new database will be created

The app will automatically create all tables with the correct schema when it starts.
