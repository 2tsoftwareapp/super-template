import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_app/features/invitations/data/invitations_repository.dart';

class AcceptInvitationScreen extends ConsumerStatefulWidget {
  const AcceptInvitationScreen({required this.token, super.key});

  final String token;

  @override
  ConsumerState<AcceptInvitationScreen> createState() =>
      _AcceptInvitationScreenState();
}

class _AcceptInvitationScreenState
    extends ConsumerState<AcceptInvitationScreen> {
  bool _submitting = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _accept());
  }

  Future<void> _accept() async {
    setState(() {
      _submitting = true;
      _message = null;
    });
    try {
      await ref.read(invitationsRepositoryProvider).accept(widget.token);
      if (mounted) {
        setState(() {
          _message = 'Invitation accepted.';
          _submitting = false;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _message = error.toString();
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Accept invitation')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_submitting)
                const CircularProgressIndicator()
              else
                Text(_message ?? 'Processing invitation...'),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () => context.go('/login'),
                child: const Text('Go to sign in'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
