import 'package:material_ui/material_ui.dart';

import '../api.dart';
import '../models.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, required this.api});

  final ApiClient api;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification>? _items;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final items = await widget.api.notifications();
      if (!mounted) return;
      setState(() {
        _items = items;
        _error = null;
      });
    } on Exception catch (error) {
      if (mounted) setState(() => _error = error.toString());
    }
  }

  Future<void> _open(AppNotification item) async {
    if (item.read) return;

    try {
      await widget.api.markRead(item.id);
      await _load();
    } on Exception catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: RefreshIndicator(onRefresh: _load, child: _body(context)),
    );
  }

  Widget _body(BuildContext context) {
    final items = _items;

    if (_error != null && items == null) {
      return ListView(children: [ListTile(title: Text(_error ?? ''))]);
    }
    if (items == null) {
      return const Center(child: CircularProgressIndicator());
    }
    if (items.isEmpty) {
      return ListView(
          children: const [ListTile(title: Text('No notifications yet.'))]);
    }

    return ListView.separated(
      itemCount: items.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (_, index) {
        final item = items[index];
        return ListTile(
          leading: Icon(item.read ? Icons.drafts : Icons.mark_email_unread),
          title: Text(item.title,
              style: TextStyle(
                  fontWeight: item.read ? FontWeight.normal : FontWeight.bold)),
          subtitle: Text(item.body),
          onTap: () => _open(item),
        );
      },
    );
  }
}
