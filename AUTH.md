# Authentication System

This document outlines the JWT-based authentication system implemented for NexusJED.

## Overview

The authentication system uses JSON Web Tokens (JWT) with HTTP-only cookies for secure session management. It provides user registration, login, logout, and automatic token refresh functionality.

## Architecture

### JWT Tokens
- **Access Token**: Short-lived (15 minutes), used for API authentication
- **Refresh Token**: Long-lived (7 days), used to renew access tokens
- **Storage**: HTTP-only cookies for XSS protection

### Password Security
- **Hashing**: bcrypt with 12 salt rounds
- **Validation**: Minimum 8 characters required

## API Endpoints

### POST `/api/auth/register`
Registers a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "isAdmin": false
  }
}
```

**Errors:**
- `400`: Missing required fields or password too short
- `409`: User already exists
- `500`: Server error

### POST `/api/auth/login`
Authenticates a user and issues tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "isAdmin": false
  }
}
```

**Errors:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `500`: Server error

### GET `/api/auth/me`
Returns current authenticated user information.

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "isAdmin": false
  }
}
```

**Errors:**
- `401`: Invalid or missing access token

### POST `/api/auth/refresh`
Refreshes the access token using the refresh token.

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "isAdmin": false
  }
}
```

**Errors:**
- `401`: Invalid or missing refresh token

### POST `/api/auth/logout`
Logs out the user by clearing authentication cookies.

**Response:**
```json
{
  "success": true
}
```

## Frontend Integration

### AuthContext
The `AuthContext` provides global authentication state management:

```typescript
const { user, loading, login, register, logout, refreshUser } = useAuth();
```

**Properties:**
- `user`: Current authenticated user or null
- `loading`: Boolean indicating authentication check in progress
- `login(email, password)`: Login function
- `register(email, username, password)`: Registration function
- `logout()`: Logout function
- `refreshUser()`: Refresh user data function

### Protected Routes
Authentication middleware protects routes:

**Protected:**
- `/forum` - Requires authentication
- Any other routes except those listed below

**Public:**
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/terminal` - Terminal page (explicitly kept public)

## Security Features

### Token Security
- **HTTP-only cookies**: Prevents XSS attacks
- **Secure flag**: Enabled in production
- **SameSite strict**: Prevents CSRF attacks
- **Short access token lifetime**: Reduces impact of token compromise

### Password Security
- **bcrypt hashing**: Industry-standard password hashing
- **Salt rounds**: 12 rounds for strong security
- **Minimum length**: 8 characters required

### Middleware Protection
- **Route protection**: Automatic redirect to login for unauthenticated users
- **Token validation**: JWT signature verification
- **Automatic refresh**: Seamless token renewal

## Environment Variables

Required environment variables in `.env`:

```env
AUTH_SECRET=your-secret-key-here
DATABASE_URL=file:./dev.db
```

**AUTH_SECRET**: Used for JWT signing and verification. Should be a long, random string.

## Database Schema

The authentication system uses the existing User model:

```prisma
model User {
  id        String   @id @default(cuid())
  username  String?  @unique
  email     String?  @unique
  password  String?
  isAdmin   Boolean
  messages  Message[]
}
```

## Usage Examples

### Frontend Authentication Check
```typescript
const { user, loading } = useAuth();

if (loading) return <LoadingScreen />;
if (!user) return <LoginPage />;

// User is authenticated
return <AuthenticatedContent />;
```

### API Authentication
```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

// Check authentication
const userResponse = await fetch('/api/auth/me');
if (userResponse.ok) {
  const { user } = await userResponse.json();
  // User is authenticated
}
```

### Backend Route Protection
The middleware automatically handles route protection. For manual checks in API routes:

```typescript
import { getUserFromToken } from '~/lib/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const user = await getUserFromToken(token);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated
}
```

## Error Handling

### Frontend
- Form validation with real-time error display
- Network error handling with user-friendly messages
- Automatic retry on token refresh failures

### Backend
- Consistent error response format
- Proper HTTP status codes
- Secure error messages (no sensitive information)

## Token Refresh Flow

1. User makes authenticated request
2. If access token is expired but refresh token is valid:
   - Middleware redirects to `/api/auth/refresh`
   - New tokens are issued
   - User is redirected to original destination
3. If both tokens are invalid:
   - Tokens are cleared
   - User is redirected to login

## Testing

### Manual Testing
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Check authentication
curl -X GET http://localhost:3000/api/auth/me -b cookies.txt

# Logout
curl -X POST http://localhost:3000/api/auth/logout -b cookies.txt
```

## Troubleshooting

### Common Issues

**"Access token not found" error:**
- Check if cookies are being sent with requests
- Verify the AUTH_SECRET is set correctly
- Ensure the token hasn't expired

**Redirect loops:**
- Check middleware configuration
- Verify public routes are properly excluded
- Check for conflicting authentication logic

**Password validation errors:**
- Ensure password meets minimum 8 character requirement
- Check for special characters that might cause issues

### Debug Mode
Enable debug logging by adding to environment:
```env
NODE_ENV=development
```

This will log authentication attempts and token operations to the console.