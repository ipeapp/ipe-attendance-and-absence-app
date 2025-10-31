import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/employee.dart';
import 'supabase_service.dart';

// Auth State
class AuthState {
  final User? user;
  final Employee? employee;
  final bool isLoading;
  final String? error;

  AuthState({
    this.user,
    this.employee,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    User? user,
    Employee? employee,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      employee: employee ?? this.employee,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  bool get isAuthenticated => user != null && employee != null;
}

// Auth Provider
class AuthNotifier extends StateNotifier<AuthState> {
  final SupabaseService _supabaseService;

  AuthNotifier(this._supabaseService) : super(AuthState(isLoading: true)) {
    _init();
  }

  void _init() async {
    final user = _supabaseService.currentUser;
    if (user != null) {
      final employee = await _supabaseService.getEmployeeByUserId(user.id);
      state = AuthState(user: user, employee: employee, isLoading: false);
    } else {
      state = AuthState(isLoading: false);
    }

    // Listen to auth state changes
    _supabaseService.authStateChanges.listen((data) async {
      final event = data.event;
      if (event == AuthChangeEvent.signedIn) {
        final user = data.session?.user;
        if (user != null) {
          final employee = await _supabaseService.getEmployeeByUserId(user.id);
          state = AuthState(user: user, employee: employee, isLoading: false);
        }
      } else if (event == AuthChangeEvent.signedOut) {
        state = AuthState(isLoading: false);
      }
    });
  }

  Future<void> signIn(String email, String password) async {
    try {
      state = state.copyWith(isLoading: true, error: null);
      
      final response = await _supabaseService.signIn(email, password);
      
      if (response.user != null) {
        final employee = await _supabaseService.getEmployeeByUserId(response.user!.id);
        
        if (employee == null) {
          throw Exception('لم يتم العثور على بيانات الموظف');
        }
        
        state = AuthState(
          user: response.user,
          employee: employee,
          isLoading: false,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      state = state.copyWith(isLoading: true);
      await _supabaseService.signOut();
      state = AuthState(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> refreshEmployee() async {
    if (state.user != null) {
      final employee = await _supabaseService.getEmployeeByUserId(state.user!.id);
      state = state.copyWith(employee: employee);
    }
  }
}

// Provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(SupabaseService.instance);
});
