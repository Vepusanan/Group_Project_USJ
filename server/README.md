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