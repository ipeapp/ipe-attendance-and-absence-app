import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../providers/auth_providers.dart';

class LoginScreen extends HookConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final emailController = useTextEditingController();
    final passwordController = useTextEditingController();
    final loading = useState(false);
    final error = useState<String?>(null);

    Future<void> signIn() async {
      loading.value = true;
      error.value = null;
      try {
        await ref.read(authRepositoryProvider).signIn(
              email: emailController.text.trim(),
              password: passwordController.text,
            );
      } on AuthException catch (e) {
        error.value = e.message;
      } catch (e) {
        error.value = 'حدث خطأ غير متوقع';
      } finally {
        loading.value = false;
      }
    }

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('تسجيل الدخول', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text('يرجى إدخال بيانات الحساب للوصول إلى النظام', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 24),
              TextField(
                controller: emailController,
                textDirection: TextDirection.rtl,
                decoration: const InputDecoration(labelText: 'البريد الإلكتروني'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: passwordController,
                obscureText: true,
                textDirection: TextDirection.rtl,
                decoration: const InputDecoration(labelText: 'كلمة المرور'),
              ),
              const SizedBox(height: 16),
              if (error.value != null)
                Align(
                  alignment: Alignment.centerRight,
                  child: Text(
                    error.value!,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.error),
                  ),
                ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: loading.value ? null : signIn,
                  child: loading.value
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('دخول'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
