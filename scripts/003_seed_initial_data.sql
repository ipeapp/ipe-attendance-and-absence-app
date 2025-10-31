-- إضافة بيانات تجريبية للأقسام
insert into public.departments (name, description) values
  ('المبيعات', 'قسم المبيعات والتسويق'),
  ('الإدارة', 'الإدارة العامة والموارد البشرية'),
  ('المخازن', 'إدارة المخازن والمستودعات'),
  ('المحاسبة', 'القسم المالي والمحاسبة')
on conflict do nothing;

-- إضافة فترات عمل افتراضية
insert into public.work_shifts (name, start_time, end_time, shift_type, grace_period_minutes) values
  ('الفترة الصباحية', '08:00:00', '14:00:00', 'morning', 15),
  ('الفترة المسائية', '14:00:00', '20:00:00', 'evening', 15)
on conflict do nothing;

-- إضافة معايير تقييم افتراضية
insert into public.evaluation_criteria (name, description, weight) values
  ('الالتزام بالحضور', 'الالتزام بمواعيد الحضور والانصراف', 25.00),
  ('جودة العمل', 'مستوى الجودة في إنجاز المهام', 30.00),
  ('التعاون', 'التعاون مع الزملاء والعمل الجماعي', 20.00),
  ('المبادرة', 'المبادرة في تحسين العمل وحل المشكلات', 15.00),
  ('الانضباط', 'الالتزام بقواعد وأنظمة العمل', 10.00)
on conflict do nothing;
