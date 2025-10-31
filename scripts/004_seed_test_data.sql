-- بيانات تجريبية شاملة لاختبار النظام
-- يجب تشغيل هذا السكريبت بعد تشغيل السكريبتات السابقة

-- إضافة مستخدمين تجريبيين (يجب إنشاء الحسابات في Supabase Auth أولاً)
-- كلمة المرور لجميع الحسابات: Test@123456

-- ملاحظة: يجب إنشاء المستخدمين في Supabase Auth أولاً، ثم تحديث user_id هنا
-- الحسابات التجريبية:
-- 1. manager@ipe.com (مدير) - كلمة المرور: Test@123456
-- 2. supervisor@ipe.com (مشرف) - كلمة المرور: Test@123456
-- 3. employee1@ipe.com (موظف) - كلمة المرور: Test@123456
-- 4. employee2@ipe.com (موظف) - كلمة المرور: Test@123456
-- 5. employee3@ipe.com (موظف) - كلمة المرور: Test@123456

-- الحصول على معرفات الأقسام
do $$
declare
  dept_sales_id uuid;
  dept_admin_id uuid;
  dept_warehouse_id uuid;
  dept_accounting_id uuid;
  shift_morning_id uuid;
  shift_evening_id uuid;
  emp_manager_id uuid;
  emp_supervisor_id uuid;
  emp1_id uuid;
  emp2_id uuid;
  emp3_id uuid;
  emp_accountant_id uuid;
