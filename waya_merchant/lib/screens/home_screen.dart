import 'package:flutter/material.dart';
import '../i18n.dart';
import '../supabase_client.dart';
import '../theme.dart';
import '../widgets/language_toggle.dart';
import 'scanner_screen.dart';
import 'phone_search_screen.dart';

class HomeScreen extends StatefulWidget {
  final void Function(Locale) onLocaleChanged;
  final Locale currentLocale;
  const HomeScreen({
    super.key,
    required this.onLocaleChanged,
    required this.currentLocale,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _shop;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadShop();
  }

  Future<void> _loadShop() async {
    final userId = WayaSupabase.client.auth.currentUser?.id;
    if (userId == null) return;
    try {
      final shop = await WayaSupabase.client
          .from('shops')
          .select()
          .eq('user_id', userId)
          .maybeSingle();
      if (mounted) setState(() { _shop = shop; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _signOut() async {
    await WayaSupabase.client.auth.signOut();
  }

  void _open(Widget page) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    final name = _shop?['name'] as String? ?? 'home'.tr;
    return Scaffold(
      appBar: AppBar(
        title: Text(name),
        actions: [
          LanguageToggle(
            current: widget.currentLocale,
            onChanged: widget.onLocaleChanged,
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: _signOut,
            tooltip: 'signOut'.tr,
          ),
        ],
      ),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: WayaColors.green))
            : Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 8),
                    _ActionCard(
                      icon: Icons.qr_code_scanner_rounded,
                      label: 'scanCustomer'.tr,
                      primary: true,
                      onTap: () => _open(ScannerScreen(
                        shopId: _shop?['id'] as String?,
                      )),
                    ),
                    const SizedBox(height: 16),
                    _ActionCard(
                      icon: Icons.phone_rounded,
                      label: 'searchByPhone'.tr,
                      primary: false,
                      onTap: () => _open(PhoneSearchScreen(
                        shopId: _shop?['id'] as String?,
                      )),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool primary;
  final VoidCallback onTap;
  const _ActionCard({
    required this.icon,
    required this.label,
    required this.primary,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: primary ? WayaColors.green : WayaColors.bgCard,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: primary ? WayaColors.green : WayaColors.border,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 32, color: primary ? Colors.white : WayaColors.text),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: primary ? Colors.white : WayaColors.text,
                ),
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, size: 16,
                color: primary ? Colors.white : WayaColors.textMuted),
          ],
        ),
      ),
    );
  }
}
