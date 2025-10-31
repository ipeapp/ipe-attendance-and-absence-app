import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/auth_provider.dart';
import '../services/supabase_service.dart';
import '../models/attendance.dart';
import '../widgets/stat_card.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  DateTime _selectedMonth = DateTime.now();
  Map<String, int>? _monthlyStats;
  List<AttendanceRecord>? _monthlyRecords;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      final employee = ref.read(authProvider).employee!;
      final supabase = SupabaseService.instance;
      
      final stats = await supabase.getMonthlyStats(employee.id);
      
      // Get monthly records
      final startOfMonth = DateTime(_selectedMonth.year, _selectedMonth.month, 1);
      final endOfMonth = DateTime(_selectedMonth.year, _selectedMonth.month + 1, 0);
      
      final records = await supabase.getAttendanceHistory(
        employee.id,
        limit: 100,
      );
      
      final monthlyRecords = records.where((r) {
        return r.date.isAfter(startOfMonth.subtract(const Duration(days: 1))) &&
               r.date.isBefore(endOfMonth.add(const Duration(days: 1)));
      }).toList();

      setState(() {
        _monthlyStats = stats;
        _monthlyRecords = monthlyRecords;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('خطأ في تحميل البيانات: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text('التقارير', style: GoogleFonts.cairo()),
          backgroundColor: const Color(0xFF7C3AED),
          foregroundColor: Colors.white,
          actions: [
            IconButton(
              icon: const Icon(Icons.calendar_month),
              onPressed: _selectMonth,
            ),
          ],
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
                      _buildMonthSelector(),
                      const SizedBox(height: 20),
                      _buildStatsSection(),
                      const SizedBox(height: 20),
                      _buildCalendarView(),
                      const SizedBox(height: 20),
                      _buildSummary(),
                    ],
                  ),
                ),
        ),
      ),
    );
  }

  Widget _buildMonthSelector() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(
              icon: const Icon(Icons.chevron_right),
              onPressed: () {
                setState(() {
                  _selectedMonth = DateTime(
                    _selectedMonth.year,
                    _selectedMonth.month - 1,
                  );
                });
                _loadData();
              },
            ),
            GestureDetector(
              onTap: _selectMonth,
              child: Text(
                DateFormat('MMMM yyyy', 'ar').format(_selectedMonth),
                style: GoogleFonts.cairo(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.chevron_left),
              onPressed: _selectedMonth.month == DateTime.now().month
                  ? null
                  : () {
                      setState(() {
                        _selectedMonth = DateTime(
                          _selectedMonth.year,
                          _selectedMonth.month + 1,
                        );
                      });
                      _loadData();
                    },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsSection() {
    if (_monthlyStats == null) return const SizedBox.shrink();

    final stats = _monthlyStats!;
    final total = stats['total'] ?? 0;
    final present = stats['present'] ?? 0;
    final absent = stats['absent'] ?? 0;
    final late = stats['late'] ?? 0;
    final percentage = total > 0 ? (present / total * 100).round() : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'الإحصائيات',
          style: GoogleFonts.cairo(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: MiniStatCard(
                label: 'أيام الحضور',
                value: present.toString(),
                icon: Icons.check_circle,
                color: Colors.green,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: MiniStatCard(
                label: 'أيام الغياب',
                value: absent.toString(),
                icon: Icons.cancel,
                color: Colors.red,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: MiniStatCard(
                label: 'أيام التأخير',
                value: late.toString(),
                icon: Icons.warning,
                color: Colors.amber,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: MiniStatCard(
                label: 'النسبة',
                value: '$percentage%',
                icon: Icons.trending_up,
                color: const Color(0xFF7C3AED),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCalendarView() {
    if (_monthlyRecords == null) return const SizedBox.shrink();

    final daysInMonth = DateTime(_selectedMonth.year, _selectedMonth.month + 1, 0).day;
    final firstDayOfMonth = DateTime(_selectedMonth.year, _selectedMonth.month, 1);
    final firstWeekday = firstDayOfMonth.weekday % 7; // 0 = Sunday

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'عرض الشهر',
              style: GoogleFonts.cairo(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            // Week days header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج']
                  .map((day) => SizedBox(
                        width: 40,
                        child: Text(
                          day,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.cairo(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[600],
                          ),
                        ),
                      ))
                  .toList(),
            ),
            const SizedBox(height: 8),
            // Calendar grid
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 7,
                childAspectRatio: 1,
              ),
              itemCount: firstWeekday + daysInMonth,
              itemBuilder: (context, index) {
                if (index < firstWeekday) {
                  return const SizedBox.shrink();
                }

                final day = index - firstWeekday + 1;
                final date = DateTime(_selectedMonth.year, _selectedMonth.month, day);
                final record = _monthlyRecords!.where((r) {
                  return r.date.year == date.year &&
                         r.date.month == date.month &&
                         r.date.day == date.day;
                }).firstOrNull;

                return _buildDayCell(day, record);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDayCell(int day, AttendanceRecord? record) {
    Color? backgroundColor;
    Color? textColor = Colors.black87;

    if (record != null) {
      switch (record.status) {
        case 'present':
          backgroundColor = Colors.green.withOpacity(0.2);
          textColor = Colors.green[800];
          break;
        case 'late':
          backgroundColor = Colors.amber.withOpacity(0.2);
          textColor = Colors.amber[800];
          break;
        case 'absent':
          backgroundColor = Colors.red.withOpacity(0.2);
          textColor = Colors.red[800];
          break;
      }
    }

    return Container(
      margin: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: backgroundColor != null ? textColor! : Colors.grey[300]!,
          width: 1,
        ),
      ),
      child: Center(
        child: Text(
          day.toString(),
          style: GoogleFonts.cairo(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
      ),
    );
  }

  Widget _buildSummary() {
    if (_monthlyStats == null) return const SizedBox.shrink();

    final stats = _monthlyStats!;
    final total = stats['total'] ?? 0;
    final present = stats['present'] ?? 0;
    final absent = stats['absent'] ?? 0;
    final late = stats['late'] ?? 0;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: const LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [
              Color(0xFF7C3AED),
              Color(0xFF9333EA),
            ],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ملخص الشهر',
              style: GoogleFonts.cairo(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            _buildSummaryRow('إجمالي الأيام', total.toString()),
            const Divider(color: Colors.white24, height: 24),
            _buildSummaryRow('أيام الحضور', present.toString(), Colors.green),
            _buildSummaryRow('أيام الغياب', absent.toString(), Colors.red),
            _buildSummaryRow('أيام التأخير', late.toString(), Colors.amber),
            const Divider(color: Colors.white24, height: 24),
            _buildSummaryRow(
              'نسبة الحضور',
              total > 0 ? '${(present / total * 100).toStringAsFixed(1)}%' : '0%',
              Colors.white,
              isHighlight: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, [Color? color, bool isHighlight = false]) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.cairo(
              fontSize: isHighlight ? 16 : 14,
              color: Colors.white70,
              fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.cairo(
              fontSize: isHighlight ? 24 : 16,
              fontWeight: FontWeight.bold,
              color: color ?? Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _selectMonth() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedMonth,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF7C3AED),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _selectedMonth = picked;
      });
      _loadData();
    }
  }
}
