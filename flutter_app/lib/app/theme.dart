import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final appThemeProvider = Provider<_AppTheme>((ref) {
  final baseScheme = FlexScheme.deepBlue;
  final fontFamily = GoogleFonts.cairo().fontFamily;

  final light = FlexThemeData.light(
    scheme: baseScheme,
    surfaceMode: FlexSurfaceMode.levelSurfacesLowScaffold,
    blendLevel: 12,
    subThemesData: const FlexSubThemesData(
      elevatedButtonRadius: 20,
      outlinedButtonRadius: 20,
      cardRadius: 18,
      dialogRadius: 20,
      inputDecoratorRadius: 18,
    ),
    visualDensity: VisualDensity.adaptivePlatformDensity,
    fontFamily: fontFamily,
  );

  final dark = FlexThemeData.dark(
    scheme: baseScheme,
    surfaceMode: FlexSurfaceMode.levelSurfacesLowScaffold,
    blendLevel: 18,
    subThemesData: const FlexSubThemesData(
      elevatedButtonRadius: 20,
      outlinedButtonRadius: 20,
      cardRadius: 18,
      dialogRadius: 20,
      inputDecoratorRadius: 18,
    ),
    visualDensity: VisualDensity.adaptivePlatformDensity,
    fontFamily: fontFamily,
  );

  return _AppTheme(light: light, dark: dark);
});

class _AppTheme {
  const _AppTheme({required this.light, required this.dark});

  final ThemeData light;
  final ThemeData dark;
}
