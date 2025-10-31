import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';

final todayAttendanceProvider = FutureProvider<TodayAttendance>((ref) async {
  await Future<void>.delayed(const Duration(milliseconds: 250));

  return TodayAttendance(
    availableShifts: const [
      ShiftOption(id: 'shift-1', name: 'صباحي', start: '08:00', end: '16:00'),
      ShiftOption(id: 'shift-2', name: 'مسائي', start: '16:00', end: '00:00'),
    ],
    records: [
      TodayAttendanceRecord(
        id: 'record-1',
        shiftName: 'صباحي',
        status: AttendanceStatus.present,
        checkIn: DateTime.now().subtract(const Duration(hours: 1)),
        notes: 'وصل عبر البوابة الرئيسية',
      ),
    ],
  );
});

final attendanceHistoryProvider = FutureProvider<List<AttendanceRecord>>((ref) async {
  await Future<void>.delayed(const Duration(milliseconds: 300));
  final now = DateTime.now();

  return List.generate(10, (index) {
    final date = now.subtract(Duration(days: index));
    final status = index % 4 == 0
        ? AttendanceStatus.absent
        : index % 3 == 0
            ? AttendanceStatus.late
            : AttendanceStatus.present;
    return AttendanceRecord(
      id: 'history-$index',
      date: date,
      status: status,
      shiftName: 'صباحي',
      notes: status == AttendanceStatus.late ? 'تأخر ${10 + index} دقيقة' : null,
    );
  });
});

final teamAttendanceProvider = FutureProvider<List<TeamAttendanceRecord>>((ref) async {
  await Future<void>.delayed(const Duration(milliseconds: 280));

  return [
    TeamAttendanceRecord(
      id: 'team-1',
      employeeName: 'سارة محمد',
      employeeNumber: 'EMP-1021',
      shiftName: 'صباحي',
      status: AttendanceStatus.present,
    ),
    TeamAttendanceRecord(
      id: 'team-2',
      employeeName: 'خالد إبراهيم',
      employeeNumber: 'EMP-1044',
      shiftName: 'صباحي',
      status: AttendanceStatus.late,
      lateMinutes: 12,
    ),
  ];
});

final attendanceActionControllerProvider = Provider<AttendanceActionController>((ref) {
  return AttendanceActionController();
});

class AttendanceActionController {
  Future<void> checkIn({required String shiftId, String? notes}) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
  }

  Future<void> checkOut({required String recordId, String? notes}) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
  }

  Future<void> markTeamPresent(List<String> recordIds) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
  }

  Future<void> markTeamAbsent(List<String> recordIds) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
  }
}

class TodayAttendance {
  const TodayAttendance({required this.availableShifts, required this.records});

  final List<ShiftOption> availableShifts;
  final List<TodayAttendanceRecord> records;
}

class ShiftOption {
  const ShiftOption({required this.id, required this.name, required this.start, required this.end});

  final String id;
  final String name;
  final String start;
  final String end;

  String get timeWindow => '$start - $end';
}

class TodayAttendanceRecord {
  const TodayAttendanceRecord({
    required this.id,
    required this.shiftName,
    required this.status,
    this.checkIn,
    this.checkOut,
    this.notes,
  });

  final String id;
  final String shiftName;
  final AttendanceStatus status;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final String? notes;

  bool get canCheckOut => checkIn != null && checkOut == null;

  String get detail {
    final buffer = <String>[];
    if (checkIn != null) {
      buffer.add('حضور: ${DateFormat.jm('ar').format(checkIn!)}');
    }
    if (checkOut != null) {
      buffer.add('انصراف: ${DateFormat.jm('ar').format(checkOut!)}');
    }
    if (notes != null) {
      buffer.add(notes!);
    }
    return buffer.join(' • ');
  }
}

class AttendanceRecord {
  const AttendanceRecord({
    required this.id,
    required this.date,
    required this.status,
    required this.shiftName,
    this.notes,
  });

  final String id;
  final DateTime date;
  final AttendanceStatus status;
  final String shiftName;
  final String? notes;

  String get dateString => DateFormat.yMMMMd('ar').format(date);
  String get statusLabel => status.label;
}

class TeamAttendanceRecord {
  const TeamAttendanceRecord({
    required this.id,
    required this.employeeName,
    required this.employeeNumber,
    required this.shiftName,
    required this.status,
    this.lateMinutes,
  });

  final String id;
  final String employeeName;
  final String employeeNumber;
  final String shiftName;
  final AttendanceStatus status;
  final int? lateMinutes;

  String get initials {
    if (employeeName.isEmpty) return '--';
    final parts = employeeName.split(' ').where((element) => element.isNotEmpty).take(2);
    return parts
        .map((part) => part.isEmpty
            ? ''
            : String.fromCharCode(part.runes.first))
        .join();
  }

  String get statusLabel => lateMinutes != null ? '${status.label} (${lateMinutes}د)' : status.label;
  Color get statusColor => status.color;
}

enum AttendanceStatus { present, late, absent }

extension AttendanceStatusExt on AttendanceStatus {
  String get label => switch (this) {
        AttendanceStatus.present => 'حاضر',
        AttendanceStatus.late => 'متأخر',
        AttendanceStatus.absent => 'غائب',
      };

  Color get color => switch (this) {
        AttendanceStatus.present => Colors.green,
        AttendanceStatus.late => Colors.orange,
        AttendanceStatus.absent => Colors.red,
      };

  IconData get icon => switch (this) {
        AttendanceStatus.present => Icons.task_alt,
        AttendanceStatus.late => Icons.access_time,
        AttendanceStatus.absent => Icons.cancel_outlined,
      };
}
