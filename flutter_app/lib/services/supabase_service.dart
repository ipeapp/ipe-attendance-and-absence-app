import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/employee.dart';
import '../models/attendance.dart';

class SupabaseService {
  static SupabaseService? _instance;
  static SupabaseService get instance {
    _instance ??= SupabaseService._();
    return _instance!;
  }

  SupabaseService._();

  SupabaseClient get client => Supabase.instance.client;

  // Initialize Supabase
  static Future<void> initialize({
    required String url,
    required String anonKey,
  }) async {
    await Supabase.initialize(
      url: url,
      anonKey: anonKey,
    );
  }

  // Auth Methods
  Future<AuthResponse> signIn(String email, String password) async {
    return await client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  Future<void> signOut() async {
    await client.auth.signOut();
  }

  User? get currentUser => client.auth.currentUser;

  Stream<AuthState> get authStateChanges => client.auth.onAuthStateChange;

  // Employee Methods
  Future<Employee?> getEmployeeByUserId(String userId) async {
    try {
      final response = await client
          .from('employees')
          .select('*, department:departments(*)')
          .eq('user_id', userId)
          .single();
      
      return Employee.fromJson(response);
    } catch (e) {
      print('Error fetching employee: $e');
      return null;
    }
  }

  Future<List<Employee>> getEmployees({
    String? departmentId,
    bool? isActive,
  }) async {
    try {
      var query = client
          .from('employees')
          .select('*, department:departments(*)')
          .order('full_name');

      if (departmentId != null) {
        query = query.eq('department_id', departmentId);
      }

      if (isActive != null) {
        query = query.eq('is_active', isActive);
      }

      final response = await query;
      return (response as List)
          .map((json) => Employee.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching employees: $e');
      return [];
    }
  }

  // Attendance Methods
  Future<List<AttendanceRecord>> getTodayAttendance(String employeeId) async {
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      final response = await client
          .from('attendance_records')
          .select('*, shift:work_shifts(*)')
          .eq('employee_id', employeeId)
          .eq('date', today)
          .order('created_at', ascending: false);

      return (response as List)
          .map((json) => AttendanceRecord.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching today attendance: $e');
      return [];
    }
  }

  Future<List<AttendanceRecord>> getAttendanceHistory(
    String employeeId, {
    int limit = 30,
    String? status,
  }) async {
    try {
      var query = client
          .from('attendance_records')
          .select('*, shift:work_shifts(*)')
          .eq('employee_id', employeeId)
          .order('date', ascending: false)
          .limit(limit);

      if (status != null) {
        query = query.eq('status', status);
      }

      final response = await query;
      return (response as List)
          .map((json) => AttendanceRecord.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching attendance history: $e');
      return [];
    }
  }

  Future<List<AttendanceRecord>> getTeamAttendance(String date) async {
    try {
      final response = await client
          .from('attendance_records')
          .select('*, employee:employees(full_name, employee_number, position), shift:work_shifts(*)')
          .eq('date', date)
          .order('created_at', ascending: false);

      return (response as List)
          .map((json) => AttendanceRecord.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching team attendance: $e');
      return [];
    }
  }

  Future<AttendanceRecord> checkIn({
    required String employeeId,
    required String shiftId,
    String? notes,
    String? location,
    String method = 'manual',
    String? approvedBy,
  }) async {
    try {
      final shift = await getShift(shiftId);
      if (shift == null) throw Exception('Shift not found');

      final now = DateTime.now();
      final today = now.toIso8601String().split('T')[0];
      final currentTime = now.toIso8601String().split('T')[1];
      
      // Calculate late minutes
      final startTime = shift.startTime;
      final gracePeriod = shift.gracePeriodMinutes;
      
      final startParts = startTime.split(':');
      final currentParts = currentTime.split(':');
      
      final startMinutes = int.parse(startParts[0]) * 60 + int.parse(startParts[1]);
      final currentMinutes = int.parse(currentParts[0]) * 60 + int.parse(currentParts[1]);
      
      final lateMinutes = (currentMinutes - startMinutes - gracePeriod).clamp(0, double.infinity).toInt();
      final status = lateMinutes > 0 ? 'late' : 'present';

      final response = await client.from('attendance_records').insert({
        'employee_id': employeeId,
        'date': today,
        'shift_id': shiftId,
        'check_in_time': now.toIso8601String(),
        'status': status,
        'late_minutes': lateMinutes,
        'check_in_method': method,
        'check_in_location': location,
        'notes': notes,
        'approved_by': approvedBy,
      }).select('*, shift:work_shifts(*)').single();

      return AttendanceRecord.fromJson(response);
    } catch (e) {
      print('Error checking in: $e');
      rethrow;
    }
  }

  Future<AttendanceRecord> checkOut({
    required String recordId,
    String? notes,
  }) async {
    try {
      final response = await client
          .from('attendance_records')
          .update({
            'check_out_time': DateTime.now().toIso8601String(),
            'notes': notes,
          })
          .eq('id', recordId)
          .select('*, shift:work_shifts(*)')
          .single();

      return AttendanceRecord.fromJson(response);
    } catch (e) {
      print('Error checking out: $e');
      rethrow;
    }
  }

  // Work Shift Methods
  Future<List<WorkShift>> getActiveShifts() async {
    try {
      final response = await client
          .from('work_shifts')
          .select()
          .eq('is_active', true)
          .order('start_time');

      return (response as List)
          .map((json) => WorkShift.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching shifts: $e');
      return [];
    }
  }

  Future<WorkShift?> getShift(String shiftId) async {
    try {
      final response = await client
          .from('work_shifts')
          .select()
          .eq('id', shiftId)
          .single();

      return WorkShift.fromJson(response);
    } catch (e) {
      print('Error fetching shift: $e');
      return null;
    }
  }

  // Department Methods
  Future<List<Department>> getDepartments() async {
    try {
      final response = await client
          .from('departments')
          .select()
          .order('name');

      return (response as List)
          .map((json) => Department.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching departments: $e');
      return [];
    }
  }

  // Statistics Methods
  Future<Map<String, int>> getMonthlyStats(String employeeId) async {
    try {
      final now = DateTime.now();
      final startOfMonth = DateTime(now.year, now.month, 1);
      final today = now.toIso8601String().split('T')[0];
      
      final response = await client
          .from('attendance_records')
          .select()
          .eq('employee_id', employeeId)
          .gte('date', startOfMonth.toIso8601String().split('T')[0])
          .lte('date', today);

      final records = (response as List);
      final present = records.where((r) => r['status'] == 'present' || r['status'] == 'late').length;
      final absent = records.where((r) => r['status'] == 'absent').length;
      final late = records.where((r) => r['status'] == 'late').length;

      return {
        'total': records.length,
        'present': present,
        'absent': absent,
        'late': late,
      };
    } catch (e) {
      print('Error fetching monthly stats: $e');
      return {
        'total': 0,
        'present': 0,
        'absent': 0,
        'late': 0,
      };
    }
  }

  Future<Map<String, int>> getTeamStats() async {
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      
      final employeesCount = await client
          .from('employees')
          .select('id', const FetchOptions(count: CountOption.exact))
          .eq('is_active', true);

      final presentToday = await client
          .from('attendance_records')
          .select('id', const FetchOptions(count: CountOption.exact))
          .eq('date', today)
          .inFilter('status', ['present', 'late']);

      return {
        'total': employeesCount.count ?? 0,
        'present': presentToday.count ?? 0,
      };
    } catch (e) {
      print('Error fetching team stats: $e');
      return {
        'total': 0,
        'present': 0,
      };
    }
  }
}
