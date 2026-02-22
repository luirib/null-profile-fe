# null-profile Frontend

A minimal React + TypeScript frontend for passkey-based authentication with OIDC support.

## Features

- 🔐 **Passwordless Authentication**: WebAuthn/Passkey support for secure, user-friendly login
- 🎯 **OIDC Integration**: Completes OIDC Authorization Code Flow with PKCE
- ⚛️ **Modern Stack**: Vite + React + TypeScript + Tailwind CSS
- 🐳 **Docker Ready**: Deployable with Docker Compose
- 🔒 **Route Protection**: Auth guard for protected routes
- 🎨 **Clean UI**: Minimal design aligned with "null-profile" brand

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── BrandHeader.tsx
│   └── ProtectedRoute.tsx
├── pages/            # Page components
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
├── lib/              # Utility functions
│   ├── api.ts        # API client with fetch
│   ├── webauthn.ts   # WebAuthn helpers
│   └── base64url.ts  # Base64URL encoding/decoding
├── types/            # TypeScript type definitions
│   └── index.ts
├── App.tsx           # Router configuration
└── main.tsx          # Application entry point
```

## Prerequisites

- **Node.js**: v20 or higher
- **npm**: v9 or higher
- **WSL** (Windows Subsystem for Linux) for Windows development
- **Backend**: null-profile backend running at `http://localhost:8080`

## Getting Started

### 1. Install Dependencies

```bash
# Using WSL
wsl bash -c "cd /mnt/c/path/to/null-profile-fe/null-profile-fe && npm install"

# Or directly in WSL terminal
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and adjust if needed:

```bash
cp .env.example .env.local
```

Default configuration:
```env
VITE_API_BASE_URL=http://localhost:8080
```

### 3. Run Development Server

```bash
# Using WSL
wsl bash -c "cd /mnt/c/path/to/null-profile-fe/null-profile-fe && npm run dev"

# Or directly in WSL terminal
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Build for Production

```bash
# Using WSL
wsl bash -c "cd /mnt/c/path/to/null-profile-fe/null-profile-fe && npm run build"

# Or directly in WSL terminal
npm run build
```

## Docker Deployment

### Build and Run with Docker Compose

```bash
# Using WSL
wsl bash -c "cd /mnt/c/path/to/null-profile-fe/null-profile-fe && docker compose up --build -d"

# Or directly in WSL terminal
docker compose up --build -d
```

The frontend will be available at `http://localhost:3000`

### Stop Containers

```bash
wsl bash -c "cd /mnt/c/path/to/null-profile-fe/null-profile-fe && docker compose down"
```

### View Logs

```bash
wsl bash -c "cd /mnt/c/path/to/null-profile-fe/null-profile-fe && docker compose logs -f frontend"
```

## Testing End-to-End with OIDC Debugger

### Prerequisites
1. Backend must be running at `http://localhost:8080`
2. Frontend must be running at `http://localhost:3000`
3. Register a test Relying Party in the backend database

### Setup Test RP in Backend

Execute in the backend PostgreSQL database:

```sql
-- Insert test relying party
INSERT INTO relying_parties (id, rp_id, rp_name, sector_identifier, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'oidcdebugger.com',
  'OIDC Debugger',
  'oidcdebugger.com',
  NOW(),
  NOW()
);

-- Get the RP ID for the redirect URI
-- (Copy the id value from the result)
SELECT id FROM relying_parties WHERE rp_id = 'oidcdebugger.com';

-- Insert redirect URI (replace <rp-id> with the UUID from above)
INSERT INTO redirect_uris (id, relying_party_id, uri, created_at)
VALUES (
  gen_random_uuid(),
  '<rp-id>',
  'https://oidcdebugger.com/debug',
  NOW()
);
```

### Test Flow

1. **Visit OIDC Debugger**: https://oidcdebugger.com/debug

