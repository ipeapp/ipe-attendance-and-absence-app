class Employee {
  final String id;
  final String? userId;
  final String fullName;
  final String email;
  final String? phone;
  final String? departmentId;
  final String role;
  final String employeeNumber;
  final DateTime hireDate;
  final bool isActive;
  final String? position;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Department? department;

  Employee({
    required this.id,
    this.userId,
    required this.fullName,
    required this.email,
    this.phone,
    this.departmentId,
    required this.role,
    required this.employeeNumber,
    required this.hireDate,
    this.isActive = true,
    this.position,
    required this.createdAt,
    required this.updatedAt,
    this.department,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'] as String,
      userId: json['user_id'] as String?,
      fullName: json['full_name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      departmentId: json['department_id'] as String?,
      role: json['role'] as String,
      employeeNumber: json['employee_number'] as String,
      hireDate: DateTime.parse(json['hire_date'] as String),
      isActive: json['is_active'] as bool? ?? true,
      position: json['position'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      department: json['department'] != null
          ? Department.fromJson(json['department'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'full_name': fullName,
      'email': email,
      'phone': phone,
      'department_id': departmentId,
      'role': role,
      'employee_number': employeeNumber,
      'hire_date': hireDate.toIso8601String(),
      'is_active': isActive,
      'position': position,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  String get roleArabic {
    switch (role) {
      case 'manager':
        return 'مدير';
      case 'supervisor':
        return 'مشرف';
      case 'employee':
        return 'موظف';
      default:
        return role;
    }
  }
}

class Department {
  final String id;
  final String name;
  final String? description;
  final DateTime createdAt;
  final DateTime updatedAt;

  Department({
    required this.id,
    required this.name,
    this.description,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Department.fromJson(Map<String, dynamic> json) {
    return Department(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
