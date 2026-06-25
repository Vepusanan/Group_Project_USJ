# Startup-Investor Platform

## Setup Instructions

# Environment setup start ========================

### Prerequisites

- Node.js 24.x (see `.nvmrc`)
- Git
- Supabase account

### Installation

1. Clone the repository

```bash
git clone <your-repo-url>
cd startup-investor-platform
```

2. Install server dependencies

```bash
cd server
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

- `DATABASE_URL`: From Supabase Project Settings > Database > Connection String (Session pooler)
- `DB_PASSWORD`: Your Supabase database password
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: From Supabase Project Settings > API
- `JWT_SECRET`: Generate a random string

4. Test database connection

```bash
npm run test-db
```

5. Create test users (optional)

```bash
npm run seed-test
```

6. Start development server

```bash
npm run dev
```

Server runs on: http://localhost:5000

### Testing

- Health check: http://localhost:5000/api/health
- Test users endpoint: http://localhost:5000/api/test/users

### Database Schema

See migration files in `/supabase/migrations/`

To create tables in Supabase:

1. Go to Supabase SQL Editor
2. Copy contents of migration file
3. Run the SQL

### Team Development

Test data prefixes:

- Developer 1: `dev1_*@test.com`
- Developer 2: `dev2_*@test.com`
- Developer 3: `dev3_*@test.com`
- Developer 4: `dev4_*@test.com`

Password for all test users: `Test123!`

```

### 8. Create `.gitignore` (if not exists)

**Create/update `.gitignore`:**
```

# Environment variables

.env
.env.local

# Dependencies

node_modules/

# Logs

logs
_.log
npm-debug.log_

# OS

.DS_Store
Thumbs.db

# IDE

.vscode/
.idea/
_.swp
_.swo

# Build

dist/
build/

# Environment setup over ========================

# Backend details

## Server Architecture

We use MVC (Model-View-Controller) pattern:

### Models (`/models`)

- Handle database operations
- Pure SQL queries
- No business logic
- Return data or throw errors

### Controllers (`/controllers`)

- Handle business logic
- Call models for data
- Process and validate
- Send responses

### Routes (`/routes`)

- Define API endpoints
- Map URLs to controllers
- Apply middleware

### Middleware (`/middleware`)

- Authentication (JWT)
- Validation
- Error handling
- Rate limiting

### Flow Example:

POST /api/auth/login
→ routes/auth.js (route definition)
→ middleware/validation.js (validate input)
→ controllers/authController.js (business logic)
→ models/User.js (database query)
→ controllers/authController.js (send response)

Request → Route → Middleware → Controller → Model → Database
↓
Response ← Route ← Middleware ← Controller ← Model

# For Future Tables

When you create new tables (like startup_profiles, connections, etc.):

Write the migration file FIRST
Copy the SQL from the file
Run it in Supabase SQL Editor
Commit the file