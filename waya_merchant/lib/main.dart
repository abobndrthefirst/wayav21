import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'i18n.dart';
import 'supabase_client.dart';
import 'theme.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await T.load();
  await WayaSupabase.init();
  runApp(const WayaApp());
}

class WayaApp extends StatefulWidget {
  const WayaApp({super.key});

  @override
  State<WayaApp> createState() => _WayaAppState();
}

class _WayaAppState extends State<WayaApp> {
  Locale _locale = T.locale;

  void _setLocale(Locale l) {
    setState(() => _locale = l);
    T.setLocale(l);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Waya Merchant',
      debugShowCheckedModeBanner: false,
      theme: buildDarkTheme(),
      locale: _locale,
      supportedLocales: const [Locale('en'), Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: AuthGate(onLocaleChanged: _setLocale, currentLocale: _locale),
      builder: (context, child) {
        // Force RTL for Arabic even if system is LTR.
        return Directionality(
          textDirection: _locale.languageCode == 'ar'
              ? TextDirection.rtl
              : TextDirection.ltr,
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}

/// Listens to Supabase auth state and swaps between Login and Home.
class AuthGate extends StatelessWidget {
  final void Function(Locale) onLocaleChanged;
  final Locale currentLocale;
  const AuthGate({
    super.key,
    required this.onLocaleChanged,
    required this.currentLocale,
  });

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: WayaSupabase.client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        final session = WayaSupabase.client.auth.currentSession;
        if (session == null) {
          return LoginScreen(
            onLocaleChanged: onLocaleChanged,
            currentLocale: currentLocale,
          );
        }
        return HomeScreen(
          onLocaleChanged: onLocaleChanged,
          currentLocale: currentLocale,
        );
      },
    );
  }
}
