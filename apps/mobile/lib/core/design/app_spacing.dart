import 'package:flutter/material.dart';

/// 4dp-base spacing grid used throughout the app.
abstract final class AppSpacing {
  static const double xxs = 2;
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double base = 16;
  static const double lg = 20;
  static const double xl = 24;
  static const double xxl = 32;
  static const double xxxl = 40;
  static const double huge = 48;
  static const double massive = 64;

  // Common insets
  static const screenH = EdgeInsets.symmetric(horizontal: base);
  static const screenV = EdgeInsets.symmetric(vertical: base);
  static const screen = EdgeInsets.all(base);
  static const screenXl = EdgeInsets.all(xl);
  static const cardPadding = EdgeInsets.all(base);
  static const cardPaddingLg = EdgeInsets.all(xl);
  static const listTileH = EdgeInsets.symmetric(horizontal: base);
  static const listTileV = EdgeInsets.symmetric(vertical: md);
}
