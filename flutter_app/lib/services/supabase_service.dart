import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  throw UnimplementedError('Supabase must be initialized before use.');
});

Future<void> bootstrapSupabase({required String supabaseUrl, required String supabaseAnonKey}) async {
  await Supabase.initialize(url: supabaseUrl, anonKey: supabaseAnonKey);
}
