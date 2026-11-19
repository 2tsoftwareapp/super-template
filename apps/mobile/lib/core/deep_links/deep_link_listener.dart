import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/app/router.dart';
import 'package:mobile_app/features/auth/data/auth_repository.dart';

class DeepLinkListener extends ConsumerStatefulWidget {
  const DeepLinkListener({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<DeepLinkListener> createState() => _DeepLinkListenerState();
}

class _DeepLinkListenerState extends ConsumerState<DeepLinkListener> {
  final _appLinks = AppLinks();

  @override
  void initState() {
    super.initState();
    _handleInitialLink();
    _appLinks.uriLinkStream.listen(_navigateFromUri);
  }

  Future<void> _handleInitialLink() async {
    final uri = await _appLinks.getInitialLink();
    if (uri != null) {
      await _navigateFromUri(uri);
    }
  }

  Future<void> _navigateFromUri(Uri uri) async {
    if (uri.scheme == 'super-template' || uri.scheme == 'myapp') {
      final handled = await _handleSsoCallback(uri);
      if (handled) return;
    }

    final path = _mapUriToPath(uri);
    if (path == null) {
      return;
    }
    final router = ref.read(appRouterProvider);
    router.go(path);
  }

  bool _isSsoCallback(Uri uri) {
    if (uri.scheme != 'super-template' && uri.scheme != 'myapp') {
      return false;
    }

    if (uri.host == 'sso' && uri.path == '/callback') {
      return true;
    }

    return uri.pathSegments.length >= 2 &&
        uri.pathSegments[0] == 'sso' &&
        uri.pathSegments[1] == 'callback';
  }

  Future<bool> _handleSsoCallback(Uri uri) async {
    if (!_isSsoCallback(uri)) return false;

    final exchangeCode = uri.queryParameters['exchange'];
    if (exchangeCode == null || exchangeCode.isEmpty) {
      return false;
    }

    await ref.read(authRepositoryProvider).completeSsoExchange(exchangeCode);
    if (mounted) {
      context.go('/home');
    }
    return true;
  }

  String? _mapUriToPath(Uri uri) {
    final segments = uri.pathSegments;
    // Custom-scheme links carry the route in the host:
    // myapp://verify-email?token=… has an empty pathSegments list. https links
    // keep the route in the first path segment.
    final usesHost =
        (uri.scheme == 'myapp' || uri.scheme == 'super-template') &&
        uri.host.isNotEmpty;
    final route = usesHost
        ? uri.host
        : (segments.isEmpty ? null : segments.first);
    if (route == null || route.isEmpty) {
      return null;
    }

    switch (route) {
      case 'verify-email':
        final token = uri.queryParameters['token'];
        return token == null ? '/verify-email' : '/verify-email?token=$token';
      case 'reset-password':
        final token = uri.queryParameters['token'];
        return token == null
            ? '/reset-password'
            : '/reset-password?token=$token';
      case 'invite':
        // No invite route exists in this app yet; dropping the link is better
        // than navigating to a route GoRouter would report as not found.
        return null;
      case 'organizations':
        return '/organizations';
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
