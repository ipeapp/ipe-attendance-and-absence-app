import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/employee.dart';
import '../models/attendance.dart';
import 'package:intl/intl.dart';

class EmployeeCard extends StatelessWidget {
  final Employee employee;
  final AttendanceRecord? attendance;
  final bool showCheckbox;
  final bool isSelected;
  final VoidCallback? onCheckboxChanged;
  final VoidCallback? onCheckIn;
  final VoidCallback? onCheckOut;
  final VoidCallback? onTap;

  const EmployeeCard({
    super.key,
    required this.employee,
    this.attendance,
    this.showCheckbox = false,
    this.isSelected = false,
    this.onCheckboxChanged,
    this.onCheckIn,
    this.onCheckOut,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final canCheckIn = attendance == null || attendance!.checkInTime == null;
    final canCheckOut = attendance != null && 
                        attendance!.checkInTime != null && 
                        attendance!.checkOutTime == null;

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
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              if (showCheckbox && canCheckIn)
                Checkbox(
                  value: isSelected,
                  onChanged: (value) => onCheckboxChanged?.call(),
                  activeColor: const Color(0xFF7C3AED),
                ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            employee.fullName,
                            style: GoogleFonts.cairo(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        _buildStatusBadge(),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.badge, size: 14, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Text(
                          employee.employeeNumber,
                          style: GoogleFonts.cairo(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        if (employee.position != null) ...[
                          const SizedBox(width: 8),
                          Text('•', style: TextStyle(color: Colors.grey[600])),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              employee.position!,
                              style: GoogleFonts.cairo(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (employee.department != null) ...[
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.business, size: 14, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(
                            employee.department!.name,
                            style: GoogleFonts.cairo(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (attendance != null) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          if (attendance!.checkInTime != null)
                            _buildTimeChip(
                              DateFormat('hh:mm a', 'ar').format(attendance!.checkInTime!),
                              Icons.login,
                              Colors.green,
                            ),
                          if (attendance!.checkOutTime != null)
                            _buildTimeChip(
                              DateFormat('hh:mm a', 'ar').format(attendance!.checkOutTime!),
                              Icons.logout,
                              Colors.blue,
                            ),
                          if (attendance!.lateMinutes > 0)
                            _buildTimeChip(
                              '${attendance!.lateMinutes} د',
                              Icons.warning,
                              Colors.amber,
                            ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                children: [
                  if (canCheckIn && onCheckIn != null)
                    IconButton(
                      onPressed: onCheckIn,
                      icon: const Icon(Icons.login, color: Colors.green),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.green.withOpacity(0.1),
                      ),
                    ),
                  if (canCheckOut && onCheckOut != null)
                    IconButton(
                      onPressed: onCheckOut,
                      icon: const Icon(Icons.logout, color: Colors.blue),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.blue.withOpacity(0.1),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge() {
    final status = attendance?.status ?? 'absent';
    final statusText = attendance?.statusArabic ?? 'غائب';
    final color = _getStatusColor(status);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_getStatusIcon(status), size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            statusText,
            style: GoogleFonts.cairo(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
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
