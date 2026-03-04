# StudyHive — Frontend

This is the React frontend for StudyHive, a peer-to-peer tutoring platform.

Built with Create React App and Material UI. Communicates with the Flask backend via REST API calls using Axios.

## Running Locally

```bash
npm install
npm start
```

Opens at `http://localhost:3000`. The backend must be running at `http://localhost:5000` for API calls to work.

## Building for Production

```bash
npm run build
```

Outputs a production-ready build to the `build/` folder. This is what gets deployed to Vercel.

## Deployment

The frontend is deployed on Vercel. Any push to the main branch on GitHub triggers an automatic redeploy.

See the root [README.md](../README.md) for full project setup instructions.
