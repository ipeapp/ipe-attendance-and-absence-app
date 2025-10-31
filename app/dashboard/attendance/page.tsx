import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardCheck, Calendar } from "lucide-react"
import { AttendanceCheckIn } from "@/components/attendance-check-in"
import { AttendanceHistory } from "@/components/attendance-history"
import { SupervisorAttendanceManager } from "@/components/supervisor-attendance-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; status?: string }>
}) {
  const { date, status } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("*, department:departments(*)")
    .eq("user_id", user.id)
    .single()

  if (!employee) {
    redirect("/dashboard")
  }

  // Get today's attendance
  const today = new Date().toISOString().split("T")[0]
  const { data: todayAttendance } = await supabase
    .from("attendance_records")
    .select("*, shift:work_shifts(*)")
    .eq("employee_id", employee.id)
    .eq("date", today)
    .order("created_at", { ascending: false })

  // Get work shifts
  const { data: shifts } = await supabase.from("work_shifts").select("*").eq("is_active", true).order("start_time")

  // Get attendance history
  let historyQuery = supabase
    .from("attendance_records")
    .select("*, shift:work_shifts(*)")
    .eq("employee_id", employee.id)
    .order("date", { ascending: false })
    .limit(30)

  if (date) {
    historyQuery = historyQuery.eq("date", date)
  }

  if (status) {
    historyQuery = historyQuery.eq("status", status)
  }

  const { data: attendanceHistory } = await historyQuery

  // For managers/supervisors, get team attendance and employees
  let teamAttendance = null
  let allEmployees = null
  if (employee.role === "manager" || employee.role === "supervisor") {
    const { data } = await supabase
      .from("attendance_records")
      .select("*, employee:employees(full_name, employee_number), shift:work_shifts(*)")
      .eq("date", today)
      .order("created_at", { ascending: false })

    teamAttendance = data

    // Get all employees for supervisor management
    let employeesQuery = supabase
      .from("employees")
      .select("*, department:departments(*)")
      .eq("is_active", true)
      .order("full_name")

    // Supervisors see only their department's employees
    if (employee.role === "supervisor" && employee.department_id) {
      employeesQuery = employeesQuery.eq("department_id", employee.department_id)
    }

    const { data: empData } = await employeesQuery
    allEmployees = empData

    // Get today's attendance for all employees
    const { data: allAttendanceData } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("date", today)

    teamAttendance = allAttendanceData
  }

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-violet-600" />
            الحضور والغياب
          </h1>
          <p className="text-muted-foreground mt-1">تسجيل الحضور والانصراف ومتابعة السجلات</p>
        </div>

        <Tabs defaultValue={employee.role === "manager" || employee.role === "supervisor" ? "team" : "checkin"} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            {(employee.role === "manager" || employee.role === "supervisor") && (
              <TabsTrigger value="team">إدارة الفريق</TabsTrigger>
            )}
            <TabsTrigger value="checkin">تسجيل الحضور</TabsTrigger>
            <TabsTrigger value="history">السجلات</TabsTrigger>
          </TabsList>

          {(employee.role === "manager" || employee.role === "supervisor") && (
            <TabsContent value="team">
              <SupervisorAttendanceManager
                employees={allEmployees || []}
                todayAttendance={teamAttendance || []}
                shifts={shifts || []}
                supervisorId={employee.id}
              />
            </TabsContent>
          )}

          <TabsContent value="checkin" className="space-y-6">
            <AttendanceCheckIn employee={employee} todayAttendance={todayAttendance || []} shifts={shifts || []} />
          </TabsContent>

          <TabsContent value="history">
            <AttendanceHistory attendance={attendanceHistory || []} canFilter={true} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
