# دليل الإعداد - تطبيق Flutter للحضور والغياب

## 📋 المتطلبات الأساسية

### 1. تثبيت Flutter
```bash
# تحقق من تثبيت Flutter
flutter --version

# إذا لم يكن مثبتاً، قم بتحميله من:
# https://flutter.dev/docs/get-started/install
```

**الحد الأدنى المطلوب**: Flutter 3.0.0 أو أحدث

### 2. تثبيت محرر الأكواد
- **Android Studio** (موصى به للتطوير على Android)
- **VS Code** مع إضافات Flutter و Dart
- **IntelliJ IDEA**

### 3. إعداد بيئة التطوير

#### للـ Android:
```bash
# تثبيت Android Studio
# تثبيت Android SDK
# إنشاء جهاز افتراضي (AVD)

# تحقق من الإعداد
flutter doctor
```

#### للـ iOS (على Mac فقط):
```bash
# تثبيت Xcode
# تثبيت CocoaPods
sudo gem install cocoapods

# تحقق من الإعداد
flutter doctor
```

---

## 🚀 خطوات الإعداد

### الخطوة 1: استنساخ المشروع

```bash
cd /workspace/flutter_app
```

### الخطوة 2: تثبيت الحزم

```bash
flutter pub get
```

هذا الأمر سيقوم بتحميل جميع الحزم المطلوبة من `pubspec.yaml`.

### الخطوة 3: إعداد Supabase

#### أ. إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ حساب جديد أو سجل الدخول
3. أنشئ مشروع جديد
4. انتظر حتى يتم إعداد المشروع (دقيقة واحدة تقريباً)

#### ب. إعداد قاعدة البيانات

1. اذهب إلى **SQL Editor** في لوحة تحكم Supabase
2. نفذ الـ SQL scripts بالترتيب التالي:
   - `/workspace/scripts/001_create_database_schema.sql`
   - `/workspace/scripts/002_create_rls_policies.sql`
   - `/workspace/scripts/003_seed_initial_data.sql`
   - `/workspace/scripts/004_seed_test_data.sql`

#### ج. إنشاء المستخدمين التجريبيين

1. اذهب إلى **Authentication** → **Users**
2. أضف المستخدمين التاليين:

**المدير**:
- Email: `manager@ipe.com`
- Password: `Test@123456`

**المشرف**:
- Email: `supervisor@ipe.com`
- Password: `Test@123456`

**الموظف**:
- Email: `employee1@ipe.com`
- Password: `Test@123456`

#### د. الحصول على بيانات الاتصال

1. اذهب إلى **Settings** → **API**
2. انسخ:
   - **Project URL**
   - **anon public key**

### الخطوة 4: تحديث بيانات Supabase في التطبيق

افتح ملف `lib/main.dart` وحدث:

```dart
await SupabaseService.initialize(
  url: 'YOUR_SUPABASE_PROJECT_URL',        // ضع هنا Project URL
  anonKey: 'YOUR_SUPABASE_ANON_KEY',       // ضع هنا anon public key
);
```

**مثال**:
```dart
await SupabaseService.initialize(
  url: 'https://abcdefgh.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
);
```

### الخطوة 5: تحديث Android Manifest (اختياري)

افتح `android/app/src/main/AndroidManifest.xml` وتأكد من:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- الأذونات المطلوبة -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.USE_BIOMETRIC"/>
    <uses-permission android:name="android.permission.NFC"/>
    
    <application
        android:label="نظام الحضور - IPE"
        android:icon="@mipmap/ic_launcher">
        <!-- ... -->
    </application>
</manifest>
```

---

## ▶️ تشغيل التطبيق

### على Android:

```bash
# تشغيل على جهاز متصل أو محاكي
flutter run

# أو لـ debug mode
flutter run --debug

# أو لـ release mode
flutter run --release
```

### على iOS (Mac فقط):

```bash
cd ios
pod install
cd ..
flutter run
```

### اختيار جهاز محدد:

```bash
# عرض الأجهزة المتاحة
flutter devices

# التشغيل على جهاز محدد
flutter run -d <device_id>
```

---

## 🔍 اختبار التطبيق

### 1. تسجيل الدخول
- افتح التطبيق
- سجل الدخول باستخدام:
  - Email: `manager@ipe.com`
  - Password: `Test@123456`

### 2. استكشاف المميزات

#### كمدير/مشرف:
1. **لوحة التحكم**: عرض الإحصائيات
2. **إدارة الفريق**: 
   - عرض جميع الموظفين
   - تسجيل حضور فردي
   - تسجيل حضور جماعي
3. **الحضور**: تسجيل الحضور الشخصي
4. **التقارير**: عرض التقارير الشهرية

#### كموظف:
1. **لوحة التحكم**: عرض حالة الحضور
2. **الحضور**: تسجيل الحضور والانصراف
3. **التقارير**: عرض سجل الحضور الشخصي

---

## 🏗️ بناء التطبيق للإنتاج

### Android APK:

```bash
# بناء APK
flutter build apk --release

