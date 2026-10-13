import 'package:flutter/material.dart';

const brand900 = Color(0xFF183D35);
const brand800 = Color(0xFF245347);
const brand700 = Color(0xFF2F6B59);
const brand100 = Color(0xFFE5F0EA);
const canvas = Color(0xFFF8F7F2);
const surfaceMuted = Color(0xFFF0EFE8);
const ink = Color(0xFF202824);
const inkSecondary = Color(0xFF5B655F);
const border = Color(0xFFDDE2DC);
const accent700 = Color(0xFF9A5A12);
const success = Color(0xFF23734D);

ThemeData buildAppTheme() {
  final colorScheme =
      ColorScheme.fromSeed(
        seedColor: brand900,
        brightness: Brightness.light,
      ).copyWith(
        primary: brand900,
        onPrimary: Colors.white,
        secondary: brand700,
        surface: Colors.white,
        onSurface: ink,
      );

  return ThemeData(
    colorScheme: colorScheme,
    scaffoldBackgroundColor: canvas,
    useMaterial3: true,
    appBarTheme: const AppBarTheme(
      backgroundColor: canvas,
      foregroundColor: brand900,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: border),
      ),
      margin: EdgeInsets.zero,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: border),
      ),
    ),
  );
}
