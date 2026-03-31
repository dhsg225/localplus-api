# LocalPlus API - GCF Migration Guide

## Status: In Progress

**Completed:**
- ✅ GCF structure created
- ✅ Auth function converted
- ✅ Master deployment script created

**Remaining:**
- [ ] Convert 10 more functions
- [ ] Set up API Gateway
- [ ] Test all endpoints
- [ ] Update DNS

## Quick Conversion Pattern

### Step 1: Copy route file
```bash
cp ../events/route.js events/index.js
```

### Step 2: Convert module.exports to exports.functionName
```javascript
// Change from:
module.exports = async (req, res) => { ... }

// To:
exports.events = async (req, res) => { ... }
```

### Step 3: Update CORS headers
```javascript
// Change from:
res.setHeader('Access-Control-Allow-Origin', '*');

// To:
res.set('Access-Control-Allow-Origin', '*');
```

### Step 4: Create package.json
```json
{
  "name": "localplus-api-[function-name]",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "@supabase/supabase-js": "^2.86.0"
  },
  "engines": {
    "node": "20"
  }
}
```

### Step 5: Create deploy.sh
Copy from `auth/deploy.sh` and update:
- Function name
- Entry point name
- Environment variables

## Functions to Convert

1. ✅ auth
2. [ ] bookings
3. [ ] bookings-id (combines confirm/cancel)
4. [ ] restaurants
5. [ ] restaurants-search
6. [ ] businesses
7. [ ] notifications
8. [ ] events
9. [ ] events-all
10. [ ] events-id
11. [ ] events-participants

## Special Cases

### bookings-id
- Combines: bookings/[id]/route.js + confirm + cancel
- Uses URL detection for confirm/cancel actions

### events-all
- Requires utils/rbac.js
- Copy utils directory to function folder

### events-id and events-participants
- Also require utils/rbac.js

## Testing

After conversion, test each function:
```bash
cd [function-name]
npm install
./deploy.sh
```

Then test endpoint:
```bash
curl https://[region]-[project].cloudfunctions.net/[function-name]
```

