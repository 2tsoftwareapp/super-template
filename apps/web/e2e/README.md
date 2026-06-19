# End-to-End Tests with Playwright

This directory contains comprehensive E2E tests for the application using Playwright, with full coverage of the authentication feature.

## Quick Start

```bash
# Run all E2E tests
pnpm --filter web test:e2e

# Run only auth tests
pnpm --filter web test:e2e:auth

# Run with headed browser (see the browser in action)
pnpm --filter web test:e2e -- --headed

# Run specific test
pnpm --filter web test:e2e -- --grep "login"

# Debug tests
pnpm --filter web test:e2e -- --debug
```

## Test Structure

### Authentication Tests (`auth.spec.ts`)

Comprehensive test suite covering all aspects of the authentication feature:

#### 1. **Public Pages**
- Form visibility (login, register, forgot-password, reset-password)
- Page navigation between auth flows
- Form field validation and rendering

#### 2. **Access Control**
- Protected routes redirect unauthenticated users to login
- Invalid credentials are rejected
- Session validation through API endpoints

#### 3. **Session Lifecycle**
- User sign-in, dashboard access, and sign-out
- Session validation via `/api/auth/session` endpoint
- Admin user sign-in

#### 4. **Registration**
- Complete registration flow with email verification
- Mailpit integration for email token extraction
- Successful login after registration
- Display name and email validation

#### 5. **Password Reset**
- Password reset request via email
- Email token verification from Mailpit
- Password update with new credentials
- Login with new password
- Invalid token rejection

#### 6. **Email Verification**
- Email verification requirement before login
- Unverified users cannot access the system
- Invalid verification token handling
- Resend verification email flow

#### 7. **Authenticated Settings**
- Profile settings display current user info
- Active sessions management
- Security settings for password rotation
- Password change with old password verification
- New password validation on next login

#### 8. **Multiple Sessions**
- Concurrent sessions from multiple browsers/devices
- Independent session management
- Logout from one session doesn't affect others
- Session tracking via API

#### 9. **Session Persistence**
- Session persists across page reloads
- Session persists across navigation
- Storage state preservation

#### 10. **Form Validation**
- Required field validation
- Email format validation
- Password field masking for security
- Form submission controls

#### 11. **Error Handling**
- Network failure error messages
- Server error recovery
- Graceful error display

## Helper Functions

### Core Authentication Helpers

```typescript
// Login through UI with optional fresh session
await loginThroughUi(page, { email, password }, { fresh?: boolean });

// Logout through UI
await logoutThroughUi(page);

// Verify email with token
await verifyEmailThroughUi(page, token);

// Generate unique test email
const email = uniqueEmail("playwright-test");

// Wait for email token from Mailpit
const token = await waitForMailpitToken(request, recipient, { 
  param?: "token", 
  timeoutMs?: 15_000 
});
```

### Advanced Helpers

```typescript
// Change password in security settings
await changePasswordThroughUi(page, currentPassword, newPassword);

// Complete password reset flow
await resetPasswordThroughUi(page, request, email, newPassword);

// Ensure user is authenticated
await ensureAuthenticated(page, credentials);
```

## Environment Variables

All test configurations can be overridden via environment variables:

```bash
# User credentials for seed data
E2E_USER_EMAIL=user@example.local
E2E_USER_PASSWORD=ChangeMe123!
E2E_ADMIN_EMAIL=admin@example.local
E2E_ADMIN_PASSWORD=ChangeMe123!

# Mailpit service for email testing
MAILPIT_HTTP_URL=http://localhost:8025
MAILPIT_HTTP_PORT=8025

# Database configuration
PLAYWRIGHT_DATABASE_URL=postgresql://...
PLAYWRIGHT_DATABASE_MIGRATE_URL=postgresql://...

# Base URL for tests
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_API_HEALTH_URL=http://localhost:3001/api/v1/health
```

## Configuration

### Playwright Config (`playwright.config.ts`)

The configuration automatically:
- Starts the API and Web servers
- Applies database migrations
- Loads environment variables from `.env`
- Configures Chromium as the test browser
- Enables trace collection on first retry
- Sets up HTML reporting

Key settings:
- **Parallel**: Tests run in parallel by default
- **Workers**: Set to 1 for auth tests (serial execution)
- **Retries**: 0 local, 2 in CI
- **Timeout**: 180 seconds for server startup

## Mailpit Integration

Tests use Mailpit for email verification:

1. **Email Capture**: Mailpit captures all outgoing emails
2. **Token Extraction**: Tests fetch emails via Mailpit HTTP API
3. **Token Parsing**: Tokens are extracted from email body or HTML

Example email-based test flow:
```
1. User registers with email
2. Test retrieves verification token from Mailpit
3. Test navigates to verify endpoint with token
4. Email is marked as verified
5. User can now log in
```

## CI/CD Integration

For CI environments, set:
```bash
CI=true  # Enables retries and forbids .only tests
PLAYWRIGHT_SKIP_WEBSERVER=false  # Ensure servers start
```

## Reports

After running tests, view detailed reports:

```bash
# Open HTML report
pnpm exec playwright show-report

# Report includes:
# - Test results with pass/fail status
# - Execution time for each test
# - Screenshots/traces on failure
# - Browser console logs
```

## Debugging

### Debug Mode
```bash
pnpm --filter web test:e2e -- --debug
```
Opens Playwright Inspector for step-by-step execution.

### Headed Browser
```bash
pnpm --filter web test:e2e -- --headed
```
See the browser as tests run.

### Traces
Traces are automatically collected on first retry and can be viewed:
```bash
pnpm exec playwright show-trace trace.zip
```

## Best Practices

1. **Email Testing**: Always use `uniqueEmail()` to avoid conflicts
2. **Serial Tests**: Use `.configure({ mode: "serial" })` for dependent tests
3. **Timeouts**: Set appropriate timeouts for async operations (email fetching, etc.)
4. **Assertions**: Use Playwright's built-in assertions with proper timeout handling
5. **Cleanup**: Tests should be independent and not rely on previous test state
6. **Storage State**: Use storage state for authenticated contexts to avoid repeated login

## Common Issues

### Tests Fail to Start WebServer
- Check `playwright.config.ts` environment variables
- Ensure database is initialized: `pnpm --filter api db:migrate`
- Verify ports 3000, 3001 are available

### Mailpit Tests Timeout
- Confirm Mailpit is running: `docker ps | grep mailpit`
- Check `MAILPIT_HTTP_URL` environment variable
- Increase timeout: `waitForMailpitToken(..., { timeoutMs: 30_000 })`

### Session Tests Fail
- Clear browser cookies/storage between tests
- Use fresh context for independent sessions
- Verify `storageState` paths are correct

### Database Errors
- Run migrations: `pnpm --filter api db:migrate`
- Seed data: `pnpm --filter api db:seed`
- Reset if needed: `pnpm --filter api db:reset`

## Contributing

When adding new auth tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Add helper functions for reusable flows
4. Document expected outcomes
5. Handle both success and failure paths
6. Test with various browsers if applicable

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Mailpit Documentation](https://mailpit.axllent.org/)
- [Application Auth Documentation](../../docs/auth.md)
