import 'package:flutter/material.dart';

import '../api.dart';
import 'home_screen.dart';
import 'login_screen.dart';

/// Restores a stored session before deciding between home and login.
class StartupScreen extends StatefulWidget {
  const StartupScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends State<StartupScreen> {
  late final Future<Session?> _restored = _restore();

  Future<Session?> _restore() async {
    try {
      return await widget.api.restore();
    } on Exception {
      // Offline at launch: fall back to the login form instead of hanging.
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Session?>(
      future: _restored,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
              body: Center(child: CircularProgressIndicator()));
        }

        final session = snapshot.data;

        return session == null
            ? LoginScreen(api: widget.api)
            : HomeScreen(api: widget.api, session: session);
      },
    );
  }
}
