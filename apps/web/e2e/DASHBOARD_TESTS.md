# Dashboard E2E Tests

Comprehensive end-to-end test suite for the Dashboard feature with 25+ test cases covering all aspects of the dashboard functionality.

## Test Coverage

### 1. Layout and Structure (7 tests)
- Main heading and description display
- Client workspace badge visibility
- Metric cards section display
- Numeric metric values
- Recent projects card
- Recent notifications card
- Responsive layout

### 2. Navigation (4 tests)
- Link to view all projects
- Recent projects are clickable
- Navigation to settings works
- Dashboard link navigation

### 3. Metrics and Data Loading (5 tests)
- Permissions metric displays number
- Notifications metric displays number
- Projects metric displays number
- Metrics load within expected time
- Data loading performance

### 4. Content Display (3 tests)
- Recent projects list structure
- Empty state when no projects
- Recent notifications section

### 5. Accessibility (4 tests)
- Heading semantic structure
- Metric cards have accessible labels
- Links are keyboard accessible
- Navigation without mouse

### 6. Admin View (2 tests)
- Admin can access dashboard
- Admin dashboard shows same metrics

### 7. Error Handling (2 tests)
- Dashboard handles API errors gracefully
- Shows error state for failed notifications API

### 8. Session Persistence (2 tests)
- Dashboard data persists on page reload
- Maintains user context after navigation

### 9. Loading States (2 tests)
- Shows loading indicators for async data
- Handles slow API responses

## Key Features Tested

✅ **Page Structure**
- Heading and description
- Badge display
- Grid layout
- Card organization

✅ **Metrics Display**
- Active permissions count
- Unread notifications count
- Total projects count
- Real-time data updates

✅ **Navigation**
- Links to projects page
- Links to settings
- Dashboard navigation
- Project links

✅ **Data Loading**
- API data fetching
- Loading states
- Error handling
- Slow responses

✅ **Accessibility**
- Semantic HTML
- Keyboard navigation
- Screen reader friendly
- WCAG compliance

✅ **Responsiveness**
- Mobile layout
- Tablet layout
- Desktop layout
- Grid responsiveness

✅ **Performance**
- Load time validation
- Slow API handling
- Network resilience
- Caching behavior

## Running Dashboard Tests

```bash
# Run all dashboard tests
pnpm --filter web test:e2e -- dashboard.spec.ts

# Run specific test suite
pnpm --filter web test:e2e -- --grep "Dashboard — layout"

# Run with headed browser
pnpm --filter web test:e2e -- dashboard.spec.ts --headed

# Debug mode
pnpm --filter web test:e2e -- dashboard.spec.ts --debug

# View test report
pnpm exec playwright show-report
```

## Test Organization

### Layout and Structure
Validates the basic dashboard page layout, headings, badges, and card structure.

### Navigation
Tests links and navigation between dashboard and other pages (projects, settings).

### Metrics Display
Verifies that all three metric cards (permissions, notifications, projects) display correctly and show numeric values.

### Data Loading
Tests how the dashboard handles data loading, including performance and error scenarios.

### Accessibility
Ensures the dashboard is accessible to keyboard and screen reader users.

### Admin View
Tests that admin users see the same dashboard interface as regular users.

### Error Handling
Tests dashboard behavior when APIs fail or return errors.

### Session Persistence
Verifies that dashboard data persists across page reloads and navigation.

### Loading States
Tests how the dashboard displays loading indicators and handles slow API responses.

## Dashboard Features Covered

1. **Welcome Section**
   - User greeting (Client workspace)
   - Descriptive text
   - Badge display

2. **Metrics Cards** (3 columns)
   - Active permissions with icon
   - Unread notifications with icon
   - Projects in view with icon
   - All displaying numeric values

3. **Recent Projects Card**
   - Card title and description
   - List of recent projects
   - View all link to projects page
   - Project links (if projects exist)
   - Empty state (if no projects)

4. **Recent Notifications Card**
   - Card title
   - List of recent notifications
   - Empty state handling

5. **Responsive Design**
   - Mobile layout
   - Tablet layout
   - Desktop layout
   - Grid column responsiveness

## Test Data

Tests use the same seed users from auth tests:
- **SEED_USER**: Regular user with basic permissions
- **SEED_ADMIN**: Admin user with elevated permissions

Storage states:
- `seed-user.json` - Authenticated user context
- `seed-admin.json` - Authenticated admin context

## API Endpoints Tested

- `GET /api/bff/projects` - Recent projects list
- `GET /api/bff/notifications/unread-count` - Notification count
- `GET /api/auth/session` - User session info

## Assertions

All tests use Playwright's assertion library with timeouts:
- `toBeVisible()` - Element is visible in viewport
- `toHaveURL()` - Page URL matches pattern
- `textContent()` - Element text content
- `getAttribute()` - Element attributes
- `isVisible()` - Element visibility check

## Performance Metrics

- **Expected dashboard load time**: < 10 seconds
- **Metric display**: < 5 seconds
- **API response handling**: Graceful degradation on slow responses

## Error Scenarios Covered

1. **API Failures**
   - Projects API fails
   - Notifications API fails
   - Generic API errors

2. **Network Issues**
   - Slow connections
   - Failed requests
   - Timeouts

3. **Empty States**
   - No projects
   - No notifications
   - No permissions

## Accessibility Tests

- ✅ Semantic HTML heading structure
- ✅ Accessible labels for metrics
- ✅ Keyboard navigation support
- ✅ Tab order verification
- ✅ Focus management
- ✅ Interactive element discovery

## Browser Support

Tests run on Chromium. Can be extended to Firefox and WebKit by modifying `playwright.config.ts`.

## Dependencies

- Playwright Test
- Auth helpers from `auth.helpers.ts`
- Seed user credentials from `auth.helpers.ts`

## Related Tests

- `auth.spec.ts` - Authentication flow tests
- May be extended to test dashboard filtering, sorting, and advanced features

## Common Issues

### Metrics Not Displaying
- Check API endpoints are accessible
- Verify seed user has permissions
- Check network requests in DevTools

### Empty State Tests Failing
- Seed data might have projects
- Modify test to check both conditions

### Navigation Tests Failing
- Verify sidebar/navigation links exist
- Check route configuration

## Future Enhancements

1. Add tests for dashboard filtering/sorting
2. Test real-time data updates
3. Add performance benchmarking
4. Test dashboard customization
5. Add tests for different user roles/permissions
6. Test dashboard with various data volumes

## Test Execution Order

Tests within each suite run in order:
1. Layout tests establish baseline
2. Navigation tests verify links
3. Data tests validate loading
4. Accessibility tests ensure usability
5. Error tests validate resilience

## Maintenance Notes

- Update tests if dashboard layout changes
- Verify API endpoints when backend changes
- Update seed data if user permissions change
- Monitor test performance for regressions
