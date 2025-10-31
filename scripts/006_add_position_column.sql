-- إضافة عمود position إلى جدول الموظفين
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS position text;

-- تحديث الموظفين الموجودين بمسميات وظيفية افتراضية
UPDATE public.employees 
SET position = CASE 
  WHEN role = 'manager' THEN 'مدير'
  WHEN role = 'supervisor' THEN 'مشرف'
  ELSE 'موظف'
END
WHERE position IS NULL;
