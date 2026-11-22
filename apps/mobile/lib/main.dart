import 'package:flutter/material.dart';

import 'api.dart';
import 'screens/startup_screen.dart';

void main() {
  runApp(const LeanApp());
}

class LeanApp extends StatelessWidget {
  const LeanApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Lean Template',
      theme: ThemeData(colorSchemeSeed: Colors.green, useMaterial3: true),
      home: StartupScreen(api: ApiClient()),
    );
  }
}
