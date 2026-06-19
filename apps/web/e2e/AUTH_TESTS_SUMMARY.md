# Authentication E2E Tests - Full Feature Coverage

## Overview
Comprehensive Playwright test suite for the authentication feature, covering happy paths, edge cases, error scenarios, and security workflows.

## Test Categories

### 1. Public Pages (`Auth — public pages`)
- ✓ Login page displays sign-in form and authentication links
- ✓ Register page is reachable from login
- ✓ Forgot-password page accepts email input
- ✓ Reset-password page renders token and password fields
- ✓ Verify-email page disables action without token

### 2. Access Control (`Auth — access control`)
- ✓ Protected dashboard redirects guests to login
- ✓ Invalid credentials are rejected with error message
- ✓ Session validation against API endpoints

### 3. Session Lifecycle (`Auth — session lifecycle`)
- ✓ Seed user can sign in, open workspace, and sign out
- ✓ Seed admin can sign in
- ✓ Session validation through API
- ✓ Full logout flow with dashboard redirect

### 4. Registration (`Auth — registration`)
- ✓ Complete registration flow
- ✓ Email verification requirement
- ✓ Login after successful registration
- ✓ Mailpit email token extraction

### 5. Password Reset (`Auth — password reset`)
- ✓ Complete password reset flow with email token
- ✓ Password change after reset
- ✓ Login with new password
- ✓ Rejects invalid reset tokens
- ✓ Error handling for expired tokens

### 6. Email Verification (`Auth — email verification`)
- ✓ Unverified users cannot log in
- ✓ Invalid verification token handling
- ✓ Resend verification email flow
- ✓ Email verification success confirmation
- ✓ Token validation and extraction from Mailpit

### 7. Authenticated Settings (`Auth — authenticated settings`)
- ✓ Profile settings display current user info
- ✓ Sessions settings list active sessions
- ✓ Security settings expose password rotation form
- ✓ Password change in security settings
- ✓ New password validation on next login

### 8. Multiple Sessions (`Auth — multiple sessions`)
- ✓ User can open multiple concurrent sessions
- ✓ Sessions are tracked at API level
- ✓ Logging out from one session doesn't affect others
- ✓ Independent session management

### 9. Session Persistence (`Auth — session persistence`)
- ✓ Session persists across page reloads
- ✓ Session persists across navigation
- ✓ Storage state preservation

### 10. Form Validation (`Auth — form validation`)
- ✓ Register form validates required fields
- ✓ Login form validates email format
- ✓ Password field masks input for security
- ✓ Disabled submit button for incomplete forms

### 11. Error Handling (`Auth — error handling`)
- ✓ Network failure error messages
- ✓ Server error handling
- ✓ Graceful error recovery

## Helper Functions

### `loginThroughUi(page, credentials, options?)`
Login through the UI with optional fresh session clearing.

### `logoutThroughUi(page)`
Complete logout flow with URL verification.

### `verifyEmailThroughUi(page, token)`
Navigate to verify-email page and complete verification.

### `changePasswordThroughUi(page, currentPassword, newPassword)`
Change password in security settings with confirmation.

### `resetPasswordThroughUi(page, request, email, newPassword)`
Complete password reset flow including email token retrieval.

### `waitForMailpitToken(request, recipient, options?)`
Wait for and extract verification/reset tokens from Mailpit.

### `uniqueEmail(prefix)`
Generate unique test email addresses with timestamp.

## Environment Variables

- `E2E_USER_EMAIL` - Seed user email (default: user@example.local)
- `E2E_USER_PASSWORD` - Seed user password (default: ChangeMe123!)
- `E2E_ADMIN_EMAIL` - Seed admin email (default: admin@example.local)
- `E2E_ADMIN_PASSWORD` - Seed admin password (default: ChangeMe123!)
- `MAILPIT_HTTP_URL` - Mailpit service URL (default: http://localhost:8025)

## Running Tests

```bash
# Run all auth tests
pnpm --filter web test:e2e:auth

# Run specific test
pnpm --filter web test:e2e:auth -- --grep "password reset"

# Run with headed browser
pnpm --filter web test:e2e:auth -- --headed

# Generate HTML report
pnpm --filter web test:e2e:auth
# View: playwright-report/index.html
```

## Key Test Patterns

### Serial Test Groups
Some tests run serially to avoid conflicts:
- Authenticated settings tests (one shared login session)
- Password change followed by logout/login

### Email-based Tests
Tests requiring email verification use Mailpit API:
- Registration flow
- Password reset
- Email verification

### Session Storage
Tests use Playwright storage state for authenticated flows:
- `.auth/seed-user.json` - Authenticated context

### Error Simulation
Network error testing uses route interception:
- Abort API calls to test network failures
- Block specific endpoints for error scenarios

## Test Statistics

- **Total Test Suites**: 11
- **Total Tests**: 30+
- **Coverage Areas**: 
  - Public authentication flows
  - Access control and permissions
  - Session management
  - Email verification
  - Password management
  - Error handling
  - Form validation

## Prerequisites

- Docker (for Mailpit service)
- PostgreSQL (for test database)
- Node.js + pnpm
- Web server running on port 3000
- API server running on port 3001
