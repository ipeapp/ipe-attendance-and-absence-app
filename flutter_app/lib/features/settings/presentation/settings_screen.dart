import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الإعدادات')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const _SectionHeader(title: 'التخصيص'),
            SwitchListTile.adaptive(
              value: Theme.of(context).brightness == Brightness.dark,
              onChanged: (_) {},
              title: const Text('الوضع الليلي'),
              secondary: const Icon(Icons.dark_mode_outlined),
              contentPadding: EdgeInsets.zero,
            ),
            ListTile(
              leading: const Icon(Icons.language_outlined),
              title: const Text('اللغة'),
              subtitle: const Text('العربية'),
              trailing: const Icon(Icons.chevron_left),
              onTap: () {},
            ),
            const SizedBox(height: 24),
            const _SectionHeader(title: 'الحساب'),
            ListTile(
              leading: const Icon(Icons.person_outline),
              title: const Text('الملف الشخصي'),
              onTap: () {},
            ),
            ListTile(
              leading: const Icon(Icons.lock_reset_outlined),
              title: const Text('إعادة تعيين كلمة المرور'),
              onTap: () {},
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => context.go('/gate'),
              icon: const Icon(Icons.logout),
              label: const Text('تسجيل الخروج'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Text(title, style: Theme.of(context).textTheme.titleMedium),
      ),
    );
  }
}