# الملف الناتج:
# build/app/outputs/flutter-apk/app-release.apk
```

### Android App Bundle (للنشر على Google Play):

```bash
flutter build appbundle --release

# الملف الناتج:
# build/app/outputs/bundle/release/app-release.aab
```

### iOS (Mac فقط):

```bash
flutter build ios --release

# ثم افتح Xcode للنشر
open ios/Runner.xcworkspace
```

---

## 🎨 التخصيص

### تغيير الألوان الأساسية

افتح `lib/utils/constants.dart`:

```dart
class AppConstants {
  static const Color primaryColor = Color(0xFF7C3AED);  // لونك
  static const Color secondaryColor = Color(0xFF9333EA); // لونك
  // ...
}
```

### تغيير اسم التطبيق

**Android**: `android/app/src/main/AndroidManifest.xml`
```xml
<application android:label="اسم تطبيقك">
```

**iOS**: `ios/Runner/Info.plist`
```xml
<key>CFBundleName</key>
<string>اسم تطبيقك</string>
```

### تغيير أيقونة التطبيق

1. ضع صورة الأيقونة في `assets/images/app_icon.png` (1024x1024 px)
2. قم بتشغيل:
```bash
flutter pub run flutter_launcher_icons:main
```

---

## 🐛 حل المشاكل الشائعة

### مشكلة: "Flutter not found"
```bash
# أضف Flutter إلى PATH
export PATH="$PATH:`pwd`/flutter/bin"
```

### مشكلة: "Gradle build failed"
```bash
# نظف المشروع
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
```

### مشكلة: "CocoaPods not installed" (iOS)
```bash
sudo gem install cocoapods
pod setup
```

### مشكلة: بطء التطبيق في وضع Debug
- هذا طبيعي في Debug mode
- استخدم Release mode للاختبار:
```bash
flutter run --release
```

### مشكلة: خطأ في الاتصال بـ Supabase
- تأكد من URL و anon key صحيحين
- تأكد من إعداد RLS policies
- تأكد من وجود اتصال بالإنترنت

---

## 📱 متطلبات الأجهزة

### Android:
- **الحد الأدنى**: Android 5.0 (API level 21)
- **الموصى به**: Android 8.0+ (API level 26+)

### iOS:
- **الحد الأدنى**: iOS 12.0
- **الموصى به**: iOS 14.0+

---

## 📚 موارد إضافية

### التوثيق:
- [Flutter Documentation](https://flutter.dev/docs)
- [Supabase Flutter Documentation](https://supabase.com/docs/guides/getting-started/tutorials/with-flutter)
- [Material Design 3](https://m3.material.io/)

### مجتمع Flutter:
- [Flutter Discord](https://discord.gg/flutter)
- [Flutter Reddit](https://reddit.com/r/FlutterDev)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/flutter)

---

## 🆘 الدعم الفني

إذا واجهت أي مشكلة:

1. **تحقق من flutter doctor**:
```bash
flutter doctor -v
```

2. **تنظيف المشروع**:
```bash
flutter clean
flutter pub get
```

3. **التواصل مع المطور**:
   - **البريد الإلكتروني**: alwalisoftt@gmail.com
   - **الهاتف**: +967777670507
   - **المطور**: الولي سوفت

---

## ✅ قائمة التحقق النهائية

قبل النشر، تأكد من:

- [ ] تحديث Supabase credentials
- [ ] اختبار جميع المميزات
- [ ] اختبار على أجهزة مختلفة
- [ ] بناء التطبيق في Release mode
- [ ] اختبار الأداء
- [ ] مراجعة الأذونات المطلوبة
- [ ] تحديث رقم الإصدار في `pubspec.yaml`
- [ ] إنشاء صور للمتجر (screenshots)
- [ ] كتابة وصف التطبيق

---

**🎉 مبروك! أنت الآن جاهز لاستخدام التطبيق**

للأسئلة والاستفسارات، لا تتردد في التواصل معنا.

**تطوير**: الولي سوفت
**الإصدار**: 1.0.0
**التاريخ**: 2025
