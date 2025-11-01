import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsChart, ComparisonCard } from "@/components/stats-chart"
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Award,
  AlertTriangle,
  Target,
  Activity,
} from "lucide-react"

async function getAnalyticsData() {
  const supabase = await createClient()
  const today = new Date()
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0]
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().split("T")[0]
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1).toISOString().split("T")[0]

  // Get all active employees
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, department_id")
    .eq("is_active", true)

  const employeeIds = employees?.map((e) => e.id) || []

  // Monthly attendance trends (last 6 months)
  const monthlyTrends = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0)

    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("status")
      .in("employee_id", employeeIds)
      .gte("date", monthStart.toISOString().split("T")[0])
      .lte("date", monthEnd.toISOString().split("T")[0])

    const present = attendance?.filter((a) => a.status === "present" || a.status === "late").length || 0
    const absent = attendance?.filter((a) => a.status === "absent").length || 0

    monthlyTrends.push({
      month: monthStart.toLocaleDateString("ar-SA", { month: "short" }),
      present,
      absent,
      rate: attendance && attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0,
    })
  }

  // Department performance comparison
  const { data: departments } = await supabase.from("departments").select("id, name")

  const departmentPerformance = await Promise.all(
    (departments || []).map(async (dept) => {
      const deptEmployees = employees?.filter((e) => e.department_id === dept.id) || []
      const deptEmployeeIds = deptEmployees.map((e) => e.id)

      // Attendance rate
      const { data: attendance } = await supabase
        .from("attendance_records")
        .select("status")
        .in("employee_id", deptEmployeeIds)
        .gte("date", threeMonthsAgo)

      const presentCount = attendance?.filter((a) => a.status === "present" || a.status === "late").length || 0
      const attendanceRate = attendance && attendance.length > 0 ? (presentCount / attendance.length) * 100 : 0

      // Evaluation average
      const { data: evaluations } = await supabase
        .from("evaluations")
        .select("overall_score")
        .in("employee_id", deptEmployeeIds)
        .eq("status", "approved")
        .gte("evaluation_date", threeMonthsAgo)

      const avgScore =
        evaluations && evaluations.length > 0
          ? evaluations.reduce((sum, e) => sum + (e.overall_score || 0), 0) / evaluations.length
          : 0

      return {
        name: dept.name,
        attendance: Math.round(attendanceRate),
        performance: Math.round(avgScore),
        employeeCount: deptEmployees.length,
      }
    })
  )

  // Risk analysis - employees with poor attendance/performance
  const { data: recentAttendance } = await supabase
    .from("attendance_records")
    .select("employee_id, status")
    .in("employee_id", employeeIds)
    .gte("date", currentMonth)

  const employeeAttendanceMap = new Map<string, { present: number; total: number }>()
  recentAttendance?.forEach((record) => {
    const current = employeeAttendanceMap.get(record.employee_id) || { present: 0, total: 0 }
    current.total++
    if (record.status === "present" || record.status === "late") {
      current.present++
    }
    employeeAttendanceMap.set(record.employee_id, current)
  })

  const atRiskEmployees = []
  for (const [employeeId, stats] of employeeAttendanceMap.entries()) {
    const rate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0
    if (rate < 75 && stats.total >= 5) {
      const emp = employees?.find((e) => e.id === employeeId)
      if (emp) {
        atRiskEmployees.push({
          name: emp.full_name,
          attendanceRate: Math.round(rate),
          daysAbsent: stats.total - stats.present,
        })
      }
    }
  }

  // Overall statistics
  const { data: currentMonthAttendance } = await supabase
    .from("attendance_records")
    .select("status")
    .in("employee_id", employeeIds)
    .gte("date", currentMonth)

  const { data: lastMonthAttendance } = await supabase
    .from("attendance_records")
    .select("status")
    .in("employee_id", employeeIds)
    .gte("date", lastMonth)
    .lt("date", currentMonth)

  const currentPresent =
    currentMonthAttendance?.filter((a) => a.status === "present" || a.status === "late").length || 0
  const lastPresent =
    lastMonthAttendance?.filter((a) => a.status === "present" || a.status === "late").length || 0

  const currentAbsent = currentMonthAttendance?.filter((a) => a.status === "absent").length || 0
  const lastAbsent = lastMonthAttendance?.filter((a) => a.status === "absent").length || 0

  return {
    monthlyTrends,
    departmentPerformance,
    atRiskEmployees: atRiskEmployees.slice(0, 10),
    currentPresent,
    lastPresent,
    currentAbsent,
    lastAbsent,
    totalEmployees: employees?.length || 0,
  }
}

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!employee || employee.role !== "manager") {
    redirect("/dashboard")
  }

  const data = await getAnalyticsData()

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-[var(--foreground)]">
            <Activity className="h-8 w-8 text-[var(--brand-600)]" />
            لوحة التحليلات المتقدمة
          </h1>
          <p className="mt-2 text-[var(--neutral-500)]">رؤى استراتيجية وتحليل عميق للبيانات</p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ComparisonCard
            title="أيام الحضور الكلية"
            currentValue={data.currentPresent}
            previousValue={data.lastPresent}
            icon={<Users className="h-5 w-5 text-green-600" />}
            valueLabel="يوم"
          />
          <ComparisonCard
            title="أيام الغياب الكلية"
            currentValue={data.currentAbsent}
            previousValue={data.lastAbsent}
            icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
            valueLabel="يوم"
          />
          <Card className="border-violet-100">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-violet-600" />
                    <p className="text-sm font-medium text-[var(--neutral-500)]">معدل الانضباط</p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">
                    {data.currentPresent + data.currentAbsent > 0
                      ? Math.round((data.currentPresent / (data.currentPresent + data.currentAbsent)) * 100)
                      : 0}
                    <span className="text-lg text-[var(--neutral-500)]">%</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-medium text-[var(--neutral-500)]">موظفون نشطون</p>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{data.totalEmployees}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <StatsChart
          title="اتجاه الحضور - آخر 6 أشهر"
          data={data.monthlyTrends.map((m) => ({
            label: m.month,
            value: m.present,
            color: "bg-green-500",
          }))}
          type="line"
          icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
        />

        {/* Department Performance Matrix */}
        <Card className="border-violet-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-600" />
              مصفوفة أداء الأقسام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.departmentPerformance.length === 0 ? (
                <p className="text-center text-[var(--neutral-500)] py-8">لا توجد بيانات</p>
              ) : (
                data.departmentPerformance.map((dept, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-4 gap-4 rounded-lg border border-violet-100 bg-white p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{dept.name}</p>
                      <p className="text-xs text-[var(--neutral-500)]">{dept.employeeCount} موظف</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-[var(--neutral-500)]">الحضور</p>
                      <p
                        className={`text-2xl font-bold ${
                          dept.attendance >= 90
                            ? "text-green-600"
                            : dept.attendance >= 75
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {dept.attendance}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-[var(--neutral-500)]">الأداء</p>
                      <p
                        className={`text-2xl font-bold ${
                          dept.performance >= 90
                            ? "text-green-600"
                            : dept.performance >= 75
                            ? "text-blue-600"
                            : "text-amber-600"
                        }`}
                      >
                        {dept.performance}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-[var(--neutral-500)]">التصنيف</p>
                      <p className="text-lg font-bold">
                        {dept.attendance >= 85 && dept.performance >= 85
                          ? "⭐⭐⭐"
                          : dept.attendance >= 75 && dept.performance >= 75
                          ? "⭐⭐"
                          : "⭐"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* At-Risk Employees */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              موظفون يحتاجون متابعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.atRiskEmployees.length === 0 ? (
              <div className="py-8 text-center">
                <Award className="mx-auto h-16 w-16 text-green-600 mb-4" />
                <p className="text-lg font-medium text-green-700">ممتاز!</p>
                <p className="text-sm text-green-600">جميع الموظفين لديهم معدلات حضور جيدة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.atRiskEmployees.map((emp, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4"
                  >
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{emp.name}</p>
                      <p className="text-sm text-[var(--neutral-500)]">
                        {emp.daysAbsent} يوم غياب هذا الشهر
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{emp.attendanceRate}%</p>
                      <p className="text-xs text-[var(--neutral-500)]">نسبة الحضور</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights & Recommendations */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="text-lg">رؤى استراتيجية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {data.monthlyTrends.length >= 2 && (
                <>
                  {data.monthlyTrends[data.monthlyTrends.length - 1].rate >
                  data.monthlyTrends[data.monthlyTrends.length - 2].rate ? (
                    <div className="flex items-start gap-2 text-green-700">
                      <span>✅</span>
                      <span>اتجاه إيجابي في معدلات الحضور</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-amber-700">
                      <span>⚠️</span>
                      <span>انخفاض في معدلات الحضور - يحتاج تدخل</span>
                    </div>
                  )}
                </>
              )}
              {data.departmentPerformance.some((d) => d.attendance < 75) && (
                <div className="flex items-start gap-2 text-red-700">
                  <span>🔴</span>
                  <span>بعض الأقسام تحتاج تحسين الانضباط</span>
                </div>
              )}
              {data.atRiskEmployees.length > 0 && (
                <div className="flex items-start gap-2 text-amber-700">
                  <span>⚠️</span>
                  <span>{data.atRiskEmployees.length} موظف يحتاجون متابعة عاجلة</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-white">
            <CardHeader>
              <CardTitle className="text-lg">توصيات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2 text-violet-700">
                <span>💡</span>
                <span>مراجعة سياسات الحضور للأقسام ذات الأداء المنخفض</span>
              </div>
              <div className="flex items-start gap-2 text-violet-700">
                <span>💡</span>
                <span>عقد اجتماعات فردية مع الموظفين المعرضين للخطر</span>
              </div>
              <div className="flex items-start gap-2 text-violet-700">
                <span>💡</span>
                <span>تطبيق نظام مكافآت للحضور المتميز</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