2. **Configure Parameters**:
   - **Authorize URI**: `http://localhost:8080/authorize`
   - **Client ID**: `oidcdebugger.com`
   - **Redirect URI**: `https://oidcdebugger.com/debug`
   - **Scope**: `openid`
   - **Response Type**: `code`
   - **Response Mode**: `form_post` or `query`
   - **Use PKCE**: ✅ Enabled (S256)
   - **Nonce**: (generate)
   - **State**: (generate)

3. **Start Authorization Flow**: Click "Send Request"

4. **Backend Redirects to Login**: You'll be redirected to `http://localhost:3000/login?txn=...`

5. **Authenticate with Passkey**:
   - First time: Click "Create Passkey" to register
   - Returning: Click "Continue with Passkey" to authenticate

6. **Complete Flow**: After successful authentication, you'll be redirected back to OIDC Debugger with:
   - Authorization code
   - State (should match)

7. **Exchange Code for Token**: 
   - Use the "Exchange" section in OIDC Debugger
   - **Token Endpoint**: `http://localhost:8080/token`
   - **Client ID**: `oidcdebugger.com`
   - Paste the authorization code
   - Include PKCE verifier
   - Click "Exchange"

8. **Verify ID Token**: You should receive:
   - ID Token (JWT)
   - Decoded claims showing `sub`, `iss`, `aud`, `exp`, `iat`

## Routes

- **`/login`**: Public login page with passkey authentication
- **`/dashboard`**: Protected dashboard (placeholder)
- **`/`**: Redirects to `/login`

## WebAuthn Flow

### Registration (Create Passkey)
1. Frontend calls `POST /webauthn/registration/options` with `txn`
2. Backend returns challenge and options
3. Frontend calls `navigator.credentials.create()`
4. User creates passkey with biometric/PIN
5. Frontend sends attestation to `POST /webauthn/registration/verify`
6. Backend completes OIDC flow if `txn` is present

### Authentication (Sign In)
1. Frontend calls `POST /webauthn/authentication/options` with `txn`
2. Backend returns challenge
3. Frontend calls `navigator.credentials.get()`
4. User authenticates with existing passkey
5. Frontend sends assertion to `POST /webauthn/authentication/verify`
6. Backend completes OIDC flow if `txn` is present

## CORS Configuration

For local development, ensure the backend allows credentials from `http://localhost:3000`:

```java
// Backend CORS configuration needed
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowCredentials(true);
        }
    };
}
```

**Note**: This configuration is required in the backend, not in this repository.

## Browser Compatibility

WebAuthn/Passkey support:
- ✅ Chrome 67+
- ✅ Firefox 60+
- ✅ Safari 13+
- ✅ Edge 18+

## Troubleshooting

### WebAuthn Not Working
- Ensure you're using HTTPS or localhost (http://localhost is allowed)
- Check browser console for errors
- Verify WebAuthn is supported: Check if `window.PublicKeyCredential` exists

### Backend Connection Issues
- Verify backend is running: `curl http://localhost:8080/actuator/health`
- Check CORS configuration in backend
- Ensure `credentials: 'include'` is set in fetch requests

### Docker Build Fails
- Ensure you're using WSL: `wsl bash -c "docker compose up --build"`
- Check Docker daemon is running in WSL
- Verify all dependencies in package.json are correct

### Authentication Loop
- Clear browser localStorage: `localStorage.clear()`
- Clear cookies for localhost
- Restart both frontend and backend

## Development Tips

### Hot Reload
Vite provides fast hot module replacement (HMR). Changes to source files will be reflected immediately.

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

### Building for Production
```bash
npm run build
npm run preview  # Preview production build locally
```

## Architecture Notes

### Auth State Management
- Uses localStorage fallback for MVP
- Structured to support server-session check via `/api/session` endpoint
- `ProtectedRoute` component guards private routes

### Branding Placeholder
- `BrandHeader` component accepts `RelyingPartyBranding` props
- Currently uses defaults, ready to fetch from backend based on OIDC transaction

### Session Management
- Uses `credentials: 'include'` for cookie-based sessions
- Backend must set `SameSite=None; Secure` cookies for cross-origin (or same-site for localhost)

## License

Private project - all rights reserved.
