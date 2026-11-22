# Make it yours

A checklist for turning the template into your project. Do it once, right
after cloning, then commit.

## 1. Fresh history (optional)

```bash
rm -rf .git && git init && git add . && git commit -m "Start from super-template"
```

## 2. Names

| What                 | Where                                                                  | Template value                |
| -------------------- | ---------------------------------------------------------------------- | ----------------------------- |
| Root package         | `package.json` `name`                                                  | `super-template-lean`         |
| Workspace scope      | `name` in every `package.json`, imports of `@lean/*`                   | `@lean/…`                     |
| Compose project      | `name:` in `compose.prod.yaml`                                         | `lean-prod`                   |
| Local database       | `docker-compose.yml`, `DATABASE_URL` in `.env.example`                 | `lean`                        |
| Web and admin titles | `metadata` in `apps/*/app/layout.tsx`, copy in `apps/web/app/page.tsx` | "Lean Template", "Lean Admin" |
| Mail sender          | `MAIL_FROM`                                                            | `no-reply@example.local`      |
| Docs site            | `docs/.vitepress/config.mts` (`title`, `base`, repo link)              | `super-template`              |
| License holder       | `LICENSE`                                                              |                               |

Renaming the `@lean` scope is optional. If you do it, replace it everywhere at
once and reinstall:

```bash
grep -rl "@lean/" --exclude-dir=node_modules --exclude-dir=.next --exclude=pnpm-lock.yaml . \
  | xargs sed -i 's#@lean/#@acme/#g'
pnpm install
pnpm run check
```

(On macOS use `sed -i ''`.)

## 3. Mobile identity

| What             | Where                                                                                    | Template value                 |
| ---------------- | ---------------------------------------------------------------------------------------- | ------------------------------ |
| Dart package     | `name` in `apps/mobile/pubspec.yaml` (and `package:` imports)                            | `lean_mobile`                  |
| App title        | `title` in `lib/main.dart`                                                               | `Lean Template`                |
| Android id       | `namespace` and `applicationId` in `android/app/build.gradle.kts`, Kotlin package folder | `app.twotsoftware.lean_mobile` |
| Android label    | `android:label` in `android/app/src/main/AndroidManifest.xml`                            | `lean_mobile`                  |
| iOS bundle id    | `PRODUCT_BUNDLE_IDENTIFIER` in Xcode (Runner target)                                     | `app.twotsoftware.leanMobile`  |
| iOS display name | `CFBundleDisplayName` in `ios/Runner/Info.plist`                                         | `Lean Mobile`                  |

The application id and bundle id cannot change after the first store release.
Run `flutter analyze && flutter test` afterwards.

## 4. Look and feel

- Colours, radius and fonts: the CSS variables in `apps/web/app/globals.css`
  and `apps/admin/app/globals.css`. Any [shadcn theme](https://ui.shadcn.com/themes)
  can be pasted over them.
- Components: `pnpm dlx shadcn@latest add <component>` inside the app folder.
- Mobile: `ThemeData` in `apps/mobile/lib/main.dart`.

## 5. Behaviour switches

| Want                               | Do                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| Invite-only accounts               | `ALLOW_REGISTRATION=false`; admins create users                                     |
| Longer or shorter sessions         | `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`                                                 |
| Bigger uploads or other file types | `MAX_UPLOAD_BYTES`; the allow-list in `files.service.ts` (and mobile `models.dart`) |
| Different login limits             | the throttler settings in `apps/api/src/modules/auth/`                              |

## 6. Remove what you do not need

- **No mobile app**: delete `apps/mobile` and its section in `README.md`.
- **No public web app**: delete `apps/web` and its service in `compose.prod.yaml`
  and the `web` target in `Dockerfile`. Password reset links point to `WEB_URL`,
  so host a reset page somewhere else or drop that flow.
- **Demo jobs**: remove `demo.echo` / `demo.fail` from
  `apps/worker/src/handlers.ts` and `JOB_TYPES` in the API.

Run the full check after every removal:

```bash
pnpm install && pnpm run check && pnpm run format:check
```

## 7. Then

- Replace the welcome text and the landing page.
- Read [Add a feature](./add-a-feature) and build your first module.
- Before going live, follow [Deployment](./deployment).