begin
  -- الحصول على معرفات الأقسام
  select id into dept_sales_id from public.departments where name = 'المبيعات' limit 1;
  select id into dept_admin_id from public.departments where name = 'الإدارة' limit 1;
  select id into dept_warehouse_id from public.departments where name = 'المخازن' limit 1;
  select id into dept_accounting_id from public.departments where name = 'المحاسبة' limit 1;
  
  -- الحصول على معرفات الفترات
  select id into shift_morning_id from public.work_shifts where shift_type = 'morning' limit 1;
  select id into shift_evening_id from public.work_shifts where shift_type = 'evening' limit 1;

  -- إضافة موظفين تجريبيين
  -- إضافة employee_number وإزالة user_id المؤقت
  
  -- مدير عام
  insert into public.employees (
    full_name, email, phone, department_id, 
    position, role, employee_number, hire_date, is_active
  ) values (
    'أحمد محمد المدير',
    'manager@ipe.com',
    '+967777111111',
    dept_admin_id,
    'مدير عام',
    'manager',
    'EMP001',
    '2020-01-01',
    true
  ) on conflict (email) do nothing
  returning id into emp_manager_id;

  -- مشرف المبيعات
  insert into public.employees (
    full_name, email, phone, department_id, 
    position, role, employee_number, hire_date, is_active
  ) values (
    'فاطمة علي المشرفة',
    'supervisor@ipe.com',
    '+967777222222',
    dept_sales_id,
    'مشرف المبيعات',
    'supervisor',
    'EMP002',
    '2021-03-15',
    true
  ) on conflict (email) do nothing
  returning id into emp_supervisor_id;

  -- موظف مبيعات 1
  insert into public.employees (
    full_name, email, phone, department_id, 
    position, role, employee_number, hire_date, is_active
  ) values (
    'خالد سعيد البائع',
    'employee1@ipe.com',
    '+967777333333',
    dept_sales_id,
    'موظف مبيعات',
    'employee',
    'EMP003',
    '2022-06-01',
    true
  ) on conflict (email) do nothing
  returning id into emp1_id;

  -- موظف مبيعات 2
  insert into public.employees (
    full_name, email, phone, department_id, 
    position, role, employee_number, hire_date, is_active
  ) values (
    'مريم حسن البائعة',
    'employee2@ipe.com',
    '+967777444444',
    dept_sales_id,
    'موظف مبيعات',
    'employee',
    'EMP004',
    '2022-08-15',
    true
  ) on conflict (email) do nothing
  returning id into emp2_id;

  -- موظف مخازن
  insert into public.employees (
    full_name, email, phone, department_id, 
    position, role, employee_number, hire_date, is_active
  ) values (
    'عبدالله يحيى أمين المخزن',
    'employee3@ipe.com',
    '+967777555555',
    dept_warehouse_id,
    'أمين مخزن',
    'employee',
    'EMP005',
    '2021-11-20',
    true
  ) on conflict (email) do nothing
  returning id into emp3_id;

  -- محاسب
  insert into public.employees (
    full_name, email, phone, department_id, 
    position, role, employee_number, hire_date, is_active
  ) values (
    'سارة أحمد المحاسبة',
    'accountant@ipe.com',
    '+967777666666',
    dept_accounting_id,
    'محاسب',
    'employee',
    'EMP006',
    '2021-05-10',
    true
  ) on conflict (email) do nothing
  returning id into emp_accountant_id;

  -- الحصول على معرفات الموظفين إذا كانت موجودة مسبقاً
  if emp1_id is null then
    select id into emp1_id from public.employees where email = 'employee1@ipe.com';
  end if;
  if emp2_id is null then
    select id into emp2_id from public.employees where email = 'employee2@ipe.com';
  end if;
  if emp3_id is null then
    select id into emp3_id from public.employees where email = 'employee3@ipe.com';
  end if;
  if emp_supervisor_id is null then
    select id into emp_supervisor_id from public.employees where email = 'supervisor@ipe.com';
  end if;

  -- إضافة date إلى سجلات الحضور
  -- إضافة سجلات حضور تجريبية للشهر الحالي
  -- سجلات حضور لموظف المبيعات 1
  insert into public.attendance_records (
    employee_id, date, shift_id, check_in_time, check_out_time,
    check_in_method, status, late_minutes, notes
  )
  select 
    emp1_id,
    (current_date - interval '1 day' * i)::date,
    shift_morning_id,
    date_trunc('day', current_date - interval '1 day' * i) + time '08:05:00',
    date_trunc('day', current_date - interval '1 day' * i) + time '14:00:00',
    'manual',
    case 
      when i % 10 = 0 then 'absent'
      when i % 7 = 0 then 'late'
      else 'present'
    end,
    case when i % 7 = 0 then 5 else 0 end,
    case when i % 10 = 0 then 'غياب بدون عذر' else null end
  from generate_series(1, 20) as i
  where emp1_id is not null
  on conflict do nothing;

  -- سجلات حضور لموظف المبيعات 2
  insert into public.attendance_records (
    employee_id, date, shift_id, check_in_time, check_out_time,
    check_in_method, status, late_minutes
  )
  select 
    emp2_id,
    (current_date - interval '1 day' * i)::date,
    shift_morning_id,
    date_trunc('day', current_date - interval '1 day' * i) + time '07:55:00',
    date_trunc('day', current_date - interval '1 day' * i) + time '14:05:00',
    'location',
    'present',
    0
  from generate_series(1, 20) as i
  where emp2_id is not null
  on conflict do nothing;

  -- سجلات حضور لموظف المخازن (فترة مسائية)
  insert into public.attendance_records (
    employee_id, date, shift_id, check_in_time, check_out_time,
    check_in_method, status, late_minutes
  )
  select 
    emp3_id,
    (current_date - interval '1 day' * i)::date,
    shift_evening_id,
    date_trunc('day', current_date - interval '1 day' * i) + time '14:10:00',
    date_trunc('day', current_date - interval '1 day' * i) + time '20:00:00',
    'nfc',
    case when i % 5 = 0 then 'late' else 'present' end,
    case when i % 5 = 0 then 10 else 0 end
  from generate_series(1, 20) as i
  where emp3_id is not null
  on conflict do nothing;

  -- تصحيح اسم الجدول من employee_evaluations إلى evaluations
  -- إضافة تقييمات تجريبية
  -- تقييم لموظف المبيعات 1
  insert into public.evaluations (
    employee_id, evaluator_id, evaluation_date, period_start, period_end,
    overall_score, comments, status
  ) values (
    emp1_id,
    emp_supervisor_id,
    current_date - interval '1 month',
    current_date - interval '2 months',
    current_date - interval '1 month',
    85.50,
    'أداء جيد بشكل عام، يحتاج إلى تحسين الالتزام بالمواعيد',
    'approved'
  )
  on conflict do nothing;

  -- إضافة تفاصيل التقييم
  insert into public.evaluation_details (
    evaluation_id, criteria_id, score
  )
  select 
    ev.id,
    cr.id,
    case cr.name
      when 'الالتزام بالحضور' then 70.00
      when 'جودة العمل' then 90.00
      when 'التعاون' then 85.00
      when 'المبادرة' then 80.00
      when 'الانضباط' then 95.00
    end
  from 
    public.evaluations ev,
    public.evaluation_criteria cr
  where 
    ev.employee_id = emp1_id
  on conflict do nothing;

  -- تقييم لموظف المبيعات 2
  insert into public.evaluations (
    employee_id, evaluator_id, evaluation_date, period_start, period_end,
    overall_score, comments, status
  ) values (
    emp2_id,
    emp_supervisor_id,
    current_date - interval '1 month',
    current_date - interval '2 months',
    current_date - interval '1 month',
    92.00,
    'أداء ممتاز، موظفة ملتزمة ومتعاونة',
    'approved'
  )
  on conflict do nothing;

  -- إضافة تفاصيل التقييم
  insert into public.evaluation_details (
    evaluation_id, criteria_id, score
  )
  select 
    ev.id,
    cr.id,
    case cr.name
      when 'الالتزام بالحضور' then 95.00
      when 'جودة العمل' then 90.00
      when 'التعاون' then 95.00
      when 'المبادرة' then 85.00
      when 'الانضباط' then 95.00
    end
  from 
    public.evaluations ev,
    public.evaluation_criteria cr
  where 
    ev.employee_id = emp2_id
  on conflict do nothing;

  -- إضافة معايير تقييم إضافية خاصة بقسم المبيعات
  insert into public.evaluation_criteria (name, description, weight, department_id) values
    ('تحقيق الأهداف البيعية', 'مدى تحقيق الأهداف البيعية المحددة', 35.00, dept_sales_id),
    ('خدمة العملاء', 'جودة التعامل مع العملاء', 25.00, dept_sales_id),
    ('المعرفة بالمنتجات', 'الإلمام بمنتجات العطور وخصائصها', 20.00, dept_sales_id),
    ('مهارات البيع', 'القدرة على الإقناع وإتمام الصفقات', 20.00, dept_sales_id)
  on conflict do nothing;

  -- إضافة معايير تقييم خاصة بقسم المخازن
  insert into public.evaluation_criteria (name, description, weight, department_id) values
    ('تنظيم المخزن', 'مدى تنظيم وترتيب المخزن', 30.00, dept_warehouse_id),
    ('دقة الجرد', 'دقة عمليات الجرد والتسجيل', 35.00, dept_warehouse_id),
    ('السرعة في التسليم', 'سرعة تجهيز وتسليم الطلبات', 20.00, dept_warehouse_id),
    ('الحفاظ على المنتجات', 'العناية بالمنتجات ومنع التلف', 15.00, dept_warehouse_id)
  on conflict do nothing;

end $$;

-- إضافة إشعار بنجاح تحميل البيانات
do $$
begin
  raise notice 'تم تحميل البيانات التجريبية بنجاح!';
  raise notice 'الحسابات التجريبية:';
  raise notice '1. manager@ipe.com (مدير) - كلمة المرور: Test@123456';
  raise notice '2. supervisor@ipe.com (مشرف) - كلمة المرور: Test@123456';
  raise notice '3. employee1@ipe.com (موظف) - كلمة المرور: Test@123456';
  raise notice '4. employee2@ipe.com (موظف) - كلمة المرور: Test@123456';
  raise notice '5. employee3@ipe.com (موظف) - كلمة المرور: Test@123456';
  raise notice 'يرجى إنشاء هذه الحسابات في Supabase Auth أولاً';
end $$;
