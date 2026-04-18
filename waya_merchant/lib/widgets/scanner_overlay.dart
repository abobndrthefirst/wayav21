import 'package:flutter/material.dart';
import '../theme.dart';

/// Dim overlay with a transparent "hole" in the middle and a green frame
/// with L-shaped corners. The caller passes [frameRect] so we can clip
/// incoming barcode detections to the frame.
class ScannerOverlayPainter extends CustomPainter {
  final Rect frameRect;
  ScannerOverlayPainter({required this.frameRect});

  @override
  void paint(Canvas canvas, Size size) {
    final bg = Paint()..color = Colors.black.withOpacity(0.55);
    final full = Rect.fromLTWH(0, 0, size.width, size.height);

    final path = Path()
      ..addRect(full)
      ..addRRect(RRect.fromRectAndRadius(frameRect, const Radius.circular(20)))
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(path, bg);

    // Corner brackets
    final corner = Paint()
      ..color = WayaColors.green
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    const armLen = 26.0;
    final r = frameRect;

    // top-left
    canvas.drawLine(Offset(r.left, r.top + armLen), Offset(r.left, r.top), corner);
    canvas.drawLine(Offset(r.left, r.top), Offset(r.left + armLen, r.top), corner);
    // top-right
    canvas.drawLine(Offset(r.right - armLen, r.top), Offset(r.right, r.top), corner);
    canvas.drawLine(Offset(r.right, r.top), Offset(r.right, r.top + armLen), corner);
    // bottom-left
    canvas.drawLine(Offset(r.left, r.bottom - armLen), Offset(r.left, r.bottom), corner);
    canvas.drawLine(Offset(r.left, r.bottom), Offset(r.left + armLen, r.bottom), corner);
    // bottom-right
    canvas.drawLine(Offset(r.right - armLen, r.bottom), Offset(r.right, r.bottom), corner);
    canvas.drawLine(Offset(r.right, r.bottom), Offset(r.right, r.bottom - armLen), corner);
  }

  @override
  bool shouldRepaint(covariant ScannerOverlayPainter oldDelegate) =>
      oldDelegate.frameRect != frameRect;
}
