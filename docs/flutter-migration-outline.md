## Flutter Migration Outline

### Objectives

- Deliver a unified mobile-first experience backing the existing Supabase dataset.
- Preserve core HR workflows (auth, dashboards, attendance, employee management, evaluations) while improving offline resilience.
- Modularize domain logic so the web (Next.js) and mobile (Flutter) clients can evolve in parallel against shared APIs.

### Recommended Architecture

- **Project structure**
  - `lib/app` – root app/widget setup, routing, theme.
  - `lib/core` – constants, localization, error handling, base widgets.
  - `lib/features/<domain>` – feature-layer folders (dashboard, attendance, employees, evaluations, auth, settings).
  - `lib/services` – Supabase client, secure storage, notification integrations.
  - `lib/shared` – reusable UI (cards, stat tiles, chips, tables) and utilities (date formatters).

- **State management**: Riverpod or Bloc; Riverpod fits declarative data streams from Supabase and scales well for modular features.

- **Networking**: `supabase_flutter` SDK for authentication and real-time streams; augment with REST endpoints via Supabase Edge Functions for bulk actions.

- **Routing**: `go_router` for declarative navigation, nested shell routes to align with dashboard tabs.

- **Theming**: Material 3 with custom color scheme matching refreshed brand tokens; define light/dark variants.

- **Localization**: Use `flutter_localizations` plus `intl` to support Arabic (RTL) and English.

### Data & API Layer

- Mirror Supabase tables as typed Dart models (e.g., `AttendanceRecord`, `EmployeeProfile`).
- Create repository interfaces per feature, backed by Supabase service.
- Handle auth persistence via `supabase.auth.onAuthStateChange` and secure tokens using `flutter_secure_storage`.
- Implement offline caching using `drift` or `hive` for critical datasets (employees list, recent attendance) with last-sync timestamps.

### Feature Mapping

1. **Authentication**
   - Splash/auth gate reacting to Supabase session.
   - Email/password flow plus Magic Link if required.
   - Role-based routing to employee vs supervisor dashboards.

2. **Dashboard**
   - `DashboardScreen` shows personal stats card, attendance summary, upcoming shifts, and team snapshot for supervisors.
   - Use responsive `LayoutBuilder` to adapt grid on tablet vs phone.

3. **Attendance**
   - Tab view: `Check In`, `History`, `Team` (role-gated).
   - Integrate geolocation (`geolocator`), NFC (platform-specific), manual entry.
   - Real-time updates via Supabase channel listening on `attendance_records`.

4. **Employees Management**
   - Search + filter bar pinned to top; cards/list rows with swipe actions.
   - Detail screen with edit actions (restricted to manager role).
   - Bulk select + bottom sheet actions for supervisors (mark present/absent).

5. **Evaluations & Reports**
   - Recreate criteria forms and reporting views using chart widgets (`fl_chart`).
   - Export/share via PDF generation (`printing` package) queued through Supabase storage.

### Migration Phases

1. **Foundation**
   - Bootstrap Flutter project with theming, localization, auth shell.
   - Implement Supabase service, domain models, Riverpod providers.

2. **Employee Experience**
   - Personal dashboard, attendance check-in/out, history list with filters.
   - Local caching for offline check-in attempts queued for sync.

3. **Supervisor Toolkit**
   - Team overview screen with bulk actions.
   - Shift assignment & attendance overrides integrated via Supabase Edge Function.

4. **Advanced Modules**
   - Evaluations, reports, notifications.
   - Settings (profile, language toggle, theme, notifications).

5. **Parity Closure & QA**
   - Cross-verify data parity between web and mobile clients.
   - Add widget/integration tests; run beta with targeted supervisors.

### Deliverables & Tooling

- CI/CD: Use `fastlane` or `codemagic` for automated builds; connect to Supabase migrations pipeline.
- Design handoff: Source design tokens via Figma, export to Flutter `ThemeData` extension.
- Documentation: Maintain `/docs/mobile/` with API contracts, state diagrams, and release process.

