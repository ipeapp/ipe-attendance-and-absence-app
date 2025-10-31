import 'package:flutter/material.dart';

class StatTile extends StatelessWidget {
  const StatTile({
    super.key,
    required this.title,
    required this.value,
    this.subtitle,
    this.icon,
    this.color,
  });

  final String title;
  final String value;
  final String? subtitle;
  final IconData? icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final resolvedColor = color ?? scheme.primary;

    return Container(
      decoration: BoxDecoration(
        color: resolvedColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(18),
      ),
      padding: const EdgeInsets.all(20),
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (icon != null)
              Align(
                alignment: Alignment.centerLeft,
                child: Icon(icon, color: resolvedColor),
              ),
            Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(color: scheme.onSurfaceVariant)),
            const SizedBox(height: 12),
            Text(value, style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: resolvedColor, fontWeight: FontWeight.w700)),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(subtitle!, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: scheme.onSurfaceVariant)),
            ],
          ],
        ),
      ),
    );
  }
}
