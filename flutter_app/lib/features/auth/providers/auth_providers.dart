import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../services/supabase_service.dart';

final sessionProvider = StreamProvider<Session?>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  return supabase.auth.onAuthStateChange.map((event) => event.session);
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  return AuthRepository(supabase: supabase);
});

class AuthRepository {
  const AuthRepository({required this.supabase});

  final SupabaseClient supabase;

  Future<void> signIn({required String email, required String password}) async {
    final response = await supabase.auth.signInWithPassword(email: email, password: password);
    if (response.session == null) {
      throw const AuthException('فشل تسجيل الدخول');
    }
  }

  Future<void> signOut() => supabase.auth.signOut();
}
