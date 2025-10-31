import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/auth_provider.dart';
import '../services/supabase_service.dart';
import '../models/employee.dart';
import '../models/attendance.dart';

class SupervisorAttendanceScreen extends ConsumerStatefulWidget {
  const SupervisorAttendanceScreen({super.key});

  @override
  ConsumerState<SupervisorAttendanceScreen> createState() => _SupervisorAttendanceScreenState();
}

class _SupervisorAttendanceScreenState extends ConsumerState<SupervisorAttendanceScreen> {
  List<Employee> _employees = [];
  List<AttendanceRecord> _todayAttendance = [];
  List<WorkShift> _shifts = [];
  String _searchQuery = '';
  String _filterStatus = 'all';
  Set<String> _selectedEmployees = {};
  String? _selectedShiftId;
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
      final today = DateTime.now().toIso8601String().split('T')[0];

      // Load employees (filter by department for supervisors)
      final employees = await supabase.getEmployees(
        departmentId: employee.role == 'supervisor' ? employee.departmentId : null,
        isActive: true,
      );
      
      // Load today's attendance
      final attendance = await supabase.getTeamAttendance(today);
      
      // Load shifts
      final shifts = await supabase.getActiveShifts();

      setState(() {
        _employees = employees;
        _todayAttendance = attendance;
        _shifts = shifts;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        _showError('خطأ في تحميل البيانات: $e');
      }
    }
  }

  Map<String, int> get _stats {
    final total = _employees.length;
    final present = _employees.where((e) {
      final att = _getEmployeeAttendance(e.id);
      return att != null && att.checkInTime != null && att.checkOutTime == null;
    }).length;
    final absent = _employees.where((e) {
      final att = _getEmployeeAttendance(e.id);
      return att == null || att.checkInTime == null;
    }).length;
    final late = _employees.where((e) {
      final att = _getEmployeeAttendance(e.id);
      return att != null && att.status == 'late';
    }).length;
    final completed = _employees.where((e) {
      final att = _getEmployeeAttendance(e.id);
      return att != null && att.checkOutTime != null;
    }).length;

    return {
      'total': total,
      'present': present,
      'absent': absent,
      'late': late,
      'completed': completed,
    };
  }

  List<Employee> get _filteredEmployees {
    return _employees.where((emp) {
      // Search filter
      final matchesSearch = emp.fullName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          emp.employeeNumber.toLowerCase().contains(_searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // Status filter
      if (_filterStatus == 'all') return true;

      final attendance = _getEmployeeAttendance(emp.id);
      
      switch (_filterStatus) {
        case 'present':
          return attendance != null && attendance.checkInTime != null && attendance.checkOutTime == null;
        case 'absent':
          return attendance == null || attendance.checkInTime == null;
        case 'late':
          return attendance != null && attendance.status == 'late';
        case 'completed':
          return attendance != null && attendance.checkOutTime != null;
        default:
          return true;
      }
    }).toList();
  }

  AttendanceRecord? _getEmployeeAttendance(String employeeId) {
    try {
      return _todayAttendance.firstWhere((att) => att.employeeId == employeeId);
    } catch (e) {
      return null;
    }
  }

  Future<void> _handleCheckIn(Employee employee) async {
    final shift = await _showShiftDialog();
    if (shift == null) return;

    try {
      await SupabaseService.instance.checkIn(
        employeeId: employee.id,
        shiftId: shift,
        method: 'supervisor',
        approvedBy: ref.read(authProvider).employee!.id,
      );

      await _loadData();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'تم تسجيل حضور ${employee.fullName}',
              style: GoogleFonts.cairo(),
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      _showError('خطأ في تسجيل الحضور: $e');
    }
  }

  Future<void> _handleCheckOut(Employee employee) async {
    final attendance = _getEmployeeAttendance(employee.id);
    if (attendance == null) return;

    try {
      await SupabaseService.instance.checkOut(recordId: attendance.id);

      await _loadData();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'تم تسجيل انصراف ${employee.fullName}',
              style: GoogleFonts.cairo(),
            ),
            backgroundColor: Colors.blue,
          ),
        );
      }
    } catch (e) {
      _showError('خطأ في تسجيل الانصراف: $e');
    }
  }

  Future<void> _handleBulkCheckIn() async {
    if (_selectedEmployees.isEmpty || _selectedShiftId == null) {
      _showError('يرجى اختيار الموظفين والفترة');
      return;
    }

    try {
      final supervisorId = ref.read(authProvider).employee!.id;
      
      for (final empId in _selectedEmployees) {
        await SupabaseService.instance.checkIn(
          employeeId: empId,
          shiftId: _selectedShiftId!,
          method: 'supervisor',
          approvedBy: supervisorId,
        );
      }

      await _loadData();
      
      setState(() {
        _selectedEmployees.clear();
        _selectedShiftId = null;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'تم تسجيل حضور ${_selectedEmployees.length} موظف',
              style: GoogleFonts.cairo(),
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      _showError('خطأ في التسجيل الجماعي: $e');
    }
  }

  Future<String?> _showShiftDialog() async {
    return await showDialog<String>(
      context: context,
      builder: (context) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          title: Text('اختر الفترة', style: GoogleFonts.cairo()),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: _shifts.map((shift) => RadioListTile<String>(
              title: Text(
                '${shift.name} (${shift.startTime} - ${shift.endTime})',
                style: GoogleFonts.cairo(),
              ),
              value: shift.id,
              groupValue: _selectedShiftId,
              onChanged: (value) {
                Navigator.pop(context, value);
              },
            )).toList(),
          ),
        ),
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: GoogleFonts.cairo()),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text('إدارة حضور الفريق', style: GoogleFonts.cairo()),
          backgroundColor: const Color(0xFF7C3AED),
          foregroundColor: Colors.white,
        ),
        body: RefreshIndicator(
          onRefresh: _loadData,
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : Column(
                  children: [
                    // Stats Cards
                    _buildStatsSection(),
                    
                    // Bulk Actions
                    if (_selectedEmployees.isNotEmpty) _buildBulkActions(),
                    
                    // Search and Filter
                    _buildSearchAndFilter(),
                    
                    // Employees List
                    Expanded(child: _buildEmployeesList()),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildStatsSection() {
    final stats = _stats;
    
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(child: _buildStatCard('الإجمالي', stats['total']!, Icons.people, const Color(0xFF7C3AED))),
          const SizedBox(width: 8),
          Expanded(child: _buildStatCard('حاضر', stats['present']!, Icons.check_circle, Colors.green)),
          const SizedBox(width: 8),
          Expanded(child: _buildStatCard('غائب', stats['absent']!, Icons.cancel, Colors.red)),
          const SizedBox(width: 8),
          Expanded(child: _buildStatCard('متأخر', stats['late']!, Icons.warning, Colors.amber)),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, int value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.white, color.withOpacity(0.05)],
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(
              value.toString(),
              style: GoogleFonts.cairo(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: GoogleFonts.cairo(
                fontSize: 10,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBulkActions() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: const Color(0xFF7C3AED).withOpacity(0.1),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(Icons.group, color: const Color(0xFF7C3AED)),
              const SizedBox(width: 8),
              Text(
                'تم اختيار ${_selectedEmployees.length} موظف',
                style: GoogleFonts.cairo(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF7C3AED),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedShiftId,
                  decoration: InputDecoration(
                    labelText: 'اختر الفترة',
                    labelStyle: GoogleFonts.cairo(),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: _shifts.map((shift) {
                    return DropdownMenuItem(
                      value: shift.id,
                      child: Text(shift.name, style: GoogleFonts.cairo()),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() => _selectedShiftId = value);
                  },
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _handleBulkCheckIn,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text('تسجيل', style: GoogleFonts.cairo(color: Colors.white)),
              ),
              const SizedBox(width: 4),
              IconButton(
                onPressed: () => setState(() => _selectedEmployees.clear()),
                icon: const Icon(Icons.close, color: Colors.red),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilter() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              onChanged: (value) => setState(() => _searchQuery = value),
              decoration: InputDecoration(
                hintText: 'البحث...',
                hintStyle: GoogleFonts.cairo(),
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
          const SizedBox(width: 8),
          PopupMenuButton<String>(
            initialValue: _filterStatus,
            icon: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF7C3AED).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.filter_list, color: Color(0xFF7C3AED)),
            ),
            onSelected: (value) => setState(() => _filterStatus = value),
            itemBuilder: (context) => [
              PopupMenuItem(value: 'all', child: Text('الكل', style: GoogleFonts.cairo())),
              PopupMenuItem(value: 'present', child: Text('حاضر', style: GoogleFonts.cairo())),
              PopupMenuItem(value: 'absent', child: Text('غائب', style: GoogleFonts.cairo())),
              PopupMenuItem(value: 'late', child: Text('متأخر', style: GoogleFonts.cairo())),
              PopupMenuItem(value: 'completed', child: Text('مكتمل', style: GoogleFonts.cairo())),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmployeesList() {
    final filtered = _filteredEmployees;
    
    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'لا يوجد موظفون',
              style: GoogleFonts.cairo(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final employee = filtered[index];
        final attendance = _getEmployeeAttendance(employee.id);
        final canCheckIn = attendance == null || attendance.checkInTime == null;
        final canCheckOut = attendance != null && attendance.checkInTime != null && attendance.checkOutTime == null;
        final isSelected = _selectedEmployees.contains(employee.id);

        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color: isSelected ? const Color(0xFF7C3AED) : Colors.transparent,
              width: 2,
            ),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.all(12),
            leading: canCheckIn
                ? Checkbox(
                    value: isSelected,
                    onChanged: (value) {
                      setState(() {
                        if (value == true) {
                          _selectedEmployees.add(employee.id);
                        } else {
                          _selectedEmployees.remove(employee.id);
                        }
                      });
                    },
                  )
                : null,
            title: Text(
              employee.fullName,
              style: GoogleFonts.cairo(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text(
                  '${employee.employeeNumber}${employee.position != null ? ' • ${employee.position}' : ''}',
                  style: GoogleFonts.cairo(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                if (attendance != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (attendance.checkInTime != null)
                        _buildTimeChip(
                          DateFormat('hh:mm a', 'ar').format(attendance.checkInTime!),
                          Icons.login,
                          Colors.green,
                        ),
                      if (attendance.checkOutTime != null) ...[
                        const SizedBox(width: 8),
                        _buildTimeChip(
                          DateFormat('hh:mm a', 'ar').format(attendance.checkOutTime!),
                          Icons.logout,
                          Colors.blue,
                        ),
                      ],
                      if (attendance.lateMinutes > 0) ...[
                        const SizedBox(width: 8),
                        _buildTimeChip(
                          '${attendance.lateMinutes} د',
                          Icons.warning,
                          Colors.amber,
                        ),
                      ],
                    ],
                  ),
                ],
              ],
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildStatusChip(attendance),
                const SizedBox(width: 8),
                if (canCheckIn)
                  IconButton(
                    onPressed: () => _handleCheckIn(employee),
                    icon: const Icon(Icons.login, color: Colors.green),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.green.withOpacity(0.1),
                    ),
                  ),
                if (canCheckOut)
                  IconButton(
                    onPressed: () => _handleCheckOut(employee),
                    icon: const Icon(Icons.logout, color: Colors.blue),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.blue.withOpacity(0.1),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusChip(AttendanceRecord? attendance) {
    final status = attendance?.status ?? 'absent';
    final statusText = attendance?.statusArabic ?? 'غائب';
    final color = _getStatusColor(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        statusText,
        style: GoogleFonts.cairo(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildTimeChip(String time, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            time,
            style: GoogleFonts.cairo(
              fontSize: 10,
              color: color,
              fontWeight: FontWeight.w600,
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
}
