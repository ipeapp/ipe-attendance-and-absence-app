import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../shared/widgets/stat_tile.dart';
import '../providers/dashboard_providers.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dashboardMetricsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('لوحة التحكم'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.refresh(dashboardMetricsProvider.future),
          child: statsAsync.when(
            data: (stats) => ListView(
              padding: const EdgeInsets.all(24),
              children: [
                Directionality(
                  textDirection: TextDirection.rtl,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('مرحباً، ${stats.employeeName}', style: Theme.of(context).textTheme.headlineMedium),
                      const SizedBox(height: 4),
                      Text(stats.prettyDate, style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                GridView.count(
                  crossAxisCount: MediaQuery.sizeOf(context).width > 900
                      ? 4
                      : MediaQuery.sizeOf(context).width > 600
                          ? 2
                          : 1,
                  shrinkWrap: true,
                  primary: false,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.2,
                  children: [
                    StatTile(
                      title: 'حالة اليوم',
                      value: stats.todayStatus.label,
                      subtitle: stats.todayStatus.timeString,
                      color: stats.todayStatus.color,
                      icon: Icons.access_time,
                    ),
                    StatTile(
                      title: 'أيام الحضور',
                      value: '${stats.monthly.presentDays}',
                      subtitle: 'من ${stats.monthly.totalDays} يوم',
                      icon: Icons.task_alt,
                      color: Colors.green,
                    ),
                    StatTile(
                      title: 'أيام الغياب',
                      value: '${stats.monthly.absentDays}',
                      icon: Icons.cancel_outlined,
                      color: Colors.red,
                    ),
                    StatTile(
                      title: 'أيام التأخير',
                      value: '${stats.monthly.lateDays}',
                      icon: Icons.access_alarms,
                      color: Colors.orange,
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                if (stats.team != null) ...[
                  Directionality(
                    textDirection: TextDirection.rtl,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('إحصائيات الفريق', style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 12),
                        Container(
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surfaceVariant,
                            borderRadius: BorderRadius.circular(18),
                          ),
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            children: [
                              _TeamRow(label: 'إجمالي الموظفين', value: '${stats.team!.totalEmployees}'),
                              const Divider(height: 24),
                              _TeamRow(label: 'الحاضرون اليوم', value: '${stats.team!.presentToday}'),
                              const Divider(height: 24),
                              _TeamRow(label: 'نسبة الحضور', value: '${stats.team!.attendanceRatio}%'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
                Directionality(
                  textDirection: TextDirection.rtl,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('إجراءات سريعة', style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: stats.quickActions
                            .map(
                              (action) => ActionChip(
                                label: Directionality(
                                  textDirection: TextDirection.rtl,
                                  child: Text(action.label),
                                ),
                                avatar: Icon(action.icon, color: Theme.of(context).colorScheme.primary),
                                onPressed: () => action.onTap(context),
                                backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.08),
                              ),
                            )
                            .toList(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stackTrace) => Center(
              child: Directionality(
                textDirection: TextDirection.rtl,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, size: 48),
                    const SizedBox(height: 16),
                    Text('فشل تحميل البيانات'),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () => ref.invalidate(dashboardMetricsProvider),
                      child: const Text('إعادة المحاولة'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TeamRow extends StatelessWidget {
  const _TeamRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(value, style: Theme.of(context).textTheme.titleLarge),
        Text(label, style: Theme.of(context).textTheme.titleMedium),
      ],
    );
  }
}
