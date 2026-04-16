import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../i18n.dart';
import '../supabase_client.dart';
import '../theme.dart';
import '../widgets/scanner_overlay.dart';
import 'add_points_screen.dart';

/// Scans the customer's loyalty QR. The barcode on the pass encodes the
/// `apple_serial` (set in apple-wallet-public/index.ts). Android passes
/// encode the `google_object_id`. We try both lookups.
///
/// UX: camera fills the screen, a 260×260 rounded frame marks the scan
/// zone, and detections outside that frame are ignored (we clip by
/// Barcode.corners bounds against the frame rect).
class ScannerScreen extends StatefulWidget {
  final String? shopId;
  const ScannerScreen({super.key, required this.shopId});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
    formats: const [BarcodeFormat.qrCode],
  );
  bool _locked = false; // avoid rapid double-handling
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture, Rect frameRect, Size viewSize) async {
    if (_locked) return;
    for (final b in capture.barcodes) {
      final raw = b.rawValue;
      if (raw == null) continue;

      // Only accept codes whose visual bounds sit inside our frame.
      // mobile_scanner gives corners in the view's coordinate space.
      final corners = b.corners;
      if (corners.isNotEmpty) {
        final codeRect = _boundingBox(corners);
        if (!frameRect.contains(codeRect.center)) continue;
      }

      _locked = true;
      await _handleCode(raw);
      if (mounted) _locked = false;
      return;
    }
  }

  Rect _boundingBox(List<Offset> corners) {
    double minX = corners.first.dx, maxX = corners.first.dx;
    double minY = corners.first.dy, maxY = corners.first.dy;
    for (final c in corners) {
      if (c.dx < minX) minX = c.dx;
      if (c.dx > maxX) maxX = c.dx;
      if (c.dy < minY) minY = c.dy;
      if (c.dy > maxY) maxY = c.dy;
    }
    return Rect.fromLTRB(minX, minY, maxX, maxY);
  }

  Future<void> _handleCode(String code) async {
    await _controller.stop();
    try {
      // Try apple_serial first, then google_object_id.
      final row = await WayaSupabase.client
          .from('customer_passes')
          .select('*, program:loyalty_programs(*), shop:shops(user_id,id,name)')
          .or('apple_serial.eq.$code,google_object_id.eq.$code')
          .maybeSingle();
      if (row == null) {
        _showError('passNotFound'.tr);
        return;
      }
      final ownerId = (row['shop'] as Map?)?['user_id'];
      if (ownerId != WayaSupabase.client.auth.currentUser?.id) {
        _showError('notYourCustomer'.tr);
        return;
      }
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => AddPointsScreen(pass: row)),
      );
      await _controller.start();
    } catch (e) {
      _showError('${'networkError'.tr} ($e)');
    }
  }

  void _showError(String msg) {
    setState(() => _error = msg);
    _controller.start();
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _error = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text('scanCustomer'.tr),
        backgroundColor: Colors.transparent,
      ),
      extendBodyBehindAppBar: true,
      body: LayoutBuilder(
        builder: (context, constraints) {
          final size = Size(constraints.maxWidth, constraints.maxHeight);
          final frameSide = size.shortestSide * 0.7;
          final frameRect = Rect.fromCenter(
            center: Offset(size.width / 2, size.height / 2),
            width: frameSide,
            height: frameSide,
          );

          return Stack(
            fit: StackFit.expand,
            children: [
              MobileScanner(
                controller: _controller,
                onDetect: (capture) => _onDetect(capture, frameRect, size),
                errorBuilder: (context, err) {
                  final denied = err.errorCode == MobileScannerErrorCode.permissionDenied;
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Text(
                        denied ? 'cameraPermissionDenied'.tr : '${err.errorDetails?.message ?? err.errorCode.name}',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                  );
                },
              ),
              // Dim + frame
              IgnorePointer(
                child: CustomPaint(
                  painter: ScannerOverlayPainter(frameRect: frameRect),
                ),
              ),
              // Hint + error banner
              Positioned(
                left: 16,
                right: 16,
                bottom: 36,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_error != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: WayaColors.danger,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(_error!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                      )
                    else
                      Text(
                        'scannerHint'.tr,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white, fontSize: 14),
                      ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
