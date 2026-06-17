import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_app/core/widgets/state_views.dart';

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
          loading ?? const Center(child: CircularProgressIndicator()),
      error: (err, stack) =>
          error?.call(err, stack) ??
          CenterMessage(title: 'Something went wrong', body: err.toString()),
      data: (item) {
        if (isEmpty?.call(item) ?? false) {
          return empty ?? const CenterMessage(title: 'Nothing here yet');
        }
        return data(item);
      },
    );
  }
}
