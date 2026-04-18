import 'package:supabase_flutter/supabase_flutter.dart';

/// Central Supabase client. The URL + anon key come from --dart-define so
/// keys never ship in source. See README.md for the build command.
class WayaSupabase {
  static late final SupabaseClient client;

  static Future<void> init() async {
    const url = String.fromEnvironment('SUPABASE_URL');
    const anon = String.fromEnvironment('SUPABASE_ANON_KEY');
    assert(url.isNotEmpty, 'SUPABASE_URL missing. Pass via --dart-define.');
    assert(anon.isNotEmpty, 'SUPABASE_ANON_KEY missing. Pass via --dart-define.');
    await Supabase.initialize(
      url: url,
      anonKey: anon,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
    client = Supabase.instance.client;
  }

  static String get functionsBase {
    const url = String.fromEnvironment('SUPABASE_URL');
    return '$url/functions/v1';
  }

  /// Google OAuth web client id — needed by google_sign_in to exchange the
  /// ID token for a Supabase session. Create an "iOS OAuth client" in GCP
  /// and a "Web" one; paste the web client id here.
  static const googleWebClientId = String.fromEnvironment('GOOGLE_WEB_CLIENT_ID');
  static const googleIosClientId = String.fromEnvironment('GOOGLE_IOS_CLIENT_ID');
}
