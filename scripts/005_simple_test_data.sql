-- سكريبت بيانات تجريبية مبسط وصحيح
-- تأكد من تشغيل السكريبتات بالترتيب: 001, 002, 003, ثم 005

-- حذف البيانات القديمة إن وجدت
truncate table public.evaluation_details cascade;
truncate table public.evaluations cascade;
truncate table public.attendance_records cascade;
truncate table public.attendance_settings cascade;
truncate table public.employees cascade;
truncate table public.evaluation_criteria cascade;
truncate table public.work_shifts cascade;
truncate table public.departments cascade;

-- إضافة الأقسام
insert into public.departments (id, name, description) values
  ('11111111-1111-1111-1111-111111111111', 'المبيعات', 'قسم المبيعات والتسويق'),
  ('22222222-2222-2222-2222-222222222222', 'الإدارة', 'الإدارة العامة والموارد البشرية'),
  ('33333333-3333-3333-3333-333333333333', 'المخازن', 'إدارة المخازن والمستودعات'),
  ('44444444-4444-4444-4444-444444444444', 'المحاسبة', 'القسم المالي والمحاسبة');

-- إضافة فترات العمل
insert into public.work_shifts (id, name, start_time, end_time, shift_type, grace_period_minutes, department_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'الفترة الصباحية', '08:00:00', '14:00:00', 'morning', 15, null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'الفترة المسائية', '14:00:00', '20:00:00', 'evening', 15, null);

-- إضافة الموظفين
insert into public.employees (id, full_name, email, phone, department_id, position, role, employee_number, hire_date, is_active) values
  ('e1111111-1111-1111-1111-111111111111', 'أحمد محمد المدير', 'manager@ipe.com', '+967777111111', '22222222-2222-2222-2222-222222222222', 'مدير عام', 'manager', 'EMP001', '2020-01-01', true),
  ('e2222222-2222-2222-2222-222222222222', 'فاطمة علي المشرفة', 'supervisor@ipe.com', '+967777222222', '11111111-1111-1111-1111-111111111111', 'مشرف المبيعات', 'supervisor', 'EMP002', '2021-03-15', true),
  ('e3333333-3333-3333-3333-333333333333', 'خالد سعيد البائع', 'employee1@ipe.com', '+967777333333', '11111111-1111-1111-1111-111111111111', 'موظف مبيعات', 'employee', 'EMP003', '2022-06-01', true),
  ('e4444444-4444-4444-4444-444444444444', 'مريم حسن البائعة', 'employee2@ipe.com', '+967777444444', '11111111-1111-1111-1111-111111111111', 'موظف مبيعات', 'employee', 'EMP004', '2022-08-15', true),
  ('e5555555-5555-5555-5555-555555555555', 'عبدالله يحيى أمين المخزن', 'employee3@ipe.com', '+967777555555', '33333333-3333-3333-3333-333333333333', 'أمين مخزن', 'employee', 'EMP005', '2021-11-20', true),
  ('e6666666-6666-6666-6666-666666666666', 'سارة أحمد المحاسبة', 'accountant@ipe.com', '+967777666666', '44444444-4444-4444-4444-444444444444', 'محاسب', 'employee', 'EMP006', '2021-05-10', true);

-- إضافة معايير التقييم العامة
insert into public.evaluation_criteria (id, name, description, weight, department_id) values
  ('c1111111-1111-1111-1111-111111111111', 'الالتزام بالحضور', 'الالتزام بمواعيد الحضور والانصراف', 25.00, null),
  ('c2222222-2222-2222-2222-222222222222', 'جودة العمل', 'مستوى الجودة في إنجاز المهام', 30.00, null),
  ('c3333333-3333-3333-3333-333333333333', 'التعاون', 'التعاون مع الزملاء والعمل الجماعي', 20.00, null),
  ('c4444444-4444-4444-4444-444444444444', 'المبادرة', 'المبادرة في تحسين العمل وحل المشكلات', 15.00, null),
  ('c5555555-5555-5555-5555-555555555555', 'الانضباط', 'الالتزام بقواعد وأنظمة العمل', 10.00, null);

-- إضافة معايير تقييم خاصة بقسم المبيعات
insert into public.evaluation_criteria (id, name, description, weight, department_id) values
  ('c6666666-6666-6666-6666-666666666666', 'تحقيق الأهداف البيعية', 'مدى تحقيق الأهداف البيعية المحددة', 35.00, '11111111-1111-1111-1111-111111111111'),
  ('c7777777-7777-7777-7777-777777777777', 'خدمة العملاء', 'جودة التعامل مع العملاء', 25.00, '11111111-1111-1111-1111-111111111111'),
  ('c8888888-8888-8888-8888-888888888888', 'المعرفة بالمنتجات', 'الإلمام بمنتجات العطور وخصائصها', 20.00, '11111111-1111-1111-1111-111111111111'),
  ('c9999999-9999-9999-9999-999999999999', 'مهارات البيع', 'القدرة على الإقناع وإتمام الصفقات', 20.00, '11111111-1111-1111-1111-111111111111');

