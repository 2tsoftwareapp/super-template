import 'package:flutter/material.dart';
import 'package:mobile_app/core/design/app_colors.dart';
import 'package:mobile_app/core/design/app_radius.dart';
import 'package:mobile_app/core/design/app_spacing.dart';

/// An animated shimmering placeholder used while content loads.
///
/// Use the building blocks directly or [AppSkeleton.line] / [AppSkeleton.box]
/// / [AppSkeleton.circle] for common shapes.
class AppSkeleton extends StatefulWidget {
  const AppSkeleton({
    required this.width,
    required this.height,
    this.borderRadius,
    super.key,
  });

  AppSkeleton.line({
    double width = double.infinity,
    double height = 14,
    Key? key,
  }) : this(
         width: width,
         height: height,
         borderRadius: AppRadius.smR,
         key: key,
       );

  AppSkeleton.box({
    double width = double.infinity,
    double height = 80,
    BorderRadius? borderRadius,
    Key? key,
  }) : this(
         width: width,
         height: height,
         borderRadius: borderRadius ?? AppRadius.lgR,
         key: key,
       );

  AppSkeleton.circle({double size = 44, Key? key})
    : this(width: size, height: size, borderRadius: AppRadius.fullR, key: key);

  final double width;
  final double height;
  final BorderRadius? borderRadius;

  @override
  State<AppSkeleton> createState() => _AppSkeletonState();
}

class _AppSkeletonState extends State<AppSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base = isDark
        ? AppColors.surfaceContainerHighDark
        : AppColors.surfaceContainerHighLight;
    final highlight = isDark
        ? AppColors.surfaceContainerDark
        : AppColors.surfaceContainerLight;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius ?? AppRadius.smR,
            gradient: LinearGradient(
              begin: Alignment(-1 - 2 * _controller.value, 0),
              end: Alignment(1 - 2 * _controller.value, 0),
              colors: [base, highlight, base],
              stops: const [0.1, 0.5, 0.9],
            ),
          ),
        );
      },
    );
  }
}

/// A ready-made skeleton resembling a list of cards. Handy for list loading
/// states: `loading: () => const AppSkeletonList()`.
class AppSkeletonList extends StatelessWidget {
  const AppSkeletonList({this.itemCount = 5, super.key});

  final int itemCount;

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.all(AppSpacing.base),
      itemCount: itemCount,
      separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
      itemBuilder: (_, _) => Row(
        children: [
          AppSkeleton.circle(size: 44),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppSkeleton.line(width: 160),
                const SizedBox(height: AppSpacing.sm),
                AppSkeleton.line(width: double.infinity, height: 10),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
