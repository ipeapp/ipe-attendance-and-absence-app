## Modernization Roadmap

### Current State Summary

- **Stack**: Next.js App Router with client/server components, Supabase auth + database, Shadcn UI kit, Arabic RTL localization.
- **Primary workflows**: Employee dashboard (`app/dashboard/page.tsx`), attendance tracking with multi-role tabs (`app/dashboard/attendance/page.tsx`), employee administration (`components/employees-list.tsx`) and evaluation/reporting modules.
- **Pain points**:
  - Visual hierarchy is flat; cards reuse the same violet accent, so key actions blend into secondary data.
  - Limited responsive behaviors; grids collapse but typography and spacing don't adapt to smaller screens.
  - Manager-focused flows (bulk attendance, quick employee insights) are spread across several tabs instead of a unified view.
  - Supabase queries run per-request, creating noticeable layout shifts without skeleton or optimistic states.
  - Forms lack validation feedback patterns and rely on browser alerts.

### Professional UI/UX Enhancements

1. **Design System Refresh**
   - Introduce a refined palette with semantic tokens (`primary`, `success`, `warning`, `critical`) instead of hard-coded violet accents.
   - Extend typography scale for headings/body, and add responsive clamps (e.g., `text-2xl md:text-3xl`).
   - Add elevation tokens (`shadow-sm`, `shadow-md`) and consistent border radii (`rounded-2xl`).

2. **Responsive Layout Improvements**
   - Wrap top-level pages with a responsive container (`max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8`).
   - Upgrade grids to use `auto-fit` with min widths so cards wrap gracefully on tablet and mobile.
   - Add sticky toolbars for filters (employees, attendance history) to maintain context on scroll.

3. **Interaction Polish**
   - Replace alert-based errors in client components with inline `Alert` banners and toast notifications.
   - Add skeleton loaders for dashboard stats and attendance lists while async Supabase calls resolve.
   - Introduce `EmptyState` component with iconography + call-to-action instead of plain text.

4. **RTL & Accessibility**
   - Audit all flex containers for `gap`/`space-x` usage; ensure logical order works when mirroring to LTR for bilingual support.
   - Provide focus styles that meet WCAG 2.1 AA; Shadcn defaults can be extended in `globals.css`.

### Feature Extensions (Supervisor-Focused)

1. **Team Overview Dashboard**
   - Add `/dashboard/team` route consolidating:
     - Real-time attendance table with status chips, shift info, and quick mark actions.
     - Aggregated metrics (Present %, Late %, Absent count) with trend indicators.
     - Filter bar for department, shift, and status.

2. **Bulk Attendance Actions**
   - Enable supervisors to mark employees present/absent/late directly from the team table.
   - Add Supabase RPC (e.g., `perform_team_attendance_action(employee_ids, status, notes)`), wrapping the logic server-side to maintain auditing.
   - Provide reason capture modal when marking absences to keep context.

3. **Shift & Scheduling Insights**
   - Add a calendar heatmap showing attendance over time for quick spotting of patterns.
   - Surface upcoming shifts and unassigned employees with call-to-action to assign.

4. **Notification Hooks**
   - Integrate email/SMS triggers (via Supabase Edge Functions) when employees hit lateness thresholds.

### Implementation Sequence (Next.js)

1. Design tokens layer → update `globals.css`, `theme-provider.tsx`, and UI primitives.
2. Shared components → build `components/empty-state.tsx`, `components/stat-card.tsx`, `components/skeletons.tsx`.
3. Page refactors → Dashboard, Attendance, Employees to consume new primitives and responsive container.
4. Supervisor flows → new team dashboard route, RPC integration, optimistic UI for bulk actions.
5. Quality polish → add Cypress component tests for critical interactions, Lighthouse pass for responsive breakpoints.

