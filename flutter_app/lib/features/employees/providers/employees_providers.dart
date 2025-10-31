import 'package:hooks_riverpod/hooks_riverpod.dart';

final employeesProvider = FutureProvider<List<Employee>>((ref) async {
  await Future<void>.delayed(const Duration(milliseconds: 260));

  return [
    const Employee(
      id: 'emp-1',
      fullName: 'سارة محمد',
      email: 'sara@example.com',
      phone: '+96650000001',
      employeeNumber: 'EMP-1021',
      role: EmployeeRole.supervisor,
      department: Department(id: 'dept-1', name: 'الموارد البشرية'),
      hireDate: '2022-03-12',
      isActive: true,
    ),
    const Employee(
      id: 'emp-2',
      fullName: 'عمر الأحمد',
      email: 'omar@example.com',
      phone: '+96650000002',
      employeeNumber: 'EMP-1022',
      role: EmployeeRole.employee,
      department: Department(id: 'dept-2', name: 'تقنية المعلومات'),
      hireDate: '2021-09-01',
      isActive: true,
    ),
    const Employee(
      id: 'emp-3',
      fullName: 'هدى الخطيب',
      email: 'huda@example.com',
      phone: '+96650000003',
      employeeNumber: 'EMP-1023',
      role: EmployeeRole.employee,
      department: Department(id: 'dept-1', name: 'الموارد البشرية'),
      hireDate: '2020-01-23',
      isActive: false,
    ),
  ];
});

final departmentsProvider = Provider<List<Department>>((ref) {
  return const [
    Department(id: 'dept-1', name: 'الموارد البشرية'),
    Department(id: 'dept-2', name: 'تقنية المعلومات'),
    Department(id: 'dept-3', name: 'التسويق'),
  ];
});

class Employee {
  const Employee({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phone,
    required this.employeeNumber,
    required this.role,
    required this.department,
    required this.hireDate,
    required this.isActive,
  });

  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final String employeeNumber;
  final EmployeeRole role;
  final Department department;
  final String hireDate;
  final bool isActive;

  String get roleLabel => switch (role) {
        EmployeeRole.manager => 'مدير',
        EmployeeRole.supervisor => 'مشرف',
        EmployeeRole.employee => 'موظف',
      };
}

enum EmployeeRole { manager, supervisor, employee }

class Department {
  const Department({required this.id, required this.name});

  final String id;
  final String name;
}
