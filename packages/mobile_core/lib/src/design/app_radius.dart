import 'package:flutter/material.dart';

/// Border-radius tokens — use consistently across components.
abstract final class AppRadius {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double full = 9999;

  static final xsR = BorderRadius.circular(xs);
  static final smR = BorderRadius.circular(sm);
  static final mdR = BorderRadius.circular(md);
  static final lgR = BorderRadius.circular(lg);
  static final xlR = BorderRadius.circular(xl);
  static final xxlR = BorderRadius.circular(xxl);
  static final fullR = BorderRadius.circular(full);
}
