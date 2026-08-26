import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_core/src/widgets/state_views.dart';

class AsyncScreenBody<T> extends StatelessWidget {
  const AsyncScreenBody({
    required this.value,
    required this.data,
    this.loading,
    this.error,
    this.empty,
    this.isEmpty,
    super.key,
  });

  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final Widget? loading;
  final Widget Function(Object error, StackTrace stack)? error;
  final Widget? empty;
  final bool Function(T data)? isEmpty;

  @override
  Widget build(BuildContext context) {
    return value.when(
      loading: () =>
          loading ?? const Center(child: CircularProgressIndicator.adaptive()),
      error: (err, stack) =>
          error?.call(err, stack) ?? AppErrorView(error: err),
      data: (item) {
        if (isEmpty?.call(item) ?? false) {
          return empty ??
              const CenterMessage(
                icon: Icons.inbox_outlined,
                title: 'Nothing here yet',
                body: 'Items will appear here once available.',
              );
        }
        return data(item);
      },
    );
  }
}
