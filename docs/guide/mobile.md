# Mobile

`apps/mobile` is a Flutter app with Android and iOS projects.

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001   # Android emulator
flutter run --dart-define=API_BASE_URL=http://localhost:3001  # iOS simulator
flutter analyze && flutter test
```

## Session handling

- `lib/session_store.dart` keeps the refresh token in `flutter_secure_storage`.
- On launch, `StartupScreen` restores the session with a refresh. If the API is
  unreachable the stored token is kept; it is cleared only when the API rejects it.
- `lib/api.dart` refreshes once after a 401 and retries the request.
- Logout always clears local state, even when the network call fails.

Debug builds allow plain HTTP to the local API; release builds expect HTTPS.
