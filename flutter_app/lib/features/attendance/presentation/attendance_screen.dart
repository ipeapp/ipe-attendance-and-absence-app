import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../providers/attendance_providers.dart';

class AttendanceScreen extends HookConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tabController = useTabController(initialLength: 3);
    final attendance = ref.watch(todayAttendanceProvider);
    final history = ref.watch(attendanceHistoryProvider);
    final team = ref.watch(teamAttendanceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('إدارة الحضور'),
        bottom: TabBar(
          controller: tabController,
          tabs: const [
            Tab(text: 'تسجيل'),
            Tab(text: 'السجلات'),
            Tab(text: 'الفريق'),
          ],
        ),
      ),
      body: TabBarView(
        controller: tabController,
        children: [
          _CheckInPane(attendance: attendance),
          _HistoryPane(history: history),
          _TeamPane(team: team),
        ],
      ),
    );
  }
}

class _CheckInPane extends HookConsumerWidget {
  const _CheckInPane({required this.attendance});

  final AsyncValue<TodayAttendance> attendance;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notes = useTextEditingController();
    final selectedShift = useState<String?>(null);

    return Padding(
      padding: const EdgeInsets.all(24),
      child: attendance.when(
        data: (data) => Directionality(
          textDirection: TextDirection.rtl,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('سجل حضورك للفترة', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedShift.value,
                decoration: const InputDecoration(labelText: 'اختر الفترة'),
                items: data.availableShifts
                    .map(
                      (shift) => DropdownMenuItem(
                        value: shift.id,
                        child: Text('${shift.name} (${shift.timeWindow})'),
                      ),
                    )
                    .toList(),
                onChanged: (value) => selectedShift.value = value,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: notes,
                maxLines: 3,
                decoration: const InputDecoration(labelText: 'ملاحظات (اختياري)'),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: selectedShift.value == null
                    ? null
                    : () => ref
                        .read(attendanceActionControllerProvider)
                        .checkIn(shiftId: selectedShift.value!, notes: notes.text)
                        .then((_) => notes.clear()),
                icon: const Icon(Icons.login),
                label: const Text('تسجيل الحضور'),
              ),
              const SizedBox(height: 24),
              if (data.records.isNotEmpty)
                Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceVariant,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('سجلات اليوم', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 12),
                      ...data.records.map(
                        (record) => ListTile(
                          leading: Icon(record.status.icon, color: record.status.color),
                          title: Text(record.shiftName, textDirection: TextDirection.rtl),
                          subtitle: Text(record.detail, textDirection: TextDirection.rtl),
                          trailing: record.canCheckOut
                              ? OutlinedButton.icon(
                                  onPressed: () => ref
                                      .read(attendanceActionControllerProvider)
                                      .checkOut(recordId: record.id, notes: notes.text),
                                  icon: const Icon(Icons.logout),
                                  label: const Text('تسجيل الانصراف'),
                                )
                              : null,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => _ErrorState(onRetry: () => ref.invalidate(todayAttendanceProvider)),
      ),
    );
  }
}

class _HistoryPane extends ConsumerWidget {
  const _HistoryPane({required this.history});

  final AsyncValue<List<AttendanceRecord>> history;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: history.when(
        data: (records) => Directionality(
          textDirection: TextDirection.rtl,
          child: ListView.separated(
            itemCount: records.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final record = records[index];
              return Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                ),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Chip(label: Text(record.statusLabel)),
                        Text(record.dateString, style: Theme.of(context).textTheme.titleMedium),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(record.shiftName),
                    if (record.notes != null) ...[
                      const SizedBox(height: 8),
                      Text(record.notes!, style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ],
                ),
              );
            },
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => _ErrorState(onRetry: () => ref.invalidate(attendanceHistoryProvider)),
      ),
    );
  }
}

class _TeamPane extends ConsumerWidget {
  const _TeamPane({required this.team});

  final AsyncValue<List<TeamAttendanceRecord>> team;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: team.when(
        data: (records) => Directionality(
          textDirection: TextDirection.rtl,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: records.isEmpty
                          ? null
                          : () => ref.read(attendanceActionControllerProvider).markTeamPresent(records.map((e) => e.id).toList()),
                      icon: const Icon(Icons.fact_check),
                      label: const Text('وضع علامة حضور'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: records.isEmpty
                          ? null
                          : () => ref
                              .read(attendanceActionControllerProvider)
                              .markTeamAbsent(records.map((e) => e.id).toList()),
                      icon: const Icon(Icons.cancel_schedule_send),
                      label: const Text('وضع علامة غياب'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Expanded(
                child: records.isEmpty
                    ? const Center(child: Text('لا توجد سجلات اليوم'))
                    : ListView.separated(
                        itemCount: records.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final record = records[index];
                          return ListTile(
                            leading: CircleAvatar(child: Text(record.initials)),
                            title: Text(record.employeeName),
                            subtitle: Text('${record.employeeNumber} · ${record.shiftName}'),
                            trailing: Chip(
                              label: Text(record.statusLabel),
                              backgroundColor: record.statusColor.withOpacity(0.12),
                              labelStyle: TextStyle(color: record.statusColor),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => _ErrorState(onRetry: () => ref.invalidate(teamAttendanceProvider)),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 48),
          const SizedBox(height: 16),
          const Text('حدث خطأ أثناء تحميل البيانات'),
          const SizedBox(height: 12),
          FilledButton(onPressed: onRetry, child: const Text('إعادة المحاولة')),
        ],
      ),
    );
  }
}
