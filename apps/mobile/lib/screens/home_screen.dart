import 'package:flutter/material.dart';

import '../api.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.api, required this.session});

  final ApiClient api;
  final Session session;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _profile;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final profile = await widget.api.me();
      if (mounted) setState(() => _profile = profile);
    } on ApiException {
      // Keep the session data shown; the profile call is a nicety.
    }
  }

  Future<void> _logout() async {
    await widget.api.logout(widget.session.refreshToken);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final email = (_profile ?? widget.session.user)['email'] as String? ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        actions: [
          IconButton(
              onPressed: _logout,
              icon: const Icon(Icons.logout),
              tooltip: 'Sign out'),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome, ${widget.session.displayName}',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(email),
            const SizedBox(height: 24),
            const Text('Next: uploads, jobs and notifications screens.'),
          ],
        ),
      ),
    );
  }
}
