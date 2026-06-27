import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/app/router.dart';
import 'package:mobile_app/core/auth/token_bundle.dart';
import 'package:mobile_app/core/auth/token_storage.dart';

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

  Map<String, String> _readSsoTokenParams(Uri uri) {
    if (uri.fragment.isNotEmpty) {
      return Uri.splitQueryString(uri.fragment);
    }

    return uri.queryParameters;
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

    final params = _readSsoTokenParams(uri);
    final accessToken = params['accessToken'];
    final refreshToken = params['refreshToken'];

    if (accessToken != null && refreshToken != null) {
      final storage = ref.read(tokenStorageProvider);
      await storage.write(
        TokenBundle(accessToken: accessToken, refreshToken: refreshToken),
      );
      if (mounted) {
        context.go('/home');
      }
      return true;
    }
    return false;
  }

  String? _mapUriToPath(Uri uri) {
    final segments = uri.pathSegments;
    if (segments.isEmpty) {
      return null;
    }

    switch (segments.first) {
      case 'verify-email':
        final token = uri.queryParameters['token'];
        return token == null ? '/verify-email' : '/verify-email?token=$token';
      case 'reset-password':
        final token = uri.queryParameters['token'];
        return token == null
            ? '/reset-password'
            : '/reset-password?token=$token';
      case 'invite':
        if (segments.length < 2) {
          return null;
        }
        return '/invite/${segments[1]}';
      case 'organizations':
        return '/organizations';
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
