-- إنشاء جدول الأقسام
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- إنشاء جدول الموظفين
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  phone text,
  department_id uuid references public.departments(id) on delete set null,
  role text not null check (role in ('manager', 'supervisor', 'employee')),
  -- إضافة عمود position للمسمى الوظيفي
  position text,
  employee_number text unique not null,
  hire_date date not null,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- إنشاء جدول فترات العمل
create table if not exists public.work_shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  end_time time not null,
  shift_type text not null check (shift_type in ('morning', 'evening')),
  grace_period_minutes integer default 15,
  department_id uuid references public.departments(id) on delete cascade,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- إنشاء جدول سجلات الحضور
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade not null,
  date date not null,
  shift_id uuid references public.work_shifts(id) on delete set null,
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  status text not null check (status in ('present', 'absent', 'late', 'half_day', 'excused')),
  late_minutes integer default 0,
  check_in_method text check (check_in_method in ('location', 'fingerprint', 'nfc', 'supervisor', 'manual')),
  check_in_location text,
  notes text,
  approved_by uuid references public.employees(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(employee_id, date, shift_id)
);

-- إنشاء جدول معايير التقييم
create table if not exists public.evaluation_criteria (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  weight numeric(5,2) not null check (weight >= 0 and weight <= 100),
  department_id uuid references public.departments(id) on delete cascade,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- إنشاء جدول التقييمات
create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade not null,
  evaluator_id uuid references public.employees(id) not null,
  evaluation_date date not null,
  period_start date not null,
  period_end date not null,
  overall_score numeric(5,2) check (overall_score >= 0 and overall_score <= 100),
  comments text,
  status text not null check (status in ('draft', 'submitted', 'approved')) default 'draft',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- إنشاء جدول تفاصيل التقييم
create table if not exists public.evaluation_details (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid references public.evaluations(id) on delete cascade not null,
  criteria_id uuid references public.evaluation_criteria(id) on delete cascade not null,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  notes text,
  created_at timestamp with time zone default now()
);

-- إنشاء جدول إعدادات الحضور
create table if not exists public.attendance_settings (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  allowed_check_in_methods text[] default array['location', 'fingerprint', 'nfc', 'supervisor'],
  allowed_locations jsonb,
  require_location boolean default false,
  auto_mark_absent boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  check (
    (department_id is not null and employee_id is null) or
    (department_id is null and employee_id is not null)
  )
);

-- تفعيل Row Level Security
alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.work_shifts enable row level security;
alter table public.attendance_records enable row level security;
alter table public.evaluation_criteria enable row level security;
alter table public.evaluations enable row level security;
alter table public.evaluation_details enable row level security;
alter table public.attendance_settings enable row level security;

-- إنشاء فهارس لتحسين الأداء
create index if not exists idx_employees_department on public.employees(department_id);
create index if not exists idx_employees_user on public.employees(user_id);
create index if not exists idx_attendance_employee on public.attendance_records(employee_id);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_evaluations_employee on public.evaluations(employee_id);
create index if not exists idx_evaluations_date on public.evaluations(evaluation_date);
