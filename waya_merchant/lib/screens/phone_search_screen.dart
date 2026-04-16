import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../i18n.dart';
import '../supabase_client.dart';
import '../theme.dart';
import 'add_points_screen.dart';

/// Fallback: merchant types the customer's phone, we look up their pass
/// in this shop, then jump to AddPointsScreen.
class PhoneSearchScreen extends StatefulWidget {
  final String? shopId;
  const PhoneSearchScreen({super.key, required this.shopId});

  @override
  State<PhoneSearchScreen> createState() => _PhoneSearchScreenState();
}

class _PhoneSearchScreenState extends State<PhoneSearchScreen> {
  final _phone = TextEditingController();
  bool _searching = false;
  String? _error;
  List<Map<String, dynamic>> _results = [];

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  // Mirror of lib/phone.js in the web app.
  static final _re = RegExp(r'^(?:\+?966|0)?5\d{8}$');
  bool _isValid(String raw) {
    final clean = raw.replaceAll(RegExp(r'[^\d+]'), '');
    return _re.hasMatch(clean);
  }

  /// Normalize to +9665XXXXXXXX (same as _shared/validation.ts).
  String? _normalize(String raw) {
    final clean = raw.replaceAll(RegExp(r'[^\d+]'), '');
    if (!_re.hasMatch(clean)) return null;
    final bare = clean.replaceFirst(RegExp(r'^\+?966'), '').replaceFirst(RegExp(r'^0'), '');
    return '+966$bare';
  }

  Future<void> _search() async {
    final phone = _normalize(_phone.text);
    if (phone == null) {
      setState(() => _error = 'phoneInvalid'.tr);
      return;
    }
    setState(() { _searching = true; _error = null; _results = []; });
    try {
      final rows = await WayaSupabase.client
          .from('customer_passes')
          .select('*, program:loyalty_programs(*), shop:shops(user_id,id,name)')
          .eq('customer_phone', phone)
          .eq('shop_id', widget.shopId as Object);
      final list = (rows as List).cast<Map<String, dynamic>>();
      setState(() => _results = list);
      if (list.isEmpty) setState(() => _error = 'noResults'.tr);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final invalid = _phone.text.isNotEmpty && !_isValid(_phone.text);
    return Scaffold(
      appBar: AppBar(title: Text('searchByPhone'.tr)),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('phoneLookup'.tr, style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                textAlign: TextAlign.left,
                textDirection: TextDirection.ltr,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[\d+]')),
                  LengthLimitingTextInputFormatter(13),
                ],
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: '05XXXXXXXX',
                  errorText: invalid ? 'phoneInvalid'.tr : null,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                invalid ? 'phoneInvalid'.tr : 'phoneHint'.tr,
                style: TextStyle(
                  fontSize: 12,
                  color: invalid ? WayaColors.danger : WayaColors.textMuted,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _searching ? null : _search,
                child: _searching
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text('search'.tr),
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(_error!, style: const TextStyle(color: WayaColors.danger)),
              ],
              const SizedBox(height: 16),
              Expanded(
                child: ListView.separated(
                  itemCount: _results.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final p = _results[i];
                    final program = p['program'] as Map<String, dynamic>?;
                    return InkWell(
                      onTap: () {
                        Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => AddPointsScreen(pass: p),
                        ));
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: WayaColors.bgCard,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: WayaColors.border),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    p['customer_name'] ?? '—',
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    program?['name'] ?? '',
                                    style: const TextStyle(color: WayaColors.textMuted, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: WayaColors.textMuted),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
