import 'package:flutter/material.dart';
import '../i18n.dart';
import '../theme.dart';

/// Compact EN/AR toggle shown in the AppBar on every screen.
class LanguageToggle extends StatelessWidget {
  final Locale current;
  final void Function(Locale) onChanged;
  const LanguageToggle({
    super.key,
    required this.current,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isAr = current.languageCode == 'ar';
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 12),
      child: InkWell(
        onTap: () => onChanged(isAr ? const Locale('en') : const Locale('ar')),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: WayaColors.border),
          ),
          child: Text(
            isAr ? 'EN' : 'ع',
            style: const TextStyle(
              color: WayaColors.text,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}
