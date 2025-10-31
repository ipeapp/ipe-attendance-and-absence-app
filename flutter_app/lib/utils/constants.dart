import 'package:flutter/material.dart';

class AppConstants {
  // App Info
  static const String appName = 'نظام الحضور والغياب - IPE';
  static const String appVersion = '1.0.0';
  static const String companyName = 'خبراء العطور الدولية';
  static const String developerName = 'الولي سوفت';
  static const String developerPhone = '+967777670507';
  static const String developerEmail = 'alwalisoftt@gmail.com';

  // Colors
  static const Color primaryColor = Color(0xFF7C3AED);
  static const Color secondaryColor = Color(0xFF9333EA);
  static const Color accentColor = Color(0xFFE879F9);
  
  static const Color successColor = Color(0xFF10B981);
  static const Color errorColor = Color(0xFFEF4444);
  static const Color warningColor = Color(0xFFF59E0B);
  static const Color infoColor = Color(0xFF3B82F6);
  
  static const Color presentColor = Color(0xFF10B981);
  static const Color absentColor = Color(0xFFEF4444);
  static const Color lateColor = Color(0xFFF59E0B);
  static const Color completedColor = Color(0xFF3B82F6);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [primaryColor, secondaryColor],
  );

  static const LinearGradient backgroundGradient = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [
      Color(0xFFF3E8FF),
      Color(0xFFE9D5FF),
      Color(0xFFFCE7F3),
    ],
  );

  // Sizes
  static const double borderRadius = 12.0;
  static const double cardBorderRadius = 16.0;
  static const double buttonBorderRadius = 12.0;
  
  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;

  // Durations
  static const Duration animationDuration = Duration(milliseconds: 300);
  static const Duration longAnimationDuration = Duration(milliseconds: 500);
  
  // Defaults
  static const int defaultLimit = 30;
  static const int maxNameLength = 100;
  static const int maxNotesLength = 500;

  // Status
  static const String statusPresent = 'present';
  static const String statusAbsent = 'absent';
  static const String statusLate = 'late';
  static const String statusHalfDay = 'half_day';
  static const String statusExcused = 'excused';

  // Roles
  static const String roleManager = 'manager';
  static const String roleSupervisor = 'supervisor';
  static const String roleEmployee = 'employee';

  // Check-in Methods
  static const String methodLocation = 'location';
  static const String methodFingerprint = 'fingerprint';
  static const String methodNFC = 'nfc';
  static const String methodSupervisor = 'supervisor';
  static const String methodManual = 'manual';
}

class AppStyles {
  static TextStyle heading1(BuildContext context) {
    return Theme.of(context).textTheme.headlineLarge!.copyWith(
      fontWeight: FontWeight.bold,
    );
  }

  static TextStyle heading2(BuildContext context) {
    return Theme.of(context).textTheme.headlineMedium!.copyWith(
      fontWeight: FontWeight.bold,
    );
  }

  static TextStyle heading3(BuildContext context) {
    return Theme.of(context).textTheme.headlineSmall!.copyWith(
      fontWeight: FontWeight.w600,
    );
  }

  static TextStyle body1(BuildContext context) {
    return Theme.of(context).textTheme.bodyLarge!;
  }

  static TextStyle body2(BuildContext context) {
    return Theme.of(context).textTheme.bodyMedium!;
  }

  static TextStyle caption(BuildContext context) {
    return Theme.of(context).textTheme.bodySmall!.copyWith(
      color: Colors.grey[600],
    );
  }
}

class AppStrings {
  // Common
  static const String loading = 'جاري التحميل...';
  static const String error = 'حدث خطأ';
  static const String success = 'تم بنجاح';
  static const String confirm = 'تأكيد';
  static const String cancel = 'إلغاء';
  static const String save = 'حفظ';
  static const String delete = 'حذف';
  static const String edit = 'تعديل';
  static const String search = 'بحث';
  static const String filter = 'تصفية';
  static const String refresh = 'تحديث';
  
  // Auth
  static const String login = 'تسجيل الدخول';
  static const String logout = 'تسجيل الخروج';
  static const String email = 'البريد الإلكتروني';
  static const String password = 'كلمة المرور';
  
  // Attendance
  static const String checkIn = 'تسجيل الحضور';
  static const String checkOut = 'تسجيل الانصراف';
  static const String attendance = 'الحضور';
  static const String attendanceHistory = 'سجل الحضور';
  static const String todayAttendance = 'حضور اليوم';
  
  // Status
  static const String present = 'حاضر';
  static const String absent = 'غائب';
  static const String late = 'متأخر';
  static const String completed = 'مكتمل';
  
  // Dashboard
  static const String dashboard = 'لوحة التحكم';
  static const String statistics = 'الإحصائيات';
  static const String reports = 'التقارير';
  static const String teamManagement = 'إدارة الفريق';
  
  // Employees
  static const String employees = 'الموظفون';
  static const String employeeNumber = 'رقم الموظف';
  static const String department = 'القسم';
  static const String position = 'المسمى الوظيفي';
  
  // Time
  static const String checkInTime = 'وقت الحضور';
  static const String checkOutTime = 'وقت الانصراف';
  static const String lateMinutes = 'مدة التأخير';
  static const String shift = 'الفترة';
  
  // Reports
  static const String monthlyReport = 'تقرير شهري';
  static const String attendanceRate = 'نسبة الحضور';
  static const String presentDays = 'أيام الحضور';
  static const String absentDays = 'أيام الغياب';
  static const String lateDays = 'أيام التأخير';
}
