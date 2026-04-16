import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Tiny bilingual string table. Not using .arb files to keep the app lean —
/// one flat map per locale is easier to edit than intl_*.arb.
class T {
  static Locale _locale = const Locale('en');
  static Locale get locale => _locale;

  static Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString('locale') ?? 'en';
    _locale = Locale(code);
  }

  static Future<void> setLocale(Locale l) async {
    _locale = l;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('locale', l.languageCode);
  }

  static bool get isAr => _locale.languageCode == 'ar';

  static String t(String key) => _s[_locale.languageCode]?[key] ?? _s['en']![key] ?? key;

  static const _s = <String, Map<String, String>>{
    'en': {
      'appTitle': 'Waya Merchant',
      'login': 'Sign in',
      'email': 'Email',
      'password': 'Password',
      'signIn': 'Sign in with email',
      'signInGoogle': 'Continue with Google',
      'signOut': 'Sign out',
      'language': 'Language',
      'english': 'English',
      'arabic': 'العربية',
      'home': 'Home',
      'scanCustomer': 'Scan customer QR',
      'searchByPhone': 'Search by phone',
      'scannerHint': 'Hold the customer\'s QR inside the frame',
      'cameraPermissionDenied': 'Camera permission denied. Enable it in Settings.',
      'invalidCode': 'This QR is not a Waya pass.',
      'customer': 'Customer',
      'phone': 'Phone',
      'currentBalance': 'Current balance',
      'points': 'Points',
      'stamps': 'Stamps',
      'addPoints': 'Add points',
      'addStamp': 'Add stamp',
      'redeemReward': 'Redeem reward',
      'amountToAdd': 'Amount to add',
      'apply': 'Apply',
      'saving': 'Saving…',
      'success': 'Saved. Customer wallet will update momentarily.',
      'notYourCustomer': 'This customer is not in your shop.',
      'passNotFound': 'No pass found for that code.',
      'networkError': 'Network error. Try again.',
      'confirmAdd': 'Add {n} {unit} to {name}?',
      'confirm': 'Confirm',
      'cancel': 'Cancel',
      'scanAgain': 'Scan another',
      'back': 'Back',
      'phoneLookup': 'Enter customer phone',
      'phoneHint': 'Digits only, 05XXXXXXXX',
      'phoneInvalid': 'Not accepted. Saudi mobile starting with 05 (10 digits).',
      'search': 'Search',
      'noResults': 'No customers found with that phone.',
      'emailRequired': 'Email is required.',
      'passwordRequired': 'Password is required.',
      'or': 'or',
    },
    'ar': {
      'appTitle': 'تاجر وايا',
      'login': 'تسجيل الدخول',
      'email': 'البريد الإلكتروني',
      'password': 'كلمة المرور',
      'signIn': 'الدخول بالبريد',
      'signInGoogle': 'المتابعة عبر قوقل',
      'signOut': 'خروج',
      'language': 'اللغة',
      'english': 'English',
      'arabic': 'العربية',
      'home': 'الرئيسية',
      'scanCustomer': 'مسح رمز العميل',
      'searchByPhone': 'بحث بالجوال',
      'scannerHint': 'وجّه كاميرتك نحو رمز العميل داخل الإطار',
      'cameraPermissionDenied': 'تم رفض إذن الكاميرا. فعّله من الإعدادات.',
      'invalidCode': 'هذا الرمز ليس بطاقة وايا.',
      'customer': 'العميل',
      'phone': 'الجوال',
      'currentBalance': 'الرصيد الحالي',
      'points': 'نقاط',
      'stamps': 'أختام',
      'addPoints': 'إضافة نقاط',
      'addStamp': 'إضافة ختم',
      'redeemReward': 'استبدال مكافأة',
      'amountToAdd': 'الكمية المضافة',
      'apply': 'تطبيق',
      'saving': 'جاري الحفظ…',
      'success': 'تم. ستتحدث محفظة العميل خلال لحظات.',
      'notYourCustomer': 'هذا العميل ليس من متجرك.',
      'passNotFound': 'لم يتم العثور على بطاقة.',
      'networkError': 'خطأ في الشبكة. حاول مجددًا.',
      'confirmAdd': 'إضافة {n} {unit} لـ {name}؟',
      'confirm': 'تأكيد',
      'cancel': 'إلغاء',
      'scanAgain': 'مسح عميل آخر',
      'back': 'رجوع',
      'phoneLookup': 'أدخل رقم جوال العميل',
      'phoneHint': 'أرقام فقط، 05XXXXXXXX',
      'phoneInvalid': 'غير مقبول. رقم سعودي يبدأ بـ 05 ويتكون من 10 أرقام.',
      'search': 'بحث',
      'noResults': 'لم يتم العثور على عملاء بهذا الرقم.',
      'emailRequired': 'البريد الإلكتروني مطلوب.',
      'passwordRequired': 'كلمة المرور مطلوبة.',
      'or': 'أو',
    },
  };
}

extension TStr on String {
  String get tr => T.t(this);
}
