import 'package:flutter/material.dart';
import 'package:mobile_app/core/widgets/state_views.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: CenterMessage(
        title: 'Restoring session',
        body: 'Checking secure storage and backend session state.',
      ),
    );
  }
}
