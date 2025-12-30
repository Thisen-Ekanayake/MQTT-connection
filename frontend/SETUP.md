# Frontend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Development Mode**
   ```bash
   npm run dev
   ```
   Access at: http://localhost:5173

3. **Production Build**
   ```bash
   npm run build
   ```
   This creates a `dist/` folder with the production build.

4. **Run with Backend**
   After building, start the backend server:
   ```bash
   cd ../backend
   npm start
   ```
   The React app will be served at: http://localhost:3000

## Development vs Production

### Development
- Uses Vite dev server (port 5173)
- Hot module replacement (HMR)
- API requests proxied to backend (port 3000)
- Source maps enabled

### Production
- Optimized build in `dist/` folder
- Served by backend Express server
- All routes handled by React Router
- Static assets optimized

## Troubleshooting

### Build Fails
- Check Node.js version (requires v16+)
- Delete `node_modules` and `package-lock.json`, then `npm install` again
- Check for TypeScript errors (if using TypeScript)

### MQTT Not Connecting
- Verify MQTT broker URL in `src/hooks/useMQTT.js`
- Check browser console for WebSocket errors
- Ensure broker allows WebSocket connections

### API Requests Failing
- Verify backend is running on port 3000
- Check `vite.config.js` proxy configuration
- Check browser network tab for CORS errors

### Routes Not Working
- Ensure backend serves `index.html` for all non-API routes
- Check React Router configuration in `src/App.jsx`
- Verify build output includes `index.html`

