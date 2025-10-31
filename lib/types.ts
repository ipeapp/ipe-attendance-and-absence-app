export type UserRole = "manager" | "supervisor" | "employee"

export type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "excused"

export type CheckInMethod = "location" | "fingerprint" | "nfc" | "supervisor" | "manual"

export type ShiftType = "morning" | "evening"

export type EvaluationStatus = "draft" | "submitted" | "approved"

export interface Department {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  user_id: string | null
  full_name: string
  email: string
  phone: string | null
  department_id: string | null
  role: UserRole
  employee_number: string
  hire_date: string
  is_active: boolean
  created_at: string
  updated_at: string
  department?: Department
}

export interface WorkShift {
  id: string
  name: string
  start_time: string
  end_time: string
  shift_type: ShiftType
  grace_period_minutes: number
  department_id: string | null
  is_active: boolean
  created_at: string
}

export interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  shift_id: string | null
  check_in_time: string | null
  check_out_time: string | null
  status: AttendanceStatus
  late_minutes: number
  check_in_method: CheckInMethod | null
  check_in_location: string | null
  notes: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  employee?: Employee
  shift?: WorkShift
}

export interface EvaluationCriteria {
  id: string
  name: string
  description: string | null
  weight: number
  department_id: string | null
  is_active: boolean
  created_at: string
}

export interface Evaluation {
  id: string
  employee_id: string
  evaluator_id: string
  evaluation_date: string
  period_start: string
  period_end: string
  overall_score: number | null
  comments: string | null
  status: EvaluationStatus
  created_at: string
  updated_at: string
  employee?: Employee
  evaluator?: Employee
}

export interface EvaluationDetail {
  id: string
  evaluation_id: string
  criteria_id: string
  score: number
  notes: string | null
  created_at: string
  criteria?: EvaluationCriteria
}
