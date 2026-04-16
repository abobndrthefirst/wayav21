import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:uuid/uuid.dart';

import '../i18n.dart';
import '../supabase_client.dart';
import '../theme.dart';

/// Shows the scanned customer and lets the merchant add points/stamps
/// or redeem the reward. Calls the `points-update` edge function, which
/// mutates customer_passes and enqueues APNs + Google Wallet pushes
/// (so the card in the wallet updates within seconds).
class AddPointsScreen extends StatefulWidget {
  final Map<String, dynamic> pass;
  const AddPointsScreen({super.key, required this.pass});

  @override
  State<AddPointsScreen> createState() => _AddPointsScreenState();
}

class _AddPointsScreenState extends State<AddPointsScreen> {
  final _amount = TextEditingController(text: '1');
  bool _submitting = false;
  String? _error;
  String? _success;

  late Map<String, dynamic> _pass;
  Map<String, dynamic>? get _program => _pass['program'] as Map<String, dynamic>?;

  String get _loyaltyType =>
      (_program?['loyalty_type'] as String?) ?? 'stamp';

  @override
  void initState() {
    super.initState();
    _pass = Map<String, dynamic>.from(widget.pass);
  }

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  Future<void> _apply({required String action}) async {
    final raw = int.tryParse(_amount.text.trim()) ?? 0;
    if (raw <= 0 && action != 'redeem_reward') {
      setState(() => _error = 'Enter a positive number');
      return;
    }
    setState(() { _submitting = true; _error = null; _success = null; });

    final body = <String, dynamic>{
      'pass_id': _pass['id'],
      'action': action,
    };
    if (action == 'add_points') body['points_delta'] = raw;
    if (action == 'add_stamp') body['stamps_delta'] = raw;
    if (action == 'redeem_reward') {
      body['action'] = 'redeem_reward';
      if (_loyaltyType == 'stamp') body['set_stamps'] = 0;
      else body['set_points'] = 0;
    }

    try {
      final idempotencyKey = const Uuid().v4();
      final res = await WayaSupabase.client.functions.invoke(
        'points-update',
        body: body,
        headers: {'x-idempotency-key': idempotencyKey},
      );
      final data = res.data as Map<String, dynamic>? ?? {};
      if (data['success'] != true) {
        throw data['error'] ?? 'Unknown error';
      }
      final updated = data['pass'] as Map<String, dynamic>?;
      if (updated != null) {
        setState(() {
          _pass = {..._pass, ...updated};
        });
      }
      setState(() { _success = 'success'.tr; });
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = (_pass['customer_name'] as String?) ?? '—';
    final phone = (_pass['customer_phone'] as String?) ?? '';
    final points = _pass['points'] as int? ?? 0;
    final stamps = _pass['stamps'] as int? ?? 0;
    final isStamp = _loyaltyType == 'stamp';
    final unit = isStamp ? 'stamps'.tr : 'points'.tr;

    return Scaffold(
      appBar: AppBar(title: Text('customer'.tr)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Customer header card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: WayaColors.bgCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: WayaColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(phone, style: const TextStyle(color: WayaColors.textMuted)),
                    const SizedBox(height: 16),
                    Text('currentBalance'.tr, style: const TextStyle(color: WayaColors.textMuted, fontSize: 12)),
                    const SizedBox(height: 6),
                    Text(
                      isStamp ? '$stamps $unit' : '$points $unit',
                      style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: WayaColors.green),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Text('amountToAdd'.tr, style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              TextField(
                controller: _amount,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              Row(children: [
                for (final n in [1, 5, 10])
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: n == 5 ? 8 : 0),
                      child: OutlinedButton(
                        onPressed: _submitting ? null : () => setState(() => _amount.text = '$n'),
                        child: Text('+$n'),
                      ),
                    ),
                  ),
              ]),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _submitting ? null : () => _apply(action: isStamp ? 'add_stamp' : 'add_points'),
                child: _submitting
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(isStamp ? 'addStamp'.tr : 'addPoints'.tr),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: _submitting ? null : () => _apply(action: 'redeem_reward'),
                child: Text('redeemReward'.tr),
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Text(_error!, style: const TextStyle(color: WayaColors.danger)),
              ],
              if (_success != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: WayaColors.green.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: WayaColors.green),
                  ),
                  child: Text(_success!, style: const TextStyle(color: WayaColors.green, fontWeight: FontWeight.w600)),
                ),
              ],
              const SizedBox(height: 20),
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text('scanAgain'.tr),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
