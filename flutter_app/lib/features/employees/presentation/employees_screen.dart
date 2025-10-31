import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../providers/employees_providers.dart';

class EmployeesScreen extends HookConsumerWidget {
  const EmployeesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchController = useTextEditingController();
    final selectedDept = useState<String>('all');
    useListenable(searchController);
    final employeesAsync = ref.watch(employeesProvider);
    final departments = ref.watch(departmentsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('إدارة الموظفين')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Directionality(
                textDirection: TextDirection.rtl,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    TextField(
                      controller: searchController,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.search),
                        labelText: 'ابحث بالاسم أو البريد أو الرقم الوظيفي',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      decoration: const InputDecoration(labelText: 'القسم'),
                      value: selectedDept.value,
                      items: [
                        const DropdownMenuItem(value: 'all', child: Text('جميع الأقسام')),
                        ...departments.map((dept) => DropdownMenuItem(value: dept.id, child: Text(dept.name))),
                      ],
                      onChanged: (value) => selectedDept.value = value ?? 'all',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Expanded(
                child: employeesAsync.when(
                  data: (employees) {
                    final filtered = employees.where((employee) {
                      final matchesDept = selectedDept.value == 'all' || employee.department.id == selectedDept.value;
                      final term = searchController.text.trim();
                      if (term.isEmpty) return matchesDept;
                      final normalizedTerm = term.toLowerCase();
                      return matchesDept &&
                          (employee.fullName.toLowerCase().contains(normalizedTerm) ||
                              employee.email.toLowerCase().contains(normalizedTerm) ||
                              employee.employeeNumber.toLowerCase().contains(normalizedTerm));
                    }).toList();

                    if (filtered.isEmpty) {
                      return const _EmptyState();
                    }

                    final columns = MediaQuery.sizeOf(context).width > 1000
                        ? 3
                        : MediaQuery.sizeOf(context).width > 720
                            ? 2
                            : 1;

                    return GridView.builder(
                      itemCount: filtered.length,
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: columns,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: 1.1,
                      ),
                      itemBuilder: (context, index) {
                        final employee = filtered[index];
                        return _EmployeeCard(employee: employee);
                      },
                    );
                  },
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (error, stackTrace) => Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, size: 48),
                        const SizedBox(height: 16),
                        Text('تعذر تحميل قائمة الموظفين'),
                        const SizedBox(height: 12),
                        FilledButton(
                          onPressed: () => ref.invalidate(employeesProvider),
                          child: const Text('إعادة المحاولة'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmployeeCard extends StatelessWidget {
  const _EmployeeCard({required this.employee});

  final Employee employee;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: scheme.outlineVariant),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: scheme.primary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Text(employee.roleLabel, style: TextStyle(color: scheme.primary)),
                ),
                if (!employee.isActive)
                  Chip(
                    label: const Text('غير نشط'),
                    labelStyle: TextStyle(color: scheme.error),
                    backgroundColor: scheme.errorContainer.withOpacity(0.4),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Text(employee.fullName, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            _InfoRow(icon: Icons.badge_outlined, label: 'رقم الموظف', value: employee.employeeNumber),
            _InfoRow(icon: Icons.email_outlined, label: 'البريد الإلكتروني', value: employee.email),
            if (employee.phone != null)
              _InfoRow(icon: Icons.phone_iphone, label: 'رقم الجوال', value: employee.phone!),
            _InfoRow(icon: Icons.apartment, label: 'القسم', value: employee.department.name),
            _InfoRow(icon: Icons.calendar_month, label: 'تاريخ التعيين', value: employee.hireDate),
            const Spacer(),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.edit),
                    label: const Text('تعديل'),
                  ),
                ),
                const SizedBox(width: 12),
                IconButton(
                  onPressed: () {},
                  icon: Icon(Icons.delete_outline, color: scheme.error),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              textDirection: TextDirection.rtl,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          const SizedBox(width: 12),
          Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.outline)),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.group_outlined, size: 64),
            const SizedBox(height: 16),
            const Text('لا توجد نتائج مطابقة للبحث'),
            const SizedBox(height: 8),
            Text('حاول تعديل معايير البحث أو إضافة موظف جديد', style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