-- إضافة سجلات حضور للموظف الأول (20 يوم)
insert into public.attendance_records (employee_id, date, shift_id, check_in_time, check_out_time, status, late_minutes, check_in_method, notes)
select 
  'e3333333-3333-3333-3333-333333333333',
  (current_date - i)::date,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  (current_date - i)::timestamp + interval '8 hours 5 minutes',
  (current_date - i)::timestamp + interval '14 hours',
  case 
    when i % 10 = 0 then 'absent'
    when i % 7 = 0 then 'late'
    else 'present'
  end,
  case when i % 7 = 0 then 5 else 0 end,
  'manual',
  case when i % 10 = 0 then 'غياب بدون عذر' else null end
from generate_series(1, 20) as i;

-- إضافة سجلات حضور للموظف الثاني (20 يوم)
insert into public.attendance_records (employee_id, date, shift_id, check_in_time, check_out_time, status, late_minutes, check_in_method)
select 
  'e4444444-4444-4444-4444-444444444444',
  (current_date - i)::date,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  (current_date - i)::timestamp + interval '7 hours 55 minutes',
  (current_date - i)::timestamp + interval '14 hours 5 minutes',
  'present',
  0,
  'location'
from generate_series(1, 20) as i;

-- إضافة سجلات حضور للموظف الثالث - فترة مسائية (20 يوم)
insert into public.attendance_records (employee_id, date, shift_id, check_in_time, check_out_time, status, late_minutes, check_in_method)
select 
  'e5555555-5555-5555-5555-555555555555',
  (current_date - i)::date,
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  (current_date - i)::timestamp + interval '14 hours 10 minutes',
  (current_date - i)::timestamp + interval '20 hours',
  case when i % 5 = 0 then 'late' else 'present' end,
  case when i % 5 = 0 then 10 else 0 end,
  'nfc'
from generate_series(1, 20) as i;

-- إضافة تقييم للموظف الأول
insert into public.evaluations (id, employee_id, evaluator_id, evaluation_date, period_start, period_end, overall_score, comments, status) values
  ('11111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', current_date - interval '1 month', current_date - interval '2 months', current_date - interval '1 month', 85.50, 'أداء جيد بشكل عام، يحتاج إلى تحسين الالتزام بالمواعيد', 'approved');

-- إضافة تفاصيل التقييم للموظف الأول
insert into public.evaluation_details (evaluation_id, criteria_id, score, notes) values
  ('11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 70.00, 'يحتاج تحسين'),
  ('11111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 90.00, 'ممتاز'),
  ('11111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 85.00, 'جيد جداً'),
  ('11111111-1111-1111-1111-111111111111', 'c4444444-4444-4444-4444-444444444444', 80.00, 'جيد'),
  ('11111111-1111-1111-1111-111111111111', 'c5555555-5555-5555-5555-555555555555', 95.00, 'ممتاز');

-- إضافة تقييم للموظف الثاني
insert into public.evaluations (id, employee_id, evaluator_id, evaluation_date, period_start, period_end, overall_score, comments, status) values
  ('22222222-2222-2222-2222-222222222222', 'e4444444-4444-4444-4444-444444444444', 'e2222222-2222-2222-2222-222222222222', current_date - interval '1 month', current_date - interval '2 months', current_date - interval '1 month', 92.00, 'أداء ممتاز، موظفة ملتزمة ومتعاونة', 'approved');

-- إضافة تفاصيل التقييم للموظف الثاني
insert into public.evaluation_details (evaluation_id, criteria_id, score, notes) values
  ('22222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 95.00, 'ممتاز'),
  ('22222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 90.00, 'ممتاز'),
  ('22222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 95.00, 'ممتاز'),
  ('22222222-2222-2222-2222-222222222222', 'c4444444-4444-4444-4444-444444444444', 85.00, 'جيد جداً'),
  ('22222222-2222-2222-2222-222222222222', 'c5555555-5555-5555-5555-555555555555', 95.00, 'ممتاز');

-- رسالة نجاح
do $$
begin
  raise notice '✅ تم تحميل البيانات التجريبية بنجاح!';
  raise notice '';
  raise notice '📋 الحسابات التجريبية (كلمة المرور لجميع الحسابات: Test@123456):';
  raise notice '1. manager@ipe.com - مدير عام';
  raise notice '2. supervisor@ipe.com - مشرف المبيعات';
  raise notice '3. employee1@ipe.com - موظف مبيعات';
  raise notice '4. employee2@ipe.com - موظف مبيعات';
  raise notice '5. employee3@ipe.com - أمين مخزن';
  raise notice '6. accountant@ipe.com - محاسب';
  raise notice '';
  raise notice '⚠️ ملاحظة: يجب إنشاء هذه الحسابات في Supabase Auth أولاً';
  raise notice '   يمكنك إنشاء الحسابات من صفحة Authentication في لوحة تحكم Supabase';
end $$;
