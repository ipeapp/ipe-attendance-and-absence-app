import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar, TrendingUp, Users, ClipboardCheck } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceReport } from "@/components/attendance-report"
import { EvaluationReport } from "@/components/evaluation-report"
import { EmployeeReport } from "@/components/employee-report"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    startDate?: string
    endDate?: string
    department?: string
    employee?: string
  }>
}) {
  const { startDate, endDate, department, employee: employeeFilter } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: employee } = await supabase.from("employees").select("*").eq("user_id", user.id).single()

  if (!employee || (employee.role !== "manager" && employee.role !== "supervisor")) {
    redirect("/dashboard")
  }

  // Get departments for filters
  const { data: departments } = await supabase.from("departments").select("*").order("name")

  // Get employees for filters
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, employee_number, department_id")
    .eq("is_active", true)
    .order("full_name")

  // Calculate date range (default to current month)
  const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
  const end = endDate || new Date().toISOString().split("T")[0]

  // Get attendance data
  let attendanceQuery = supabase
    .from("attendance_records")
    .select("*, employee:employees(full_name, employee_number, department_id), shift:work_shifts(name)")
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })

  if (department) {
    attendanceQuery = attendanceQuery.eq("employee.department_id", department)
  }

  if (employeeFilter) {
    attendanceQuery = attendanceQuery.eq("employee_id", employeeFilter)
  }

  const { data: attendanceData } = await attendanceQuery

  // Get evaluation data
  let evaluationQuery = supabase
    .from("evaluations")
    .select(
      "*, employee:employees!evaluations_employee_id_fkey(full_name, employee_number, department_id), evaluator:employees!evaluations_evaluator_id_fkey(full_name)",
    )
    .gte("evaluation_date", start)
    .lte("evaluation_date", end)
    .order("evaluation_date", { ascending: false })

  if (department) {
    evaluationQuery = evaluationQuery.eq("employee.department_id", department)
  }

  if (employeeFilter) {
    evaluationQuery = evaluationQuery.eq("employee_id", employeeFilter)
  }

  const { data: evaluationData } = await evaluationQuery

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-violet-600" />
            التقارير والإحصائيات
          </h1>
          <p className="text-muted-foreground mt-1">عرض وتصدير التقارير المختلفة</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-violet-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي السجلات</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-600">{attendanceData?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-violet-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">أيام الحضور</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {attendanceData?.filter((r) => r.status === "present" || r.status === "late").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">أيام الغياب</CardTitle>
              <Calendar className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {attendanceData?.filter((r) => r.status === "absent").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">التقييمات</CardTitle>
              <Users className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-600">{evaluationData?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="attendance">الحضور</TabsTrigger>
            <TabsTrigger value="evaluations">التقييمات</TabsTrigger>
            <TabsTrigger value="employees">الموظفين</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <AttendanceReport
              data={attendanceData || []}
              departments={departments || []}
              employees={employees || []}
              startDate={start}
              endDate={end}
            />
          </TabsContent>

          <TabsContent value="evaluations">
            <EvaluationReport
              data={evaluationData || []}
              departments={departments || []}
              employees={employees || []}
              startDate={start}
              endDate={end}
            />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeReport employees={employees || []} departments={departments || []} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
