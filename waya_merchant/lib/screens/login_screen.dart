import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../i18n.dart';
import '../supabase_client.dart';
import '../theme.dart';
import '../widgets/language_toggle.dart';

class LoginScreen extends StatefulWidget {
  final void Function(Locale) onLocaleChanged;
  final Locale currentLocale;
  const LoginScreen({
    super.key,
    required this.onLocaleChanged,
    required this.currentLocale,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _signInEmail() async {
    if (_email.text.trim().isEmpty) {
      setState(() => _error = 'emailRequired'.tr);
      return;
    }
    if (_password.text.isEmpty) {
      setState(() => _error = 'passwordRequired'.tr);
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await WayaSupabase.client.auth.signInWithPassword(
        email: _email.text.trim(),
        password: _password.text,
      );
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  /// Native Google Sign-In → exchange idToken for Supabase session.
  /// Requires two OAuth clients in Google Cloud: one iOS, one Web.
  /// Pass them via --dart-define (see README.md).
  Future<void> _signInGoogle() async {
    setState(() { _loading = true; _error = null; });
    try {
      final g = GoogleSignIn(
        clientId: WayaSupabase.googleIosClientId.isNotEmpty
            ? WayaSupabase.googleIosClientId
            : null,
        serverClientId: WayaSupabase.googleWebClientId.isNotEmpty
            ? WayaSupabase.googleWebClientId
            : null,
      );
      final account = await g.signIn();
      if (account == null) { setState(() => _loading = false); return; }
      final tokens = await account.authentication;
      if (tokens.idToken == null) {
        throw 'Google did not return an id token';
      }
      await WayaSupabase.client.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: tokens.idToken!,
        accessToken: tokens.accessToken,
      );
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('appTitle'.tr),
        actions: [
          LanguageToggle(
            current: widget.currentLocale,
            onChanged: widget.onLocaleChanged,
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 20),
                // Brand mark
                Center(
                  child: Image.asset(
                    'assets/logo.png',
                    width: 160,
                    height: 160,
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'login'.tr,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 28),
                TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(labelText: 'email'.tr),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _password,
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _signInEmail(),
                  decoration: InputDecoration(labelText: 'password'.tr),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: WayaColors.danger)),
                ],
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _loading ? null : _signInEmail,
                  child: _loading
                      ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text('signIn'.tr),
                ),
                const SizedBox(height: 16),
                Row(children: [
                  const Expanded(child: Divider(color: WayaColors.border)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text('or'.tr, style: const TextStyle(color: WayaColors.textMuted)),
                  ),
                  const Expanded(child: Divider(color: WayaColors.border)),
                ]),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: _loading ? null : _signInGoogle,
                  icon: const Icon(Icons.g_mobiledata, size: 28),
                  label: Text('signInGoogle'.tr),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
