# QA Task Manager

A small full-stack web app built specifically as a **QA portfolio project**. It has a
Signup / Login flow and a Task Manager (CRUD), giving you real surfaces to practice and
demonstrate:

- **Manual Testing** — UI flows, form validations, edge cases
- **API Testing** — REST endpoints with Postman (collection included)
- **Automation Testing** — Selenium-friendly UI with `data-testid` attributes on every
  important element

---

## 1. Tech Stack

- **Backend:** Node.js + Express
- **Auth:** JWT (JSON Web Tokens) + bcrypt password hashing
- **Database:** Simple JSON file (`db.json`) — no external DB setup needed
- **Frontend:** Plain HTML, CSS, JavaScript (no framework, easy to read & test)

---

## 2. Project Structure

```
qa-task-manager/
├── server.js              # Express app entry point
├── package.json
├── db.json                # auto-created on first run (users + tasks)
├── middleware/
│   └── auth.js            # JWT verification middleware
├── routes/
│   ├── auth.js            # /api/auth/signup, /api/auth/login
│   └── tasks.js            # /api/tasks CRUD
├── utils/
│   └── db.js              # JSON file read/write helpers
├── public/                 # Frontend
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── css/style.css
│   └── js/ (login.js, signup.js, dashboard.js)
└── postman_collection.json # Ready-to-import Postman collection
```

---

## 3. Running Locally

```bash
npm install
npm start
```

The app runs on **http://localhost:3000** by default (or `PORT` env var if set).

Open `http://localhost:3000` in your browser to see the landing page.

---

## 4. Application Features (for Manual Testing)

### Signup Page (`/signup.html`)
| Field | Validation Rule |
|---|---|
| Username | Required, 3–20 characters |
| Email | Required, must be a valid email format |
| Password | Required, minimum 6 characters |
| Confirm Password | Must match Password |
| Email uniqueness | Cannot sign up with an already-registered email |

### Login Page (`/login.html`)
- Requires valid email + password registered via Signup
- Shows error for wrong credentials
- On success, redirects to Dashboard and stores a JWT token

### Dashboard Page (`/dashboard.html`)
- Add a task (title required, description optional, status: pending / in-progress / completed)
- Edit a task inline (title, description, status)
- Delete a task (with confirmation)
- Filter tasks by status (All / Pending / In Progress / Completed)
- Logout (clears session, redirects to Login)
- If not logged in (no token), redirects to Login automatically

---

## 5. API Documentation (for API Testing with Postman)

Import `postman_collection.json` into Postman — it already includes positive and
negative test requests with example bodies.

Base URL (local): `http://localhost:3000`

### Auth Endpoints

| Method | Endpoint | Auth? | Body | Success | Possible Errors |
|---|---|---|---|---|---|
| POST | `/api/auth/signup` | No | `{ username, email, password }` | 201 | 400 (validation), 409 (duplicate email) |
| POST | `/api/auth/login` | No | `{ email, password }` | 200 + token | 400 (missing fields), 401 (invalid credentials) |

### Task Endpoints (require `Authorization: Bearer <token>`)

| Method | Endpoint | Body | Success | Possible Errors |
|---|---|---|---|---|
| GET | `/api/tasks` | – (optional `?status=pending\|in-progress\|completed`) | 200 | 400 (invalid status), 401 (no/invalid token) |
| GET | `/api/tasks/:id` | – | 200 | 404 (not found), 401 |
| POST | `/api/tasks` | `{ title, description?, status? }` | 201 | 400 (missing title / invalid status), 401 |
| PUT | `/api/tasks/:id` | `{ title?, description?, status? }` | 200 | 400, 404, 401 |
| DELETE | `/api/tasks/:id` | – | 200 | 404, 401 |

### Misc

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/health` | Returns `{ status: "ok", timestamp }` — good for smoke tests |

---

## 6. Suggested Manual Test Scenarios (for your Excel sheet)

**Signup**
1. Signup with valid data → success (201)
2. Signup with existing email → error (409)
3. Signup with invalid email format → error (400)
4. Signup with password < 6 chars → error (400)
5. Signup with username < 3 or > 20 chars → error (400)
6. Signup with empty fields → error (400)

**Login**
1. Login with correct credentials → success, redirect to dashboard
2. Login with wrong password → error shown
3. Login with unregistered email → error shown
4. Login with empty fields → error shown

**Tasks**
1. Add task with title only → success, default status "pending"
2. Add task with empty title → error shown, no row added
3. Edit task title/description/status → updates reflected in table
4. Edit task with empty title → error shown
5. Delete task → confirmation prompt → row removed
6. Filter by each status → only matching tasks shown
7. Logout → redirected to login, dashboard inaccessible without re-login
8. Refresh dashboard while logged in → tasks persist (session retained)

---

## 7. Automation Testing (Selenium) Notes

Every important element has a `data-testid` attribute so your Selenium locators are
stable (use `By.cssSelector("[data-testid='...']")`):

- Signup: `signup-username`, `signup-email`, `signup-password`, `signup-confirm-password`, `signup-submit`, `signup-error`, `signup-success`
- Login: `login-email`, `login-password`, `login-submit`, `login-error`
- Dashboard: `task-title-input`, `task-description-input`, `task-status-input`, `add-task-button`, `dashboard-error`, `dashboard-success`, `logout-button`
- Filters: `filter-all`, `filter-pending`, `filter-in-progress`, `filter-completed`
- Per-task rows: `task-row-<id>`, `task-title-<id>`, `task-status-<id>`, `edit-task-<id>`, `delete-task-<id>`

A typical automation flow: Signup → Login → Add Task → Verify it appears → Edit →
Verify update → Delete → Verify removal → Logout → Verify redirect to login.

---

## 8. Deployment to Render (Free Tier)

1. Push this project to a **new GitHub repository**.
2. Go to [render.com](https://render.com) and sign in with GitHub.
3. Click **New +** → **Web Service**, and select your repository.
4. Configure:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. (Optional) Add an environment variable `JWT_SECRET` with a random string for extra
   security.
6. Click **Create Web Service**. Render will build and deploy automatically — you'll get
   a public URL like `https://qa-task-manager.onrender.com`.

> **Note on data persistence:** This project stores data in a `db.json` file for
> simplicity. On Render's free tier, the filesystem is **ephemeral** — data may reset
> when the service restarts or redeploys. This is fine for demos/interviews. If you
> later want permanent storage, the same routes can be swapped to use a free database
> like MongoDB Atlas or Render's free PostgreSQL.

---

## 9. How to Explain This Project to an Interviewer

- **Manual Testing:** "I designed test cases covering signup validations, login,
  and task CRUD — both positive and negative scenarios — and executed them on the
  deployed app."
- **API Testing:** "I tested all REST endpoints in Postman, verifying status codes
  (200, 201, 400, 401, 404, 409), response bodies, and authentication via JWT tokens."
- **Automation Testing:** "I added `data-testid` attributes to all key UI elements and
  automated the full user journey (signup → login → task CRUD → logout) using Selenium
  with Java/TestNG, following the Page Object Model."
