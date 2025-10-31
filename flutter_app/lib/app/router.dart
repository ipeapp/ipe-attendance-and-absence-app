import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../features/attendance/presentation/attendance_screen.dart';
import '../features/auth/presentation/auth_gate.dart';
import '../features/dashboard/presentation/dashboard_screen.dart';
import '../features/employees/presentation/employees_screen.dart';
import '../features/settings/presentation/settings_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/gate',
    routes: [
      GoRoute(
        path: '/gate',
        name: 'auth-gate',
        builder: (context, state) => const AuthGate(),
      ),
      GoRoute(
        path: '/dashboard',
        name: 'dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/attendance',
        name: 'attendance',
        builder: (context, state) => const AttendanceScreen(),
      ),
      GoRoute(
        path: '/employees',
        name: 'employees',
        builder: (context, state) => const EmployeesScreen(),
      ),
      GoRoute(
        path: '/settings',
        name: 'settings',
        builder: (context, state) => const SettingsScreen(),
      ),
    ],
  );
});
