/// Flutter kernel: design tokens, widgets, errors, storage, and auth primitives.
///
/// Feature plugins depend on this package instead of `mobile_app` internals.
/// App-shell pieces that still couple to features (auth interceptor, push,
/// deep links, permission gate) stay in `apps/mobile/lib/core`.
library;

export 'src/auth/token_bundle.dart';
export 'src/auth/token_storage.dart';
export 'src/config/app_config.dart';
export 'src/design/app_colors.dart';
export 'src/design/app_radius.dart';
export 'src/design/app_spacing.dart';
export 'src/errors/app_exception.dart';
export 'src/errors/user_facing_error.dart';
export 'src/storage/secure_store.dart';
export 'src/storage/theme_store.dart';
export 'src/widgets/widgets.dart';
