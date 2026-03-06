# School Fees Management — Backend API

Node.js · Express · MongoDB · JWT · Railway

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login → returns JWT token |
| POST | /api/auth/change-password | Change own password |
| GET/POST | /api/auth/users | List / create users (master) |
| PATCH/DELETE | /api/auth/users/:username | Update / delete user (master) |
| GET/POST | /api/students | List / add students |
| POST | /api/students/bulk | Bulk admission |
| PATCH/DELETE | /api/students/:id | Update / delete student |
| GET/POST | /api/payments | List / record payment |
| DELETE | /api/payments/:txn | Reverse payment (master) |
| GET/POST | /api/staff | List / add staff |
| PATCH/DELETE | /api/staff/:id | Update / delete staff |
| GET/POST | /api/levies | List / assign levy |
| POST | /api/levies/assign-class | Bulk class levy assignment |
| GET/POST/PATCH/DELETE | /api/levies/types | Manage levy types |
| GET/POST | /api/levies/payments | Levy payment records |
| GET/PATCH | /api/settings | Get / update settings |
| GET | /api/audit | Audit log (master) |
| GET/POST | /api/audit/fraud | Fraud inbox (master) |

---

## Deployment Guide

### Step 1 — MongoDB Atlas (free database)

1. Go to https://cloud.mongodb.com and create a free account
2. Create a **free M0 cluster** (choose any region)
3. Under **Database Access** → Add a database user with a strong password
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all — Railway needs this)
5. Click **Connect** → **Drivers** → copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster.mongodb.net/schoolfees`
   - Replace `<password>` with your actual password
   - Add `/schoolfees` at the end as the database name

### Step 2 — Deploy to Railway

1. Go to https://railway.app and sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Push this backend folder to a GitHub repo first:
   ```bash
   cd schoolfees-backend
   git init
   git add .
   git commit -m "Initial backend"
   gh repo create schoolfees-backend --public --push
   ```
   (or use the GitHub website to create repo and push)

4. In Railway, select your repo → it auto-detects Node.js

5. Go to **Variables** tab and add these environment variables:
   ```
   MONGODB_URI   = mongodb+srv://user:pass@cluster.mongodb.net/schoolfees
   JWT_SECRET    = generate_a_random_64_char_string_here
   FRONTEND_URL  = https://your-site.netlify.app
   PORT          = 3000
   ```
   
   > **Generate JWT_SECRET:** Run this in your terminal:
   > ```bash
   > node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   > ```

6. Railway will deploy automatically. Copy the generated URL:
   - e.g. `https://schoolfees-backend-production.up.railway.app`

### Step 3 — Run the seed script (one time only)

On your local machine:
```bash
cd schoolfees-backend
npm install
# Create a local .env with your Railway MongoDB URI
echo "MONGODB_URI=mongodb+srv://..." > .env
echo "JWT_SECRET=your_secret" >> .env
node src/seed.js
```

This creates:
- Master admin account (username: ADMIN, password: SCHOOL2025)
- Default settings
- Default levy types

### Step 4 — Update the frontend

In `SchoolFees_Management.html`, find this line near the top of the `<script>`:

```javascript
const API_BASE = 'https://your-railway-url.up.railway.app/api';
```

Set it to your Railway URL. The frontend will now call the backend for all data.

---

## Local Development

```bash
npm install
cp .env.example .env
# Fill in .env with your MongoDB URI and JWT_SECRET
node src/seed.js    # seed once
npm run dev         # starts on port 3000 with auto-reload
```

Test the API:
```bash
curl http://localhost:3000/api/health
# → {"status":"ok","time":"..."}
```

---

## Security Notes

- All routes require a valid JWT token except `/api/auth/login` and `/api/health`
- Master-only routes return 403 for regular admin users
- Cashier name on all payments is always the logged-in user — cannot be overridden
- Withdrawn student payment attempts are logged to the fraud inbox automatically
- JWT tokens expire after 12 hours — users must re-login
