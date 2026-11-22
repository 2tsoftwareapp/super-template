# Mobile

`apps/mobile` is a Flutter app with Android and iOS projects. It talks to the
API directly with bearer tokens.

## Run it

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001   # Android emulator
flutter run --dart-define=API_BASE_URL=http://localhost:3001  # iOS simulator
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:3001  # device on your Wi-Fi
```

`API_BASE_URL` is the API origin without `/api/v1`. The Android emulator
reaches your computer at `10.0.2.2`; a physical device needs your computer's
LAN address and the API listening on it.

## Screens

| Screen        | File                                    | Does                                                   |
| ------------- | --------------------------------------- | ------------------------------------------------------ |
| Startup       | `lib/screens/startup_screen.dart`       | restores the stored session, then routes               |
| Login         | `lib/screens/login_screen.dart`         | email + password                                       |
| Home          | `lib/screens/home_screen.dart`          | profile, links to notifications and files, sign out    |
| Notifications | `lib/screens/notifications_screen.dart` | list, tap to mark read, pull to refresh                |
| My files      | `lib/screens/files_screen.dart`         | pick and upload (PNG, JPEG, WebP, PDF, TXT, CSV), list |

All HTTP lives in `lib/api.dart` (`ApiClient`); JSON models in `lib/models.dart`.

## Session handling

- `lib/session_store.dart` keeps the refresh token in `flutter_secure_storage`
  (Keychain on iOS, encrypted shared preferences on Android).
- On launch, `StartupScreen` restores the session with a refresh. If the API is
  unreachable the stored token is kept; it is cleared only when the API rejects it.
- `ApiClient` refreshes once after a 401 and retries the request.
- Logout clears local state first, even when the network call fails.

## Add an API call

```dart
// lib/api.dart, inside ApiClient
Future<List<Note>> notes() async {
  final body = await _expect(
      () => _client.get(_uri('/notes'), headers: _auth()),
      'Could not load notes');

  return (body['data'] as List<dynamic>)
      .map((item) => Note.fromJson(item as Map<String, dynamic>))
      .toList();
}
```

`_expect` handles the refresh-and-retry and turns the API error envelope into
an `ApiException` with the server's message. Test it with `MockClient` as in
`test/api_test.dart`.

## Cleartext HTTP

Debug and profile builds allow plain HTTP (Android:
`android:usesCleartextTraffic` in `src/debug/AndroidManifest.xml`). Release
builds expect an HTTPS `API_BASE_URL`.

## Release builds

Before the first release, give the app your own identity (see
[Make it yours](./customizing)): Android `applicationId`
`app.twotsoftware.lean_mobile`, iOS bundle id `app.twotsoftware.leanMobile`,
and the display name. Set the version in `pubspec.yaml` (`version: 1.2.0+12`;
the number after `+` is the build number).

### Android

The release build type is signed with the debug key so `flutter run --release`
works out of the box. Replace it before publishing:

1. Create an upload key:
   `keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`
2. Create `android/key.properties` (never commit it) with `storePassword`,
   `keyPassword`, `keyAlias` and `storeFile`.
3. In `android/app/build.gradle.kts`, load `key.properties` into a
   `signingConfigs.create("release")` block and use it in `buildTypes.release`.
   Flutter's [Android deployment guide](https://docs.flutter.dev/deployment/android)
   has the exact snippet.
4. Build: `flutter build appbundle --release --dart-define=API_BASE_URL=https://api.example.com`

### iOS

1. Open `ios/Runner.xcworkspace` in Xcode, select the Runner target, and set
   your team and bundle identifier under **Signing & Capabilities**.
2. Build: `flutter build ipa --release --dart-define=API_BASE_URL=https://api.example.com`
3. Upload `build/ios/ipa/*.ipa` with Xcode's Organizer or Transporter.

iOS builds need macOS with Xcode. Flutter's
[iOS deployment guide](https://docs.flutter.dev/deployment/ios) covers App Store Connect.

## Checks

```bash
dart format --output=none --set-exit-if-changed .
flutter analyze
flutter test
```
