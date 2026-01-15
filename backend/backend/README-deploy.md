# Deploy Instructions

## Status
- ✅ Frontend build integrated in `dist/` folder
- ✅ Express configured to serve SPA
- ✅ Package.json scripts updated
- ✅ Backend compiled and ready

## Current Issue
Railway is still running the old version without SPA configuration.

## Solution
Force a new deploy by:
1. Making a commit to trigger auto-deploy OR
2. Manual deploy from Railway dashboard

## Test URLs After Deploy
- / → Should serve React app
- /login → Should serve React app  
- /api/health → Should serve backend API