import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

final dashboardMetricsProvider = FutureProvider<DashboardMetrics>((ref) async {
  // Placeholder: in production fetch from Supabase using current user session.
  await Future<void>.delayed(const Duration(milliseconds: 350));

  return DashboardMetrics(
    employeeName: 'أحمد',
    todayStatus: TodayStatus.present(timeString: '08:12 ص'),
    monthly: MonthlyStats(presentDays: 18, absentDays: 2, lateDays: 3, totalDays: 22),
    team: TeamStats(totalEmployees: 24, presentToday: 19, attendanceRatio: 86),
    quickActions: [
      QuickAction(label: 'تسجيل الحضور', icon: Icons.how_to_reg, onTap: (context) => context.push('/attendance')),
      QuickAction(label: 'حضور الفريق', icon: Icons.groups_2, onTap: (context) => context.push('/attendance')),
      QuickAction(label: 'إدارة الموظفين', icon: Icons.manage_accounts, onTap: (context) => context.push('/employees')),
      QuickAction(label: 'التقارير', icon: Icons.bar_chart_rounded, onTap: (context) {}),
    ],
  );
});

class DashboardMetrics {
  DashboardMetrics({
    required this.employeeName,
    required this.todayStatus,
    required this.monthly,
    this.team,
    required this.quickActions,
  });

  final String employeeName;
  final TodayStatus todayStatus;
  final MonthlyStats monthly;
  final TeamStats? team;
  final List<QuickAction> quickActions;

  String get prettyDate => DateFormat.yMMMMEEEEd('ar').format(DateTime.now());
}

sealed class TodayStatus {
  const TodayStatus({required this.label, required this.color, required this.timeString});

  final String label;
  final Color color;
  final String? timeString;

  factory TodayStatus.present({String? timeString}) => TodayStatusPresent(timeString: timeString);
  factory TodayStatus.late({String? timeString, int lateMinutes = 0}) => TodayStatusLate(timeString: timeString, lateMinutes: lateMinutes);
  factory TodayStatus.absent() => TodayStatusAbsent();
}

class TodayStatusPresent extends TodayStatus {
  TodayStatusPresent({String? timeString}) : super(label: 'حاضر', color: Colors.green, timeString: timeString);
}

class TodayStatusLate extends TodayStatus {
  TodayStatusLate({String? timeString, int lateMinutes = 0})
      : super(label: 'متأخر (${lateMinutes}د)', color: Colors.orange, timeString: timeString);
}

class TodayStatusAbsent extends TodayStatus {
  TodayStatusAbsent() : super(label: 'غائب', color: Colors.red, timeString: null);
}

class MonthlyStats {
  const MonthlyStats({required this.presentDays, required this.absentDays, required this.lateDays, required this.totalDays});

  final int presentDays;
  final int absentDays;
  final int lateDays;
  final int totalDays;
}

class TeamStats {
  const TeamStats({required this.totalEmployees, required this.presentToday, required this.attendanceRatio});

  final int totalEmployees;
  final int presentToday;
  final int attendanceRatio;
}

typedef ActionCallback = void Function(BuildContext context);

class QuickAction {
  const QuickAction({required this.label, required this.icon, required this.onTap});

  final String label;
  final IconData icon;
  final ActionCallback onTap;
}
