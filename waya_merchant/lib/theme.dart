import 'package:flutter/material.dart';

/// Brand tokens — light theme
class WayaColors {
  static const green = Color(0xFF10B981);
  static const greenDark = Color(0xFF059669);
  static const bg = Color(0xFFFFFFFF);
  static const bgCard = Color(0xFFF7F7F8);
  static const border = Color(0xFFE5E7EB);
  static const text = Color(0xFF0B0A09);
  static const textMuted = Color(0xFF6B7280);
  static const danger = Color(0xFFE11D48);
}

ThemeData buildDarkTheme() {
  final scheme = ColorScheme.light(
    primary: WayaColors.green,
    secondary: WayaColors.greenDark,
    surface: WayaColors.bgCard,
    error: WayaColors.danger,
    onPrimary: Colors.white,
    onSurface: WayaColors.text,
  );
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: WayaColors.bg,
    colorScheme: scheme,
    fontFamily: 'SF Pro Text',
    appBarTheme: const AppBarTheme(
      backgroundColor: WayaColors.bg,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        color: WayaColors.text,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      iconTheme: IconThemeData(color: WayaColors.text),
    ),
    cardTheme: CardThemeData(
      color: WayaColors.bgCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: WayaColors.border),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: WayaColors.green,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: WayaColors.text,
        minimumSize: const Size.fromHeight(52),
        side: const BorderSide(color: WayaColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: WayaColors.bgCard,
      hintStyle: const TextStyle(color: WayaColors.textMuted),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WayaColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WayaColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WayaColors.green, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WayaColors.danger),
      ),
    ),
  );
}
