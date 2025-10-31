-- دالة مساعدة للحصول على دور الموظف الحالي
create or replace function public.get_employee_role()
returns text
language sql
security definer
stable
as $$
  select role from public.employees where user_id = auth.uid() limit 1;
$$;

-- دالة مساعدة للتحقق من صلاحيات المدير
create or replace function public.is_manager()
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from public.employees 
    where user_id = auth.uid() and role = 'manager'
  );
$$;

-- دالة مساعدة للتحقق من صلاحيات المشرف أو المدير
create or replace function public.is_supervisor_or_manager()
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from public.employees 
    where user_id = auth.uid() and role in ('manager', 'supervisor')
  );
$$;

-- سياسات الأقسام
create policy "المدراء يمكنهم عرض جميع الأقسام"
  on public.departments for select
  using (public.is_manager());

create policy "المدراء يمكنهم إضافة الأقسام"
  on public.departments for insert
  with check (public.is_manager());

create policy "المدراء يمكنهم تحديث الأقسام"
  on public.departments for update
  using (public.is_manager());

create policy "المدراء يمكنهم حذف الأقسام"
  on public.departments for delete
  using (public.is_manager());

-- سياسات الموظفين
create policy "الجميع يمكنهم عرض الموظفين"
  on public.employees for select
  using (auth.uid() is not null);

create policy "المدراء والمشرفون يمكنهم إضافة موظفين"
  on public.employees for insert
  with check (public.is_supervisor_or_manager());

create policy "المدراء والمشرفون يمكنهم تحديث الموظفين"
  on public.employees for update
  using (public.is_supervisor_or_manager());

create policy "المدراء يمكنهم حذف الموظفين"
  on public.employees for delete
  using (public.is_manager());

-- سياسات فترات العمل
create policy "الجميع يمكنهم عرض فترات العمل"
  on public.work_shifts for select
  using (auth.uid() is not null);

create policy "المدراء والمشرفون يمكنهم إدارة فترات العمل"
  on public.work_shifts for all
  using (public.is_supervisor_or_manager());

-- سياسات سجلات الحضور
create policy "الموظفون يمكنهم عرض سجلاتهم"
  on public.attendance_records for select
  using (
    employee_id in (select id from public.employees where user_id = auth.uid())
    or public.is_supervisor_or_manager()
  );

create policy "الموظفون يمكنهم تسجيل حضورهم"
  on public.attendance_records for insert
  with check (
    employee_id in (select id from public.employees where user_id = auth.uid())
    or public.is_supervisor_or_manager()
  );

create policy "المشرفون والمدراء يمكنهم تحديث السجلات"
  on public.attendance_records for update
  using (public.is_supervisor_or_manager());

-- سياسات معايير التقييم
create policy "الجميع يمكنهم عرض معايير التقييم"
  on public.evaluation_criteria for select
  using (auth.uid() is not null);

create policy "المدراء يمكنهم إدارة معايير التقييم"
  on public.evaluation_criteria for all
  using (public.is_manager());

-- سياسات التقييمات
create policy "الموظفون يمكنهم عرض تقييماتهم"
  on public.evaluations for select
  using (
    employee_id in (select id from public.employees where user_id = auth.uid())
    or evaluator_id in (select id from public.employees where user_id = auth.uid())
    or public.is_manager()
  );

create policy "المشرفون والمدراء يمكنهم إنشاء تقييمات"
  on public.evaluations for insert
  with check (public.is_supervisor_or_manager());

create policy "المشرفون والمدراء يمكنهم تحديث التقييمات"
  on public.evaluations for update
  using (
    evaluator_id in (select id from public.employees where user_id = auth.uid())
    or public.is_manager()
  );

-- سياسات تفاصيل التقييم
create policy "عرض تفاصيل التقييم حسب صلاحية التقييم الأساسي"
  on public.evaluation_details for select
  using (
    evaluation_id in (
      select id from public.evaluations
      where employee_id in (select id from public.employees where user_id = auth.uid())
      or evaluator_id in (select id from public.employees where user_id = auth.uid())
      or public.is_manager()
    )
  );

create policy "المشرفون والمدراء يمكنهم إدارة تفاصيل التقييم"
  on public.evaluation_details for all
  using (public.is_supervisor_or_manager());

-- سياسات إعدادات الحضور
create policy "المدراء والمشرفون يمكنهم إدارة إعدادات الحضور"
  on public.attendance_settings for all
  using (public.is_supervisor_or_manager());
