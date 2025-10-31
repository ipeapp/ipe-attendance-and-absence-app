import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'app/app.dart';
import 'core/app_provider_observer.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(
    ProviderScope(
      observers: const [AppProviderObserver()],
      child: const HrAttendanceApp(),
    ),
  );
}
