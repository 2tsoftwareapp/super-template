import 'package:material_ui/material_ui.dart';

import '../api.dart';
import 'login_screen.dart';

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
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    try {
      await widget.api.logout();
    } on Exception {
      messenger.showSnackBar(const SnackBar(
          content:
              Text('Signed out on this device; the server was unreachable.')));
    }

    if (!mounted) return;

    await navigator.pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => LoginScreen(api: widget.api)),
      (_) => false,
    );
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
