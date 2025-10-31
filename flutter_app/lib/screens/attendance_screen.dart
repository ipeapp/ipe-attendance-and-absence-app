import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/auth_provider.dart';
import '../services/supabase_service.dart';
import '../models/attendance.dart';

class AttendanceScreen extends ConsumerStatefulWidget {
  const AttendanceScreen({super.key});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  List<WorkShift> _shifts = [];
  List<AttendanceRecord> _todayAttendance = [];
  String? _selectedShiftId;
  String _notes = '';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      final supabase = SupabaseService.instance;
      final employee = ref.read(authProvider).employee!;

      final shifts = await supabase.getActiveShifts();
      final today = await supabase.getTodayAttendance(employee.id);

      setState(() {
        _shifts = shifts;
        _todayAttendance = today;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        _showError('خطأ في تحميل البيانات: $e');
      }
    }
  }

  Future<void> _handleCheckIn() async {
    if (_selectedShiftId == null) {
      _showError('يرجى اختيار الفترة');
      return;
    }

    try {
      setState(() => _isLoading = true);
      
      final employee = ref.read(authProvider).employee!;
      await SupabaseService.instance.checkIn(
        employeeId: employee.id,
        shiftId: _selectedShiftId!,
        notes: _notes.isNotEmpty ? _notes : null,
        method: 'manual',
      );

      await _loadData();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'تم تسجيل الحضور بنجاح',
              style: GoogleFonts.cairo(),
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }

      setState(() {
        _selectedShiftId = null;
        _notes = '';
      });
    } catch (e) {
      setState(() => _isLoading = false);
      _showError('خطأ في تسجيل الحضور: $e');
    }
  }

  Future<void> _handleCheckOut() async {
    final record = _todayAttendance.firstWhere(
      (r) => r.checkInTime != null && r.checkOutTime == null,
    );

    try {
      setState(() => _isLoading = true);
      
      await SupabaseService.instance.checkOut(
        recordId: record.id,
        notes: _notes.isNotEmpty ? _notes : null,
      );

      await _loadData();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'تم تسجيل الانصراف بنجاح',
              style: GoogleFonts.cairo(),
            ),
            backgroundColor: Colors.blue,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }

      setState(() => _notes = '');
    } catch (e) {
      setState(() => _isLoading = false);
      _showError('خطأ في تسجيل الانصراف: $e');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: GoogleFonts.cairo()),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasCheckedIn = _todayAttendance.isNotEmpty && 
                         _todayAttendance.first.checkInTime != null;
    final hasCheckedOut = _todayAttendance.isNotEmpty && 
                          _todayAttendance.first.checkOutTime != null;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text('تسجيل الحضور', style: GoogleFonts.cairo()),
          backgroundColor: const Color(0xFF7C3AED),
          foregroundColor: Colors.white,
        ),
        body: RefreshIndicator(
          onRefresh: _loadData,
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Status Card
                      _buildStatusCard(hasCheckedIn, hasCheckedOut),
                      const SizedBox(height: 20),

                      // Check-in/Check-out Form
                      if (!hasCheckedOut) _buildActionCard(hasCheckedIn),
                      
                      const SizedBox(height: 20),
                      
                      // Recent Attendance
                      _buildRecentAttendance(),
                    ],
                  ),
                ),
        ),
      ),
    );
  }

  Widget _buildStatusCard(bool hasCheckedIn, bool hasCheckedOut) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [
              Colors.white,
              const Color(0xFF7C3AED).withOpacity(0.05),
            ],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  hasCheckedOut
                      ? Icons.check_circle
                      : hasCheckedIn
                          ? Icons.pending
                          : Icons.access_time,
                  color: hasCheckedOut
                      ? Colors.blue
                      : hasCheckedIn
                          ? Colors.amber
                          : Colors.grey,
                  size: 32,
                ),
                const SizedBox(width: 12),
                Text(
                  'حالة اليوم',
                  style: GoogleFonts.cairo(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            if (_todayAttendance.isNotEmpty) ...[
              _buildInfoRow(
                'الحالة',
                _todayAttendance.first.statusArabic,
                _getStatusColor(_todayAttendance.first.status),
              ),
              if (_todayAttendance.first.checkInTime != null)
                _buildInfoRow(
                  'وقت الحضور',
                  DateFormat('hh:mm a', 'ar').format(_todayAttendance.first.checkInTime!),
                  Colors.green,
                ),
              if (_todayAttendance.first.checkOutTime != null)
                _buildInfoRow(
                  'وقت الانصراف',
                  DateFormat('hh:mm a', 'ar').format(_todayAttendance.first.checkOutTime!),
                  Colors.blue,
                ),
              if (_todayAttendance.first.lateMinutes > 0)
                _buildInfoRow(
                  'مدة التأخير',
                  '${_todayAttendance.first.lateMinutes} دقيقة',
                  Colors.amber,
                ),
            ] else ...[
              Center(
                child: Text(
                  'لم يتم تسجيل الحضور بعد',
                  style: GoogleFonts.cairo(
                    fontSize: 16,
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.cairo(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              value,
              style: GoogleFonts.cairo(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard(bool hasCheckedIn) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              hasCheckedIn ? 'تسجيل الانصراف' : 'تسجيل الحضور',
              style: GoogleFonts.cairo(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            
            if (!hasCheckedIn) ...[
              Text(
                'اختر الفترة',
                style: GoogleFonts.cairo(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _selectedShiftId,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.grey[50],
                ),
                items: _shifts.map((shift) {
                  return DropdownMenuItem(
                    value: shift.id,
                    child: Text(
                      '${shift.name} (${shift.startTime} - ${shift.endTime})',
                      style: GoogleFonts.cairo(),
                    ),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() => _selectedShiftId = value);
                },
              ),
              const SizedBox(height: 16),
            ],

            Text(
              'ملاحظات (اختياري)',
              style: GoogleFonts.cairo(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              maxLines: 3,
              onChanged: (value) => setState(() => _notes = value),
              decoration: InputDecoration(
                hintText: 'أضف ملاحظات إن وجدت...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: Colors.grey[50],
              ),
            ),
            const SizedBox(height: 24),
            
            ElevatedButton(
              onPressed: hasCheckedIn ? _handleCheckOut : _handleCheckIn,
              style: ElevatedButton.styleFrom(
                backgroundColor: hasCheckedIn ? Colors.blue : const Color(0xFF7C3AED),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                hasCheckedIn ? 'تسجيل الانصراف' : 'تسجيل الحضور',
                style: GoogleFonts.cairo(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentAttendance() {
    return FutureBuilder<List<AttendanceRecord>>(
      future: SupabaseService.instance.getAttendanceHistory(
        ref.read(authProvider).employee!.id,
        limit: 5,
      ),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            ),
          );
        }

        final records = snapshot.data!;
        
        return Card(
          elevation: 4,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'آخر السجلات',
                  style: GoogleFonts.cairo(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                ...records.map((record) => _buildAttendanceItem(record)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildAttendanceItem(AttendanceRecord record) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: _getStatusColor(record.status).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              _getStatusIcon(record.status),
              color: _getStatusColor(record.status),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  DateFormat('EEEE، d MMMM', 'ar').format(record.date),
                  style: GoogleFonts.cairo(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (record.checkInTime != null)
                  Text(
                    DateFormat('hh:mm a', 'ar').format(record.checkInTime!),
                    style: GoogleFonts.cairo(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: _getStatusColor(record.status).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              record.statusArabic,
              style: GoogleFonts.cairo(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: _getStatusColor(record.status),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'present':
        return Colors.green;
      case 'late':
        return Colors.amber;
      case 'absent':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'present':
        return Icons.check_circle;
      case 'late':
        return Icons.warning_amber;
      case 'absent':
        return Icons.cancel;
      default:
        return Icons.help_outline;
    }
  }
}
