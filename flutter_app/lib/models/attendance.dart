import 'employee.dart';

class AttendanceRecord {
  final String id;
  final String employeeId;
  final DateTime date;
  final String? shiftId;
  final DateTime? checkInTime;
  final DateTime? checkOutTime;
  final String status;
  final int lateMinutes;
  final String? checkInMethod;
  final String? checkInLocation;
  final String? notes;
  final String? approvedBy;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Employee? employee;
  final WorkShift? shift;

  AttendanceRecord({
    required this.id,
    required this.employeeId,
    required this.date,
    this.shiftId,
    this.checkInTime,
    this.checkOutTime,
    required this.status,
    this.lateMinutes = 0,
    this.checkInMethod,
    this.checkInLocation,
    this.notes,
    this.approvedBy,
    required this.createdAt,
    required this.updatedAt,
    this.employee,
    this.shift,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: json['id'] as String,
      employeeId: json['employee_id'] as String,
      date: DateTime.parse(json['date'] as String),
      shiftId: json['shift_id'] as String?,
      checkInTime: json['check_in_time'] != null
          ? DateTime.parse(json['check_in_time'] as String)
          : null,
      checkOutTime: json['check_out_time'] != null
          ? DateTime.parse(json['check_out_time'] as String)
          : null,
      status: json['status'] as String,
      lateMinutes: json['late_minutes'] as int? ?? 0,
      checkInMethod: json['check_in_method'] as String?,
      checkInLocation: json['check_in_location'] as String?,
      notes: json['notes'] as String?,
      approvedBy: json['approved_by'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      employee: json['employee'] != null
          ? Employee.fromJson(json['employee'] as Map<String, dynamic>)
          : null,
      shift: json['shift'] != null
          ? WorkShift.fromJson(json['shift'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employee_id': employeeId,
      'date': date.toIso8601String().split('T')[0],
      'shift_id': shiftId,
      'check_in_time': checkInTime?.toIso8601String(),
      'check_out_time': checkOutTime?.toIso8601String(),
      'status': status,
      'late_minutes': lateMinutes,
      'check_in_method': checkInMethod,
      'check_in_location': checkInLocation,
      'notes': notes,
      'approved_by': approvedBy,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  String get statusArabic {
    switch (status) {
      case 'present':
        return 'حاضر';
      case 'absent':
        return 'غائب';
      case 'late':
        return 'متأخر';
      case 'half_day':
        return 'نصف يوم';
      case 'excused':
        return 'إجازة';
      default:
        return status;
    }
  }
}

class WorkShift {
  final String id;
  final String name;
  final String startTime;
  final String endTime;
  final String shiftType;
  final int gracePeriodMinutes;
  final String? departmentId;
  final bool isActive;
  final DateTime createdAt;

  WorkShift({
    required this.id,
    required this.name,
    required this.startTime,
    required this.endTime,
    required this.shiftType,
    this.gracePeriodMinutes = 15,
    this.departmentId,
    this.isActive = true,
    required this.createdAt,
  });

  factory WorkShift.fromJson(Map<String, dynamic> json) {
    return WorkShift(
      id: json['id'] as String,
      name: json['name'] as String,
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String,
      shiftType: json['shift_type'] as String,
      gracePeriodMinutes: json['grace_period_minutes'] as int? ?? 15,
      departmentId: json['department_id'] as String?,
      isActive: json['is_active'] as bool? ?? true,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'start_time': startTime,
      'end_time': endTime,
      'shift_type': shiftType,
      'grace_period_minutes': gracePeriodMinutes,
      'department_id': departmentId,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
