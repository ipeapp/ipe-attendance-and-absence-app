import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsChart, ComparisonCard } from "@/components/stats-chart"
import { AttendanceCalendar } from "@/components/attendance-calendar"
import {
  FileText,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function getReportsData(employeeRole: string, employeeId: string) {
  const supabase = await createClient()
  const today = new Date()
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0]
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0]

  // Get all employees
  const { data: allEmployees } = await supabase
    .from("employees")
    .select("id, full_name, department_id")
    .eq("is_active", true)

  const employeeIds = allEmployees?.map((e) => e.id) || []

  // Current month attendance
  const { data: currentMonthAttendance } = await supabase
    .from("attendance_records")
    .select("status, employee_id, date")
    .in("employee_id", employeeIds)
    .gte("date", currentMonth)

  // Last month attendance
  const { data: lastMonthAttendance } = await supabase
    .from("attendance_records")
    .select("status")
    .in("employee_id", employeeIds)
    .gte("date", lastMonth)
    .lte("date", lastMonthEnd)

  // Calculate statistics
  const currentStats = {
    present: currentMonthAttendance?.filter((a) => a.status === "present").length || 0,
    late: currentMonthAttendance?.filter((a) => a.status === "late").length || 0,
    absent: currentMonthAttendance?.filter((a) => a.status === "absent").length || 0,
    excused: currentMonthAttendance?.filter((a) => a.status === "excused").length || 0,
  }

  const lastStats = {
    present: lastMonthAttendance?.filter((a) => a.status === "present").length || 0,
    late: lastMonthAttendance?.filter((a) => a.status === "late").length || 0,
    absent: lastMonthAttendance?.filter((a) => a.status === "absent").length || 0,
    excused: lastMonthAttendance?.filter((a) => a.status === "excused").length || 0,
  }

  // Department statistics
  const { data: departments } = await supabase.from("departments").select("id, name")

  const departmentStats = await Promise.all(
    (departments || []).map(async (dept) => {
      const deptEmployees = allEmployees?.filter((e) => e.department_id === dept.id) || []
      const deptEmployeeIds = deptEmployees.map((e) => e.id)

      const { count } = await supabase
        .from("attendance_records")
        .select("*", { count: "exact" })
        .in("employee_id", deptEmployeeIds)
        .gte("date", currentMonth)
        .eq("status", "present")

      return {
        label: dept.name,
        value: count || 0,
        color: "bg-violet-500",
      }
    })
  )

  // Weekly attendance trend (last 4 weeks)
  const weeklyStats = []
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - (i + 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const { count } = await supabase
      .from("attendance_records")
      .select("*", { count: "exact" })
      .in("employee_id", employeeIds)
      .gte("date", weekStart.toISOString().split("T")[0])
      .lte("date", weekEnd.toISOString().split("T")[0])
      .in("status", ["present", "late"])

    weeklyStats.push({
      label: `الأسبوع ${4 - i}`,
      value: count || 0,
      color: "bg-green-500",
    })
  }

  // Get evaluations statistics
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("overall_score, status")
    .in("employee_id", employeeIds)
    .gte("evaluation_date", threeMonthsAgo.toISOString().split("T")[0])
    .eq("status", "approved")

  const evaluationRanges = {
    excellent: evaluations?.filter((e) => (e.overall_score || 0) >= 90).length || 0,
    good: evaluations?.filter((e) => (e.overall_score || 0) >= 75 && (e.overall_score || 0) < 90).length || 0,
    average: evaluations?.filter((e) => (e.overall_score || 0) >= 60 && (e.overall_score || 0) < 75).length || 0,
    poor: evaluations?.filter((e) => (e.overall_score || 0) < 60).length || 0,
  }

  const evaluationStats = [
    { label: "ممتاز (90-100)", value: evaluationRanges.excellent, color: "bg-green-500" },
    { label: "جيد (75-89)", value: evaluationRanges.good, color: "bg-blue-500" },
    { label: "مقبول (60-74)", value: evaluationRanges.average, color: "bg-amber-500" },
    { label: "ضعيف (< 60)", value: evaluationRanges.poor, color: "bg-red-500" },
  ]

  // Top performers
  const { data: topPerformers } = await supabase
    .from("evaluations")
    .select("employee_id, overall_score, employees(full_name)")
    .in("employee_id", employeeIds)
    .eq("status", "approved")
    .order("overall_score", { ascending: false })
    .limit(5)

  return {
    currentStats,
    lastStats,
    departmentStats,
    weeklyStats,
    evaluationStats,
    topPerformers: topPerformers || [],
    totalEmployees: allEmployees?.length || 0,
    currentMonthAttendance: currentMonthAttendance || [],
  }
}

export default async function ReportsPage() {
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

  if (!employee || (employee.role !== "manager" && employee.role !== "supervisor")) {
    redirect("/dashboard")
  }

  const data = await getReportsData(employee.role, employee.id)

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-[var(--foreground)]">
              <BarChart3 className="h-8 w-8 text-[var(--brand-600)]" />
              التقارير والإحصائيات
            </h1>
            <p className="mt-2 text-[var(--neutral-500)]">تحليل شامل للحضور والأداء</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="ml-2 h-4 w-4" />
              تخصيص الفترة
            </Button>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Download className="ml-2 h-4 w-4" />
              تصدير PDF
            </Button>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ComparisonCard
            title="أيام الحضور"
            currentValue={data.currentStats.present}
            previousValue={data.lastStats.present}
            icon={<Users className="h-5 w-5 text-green-600" />}
            valueLabel="يوم"
          />
          <ComparisonCard
            title="أيام التأخير"
            currentValue={data.currentStats.late}
            previousValue={data.lastStats.late}
            icon={<Calendar className="h-5 w-5 text-amber-600" />}
            valueLabel="يوم"
          />
          <ComparisonCard
            title="أيام الغياب"
            currentValue={data.currentStats.absent}
            previousValue={data.lastStats.absent}
            icon={<TrendingUp className="h-5 w-5 text-red-600" />}
            valueLabel="يوم"
          />
          <ComparisonCard
            title="الإجازات"
            currentValue={data.currentStats.excused}
            previousValue={data.lastStats.excused}
            icon={<FileText className="h-5 w-5 text-blue-600" />}
            valueLabel="يوم"
          />
        </div>

        {/* Tabs for different reports */}
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="attendance">
              <Calendar className="ml-2 h-4 w-4" />
              الحضور
            </TabsTrigger>
            <TabsTrigger value="departments">
              <Building2 className="ml-2 h-4 w-4" />
              الأقسام
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="ml-2 h-4 w-4" />
              الأداء
            </TabsTrigger>
            <TabsTrigger value="trends">
              <BarChart3 className="ml-2 h-4 w-4" />
              الاتجاهات
            </TabsTrigger>
          </TabsList>

          {/* Attendance Report */}
          <TabsContent value="attendance" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <StatsChart
                title="حالات الحضور - الشهر الحالي"
                data={[
                  { label: "حاضر", value: data.currentStats.present, color: "bg-green-500" },
                  { label: "متأخر", value: data.currentStats.late, color: "bg-amber-500" },
                  { label: "غائب", value: data.currentStats.absent, color: "bg-red-500" },
                  { label: "إجازة", value: data.currentStats.excused, color: "bg-blue-500" },
                ]}
                type="bar"
                showPercentage
                icon={<PieChart className="h-5 w-5 text-violet-600" />}
              />

              <StatsChart
                title="حالات الحضور - توزيع النسب"
                data={[
                  { label: "حاضر", value: data.currentStats.present, color: "bg-green-500" },
                  { label: "متأخر", value: data.currentStats.late, color: "bg-amber-500" },
                  { label: "غائب", value: data.currentStats.absent, color: "bg-red-500" },
                  { label: "إجازة", value: data.currentStats.excused, color: "bg-blue-500" },
                ]}
                type="pie"
                icon={<PieChart className="h-5 w-5 text-violet-600" />}
              />
            </div>

            {/* Calendar View */}
            <AttendanceCalendar records={data.currentMonthAttendance} />
          </TabsContent>

          {/* Departments Report */}
          <TabsContent value="departments" className="space-y-6">
            <StatsChart
              title="الحضور حسب الأقسام - الشهر الحالي"
              data={data.departmentStats}
              type="bar"
              icon={<Building2 className="h-5 w-5 text-violet-600" />}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.departmentStats.map((dept, index) => (
                <Card key={index} className="border-violet-100">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Building2 className="mx-auto h-8 w-8 text-violet-600 mb-2" />
                      <h3 className="font-semibold text-[var(--foreground)]">{dept.label}</h3>
                      <p className="mt-2 text-3xl font-bold text-violet-600">{dept.value}</p>
                      <p className="text-sm text-[var(--neutral-500)]">يوم حضور</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Performance Report */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <StatsChart
                title="توزيع التقييمات - آخر 3 أشهر"
                data={data.evaluationStats}
                type="bar"
                showPercentage
                icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
              />

              <StatsChart
                title="التقييمات - نسب الأداء"
                data={data.evaluationStats}
                type="pie"
                icon={<PieChart className="h-5 w-5 text-violet-600" />}
              />
            </div>

            {/* Top Performers */}
            <Card className="border-violet-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-violet-600" />
                  أفضل الموظفين أداءً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topPerformers.length === 0 ? (
                    <p className="text-center text-[var(--neutral-500)] py-8">لا توجد تقييمات معتمدة</p>
                  ) : (
                    data.topPerformers.map((performer: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-violet-100 bg-violet-50 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white font-bold">
                            {index + 1}
                          </div>
                          <span className="font-semibold text-[var(--foreground)]">
                            {performer.employees?.full_name || "غير معروف"}
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-violet-600">
                          {performer.overall_score?.toFixed(0) || "-"}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Report */}
          <TabsContent value="trends" className="space-y-6">
            <StatsChart
              title="اتجاه الحضور - آخر 4 أسابيع"
              data={data.weeklyStats}
              type="line"
              icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-violet-100">
                <CardHeader>
                  <CardTitle>ملخص الاتجاهات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--neutral-600)]">متوسط الحضور الأسبوعي:</span>
                    <span className="font-bold text-[var(--foreground)]">
                      {data.weeklyStats.length > 0
                        ? Math.round(
                            data.weeklyStats.reduce((sum, w) => sum + w.value, 0) / data.weeklyStats.length
                          )
                        : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--neutral-600)]">إجمالي الموظفين:</span>
                    <span className="font-bold text-[var(--foreground)]">{data.totalEmployees}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--neutral-600)]">نسبة الحضور المتوقعة:</span>
                    <span className="font-bold text-green-600">
                      {data.totalEmployees > 0 && data.weeklyStats.length > 0
                        ? Math.round(
                            ((data.weeklyStats.reduce((sum, w) => sum + w.value, 0) / data.weeklyStats.length) /
                              data.totalEmployees) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader>
                  <CardTitle>توصيات</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {data.currentStats.absent > data.lastStats.absent && (
                      <li className="flex items-start gap-2 text-amber-700">
                        <span className="mt-0.5">⚠️</span>
                        <span>ارتفاع في معدل الغياب - يُنصح بالمتابعة</span>
                      </li>
                    )}
                    {data.currentStats.late > data.lastStats.late && (
                      <li className="flex items-start gap-2 text-amber-700">
                        <span className="mt-0.5">⚠️</span>
                        <span>زيادة في حالات التأخير - مراجعة الأسباب</span>
                      </li>
                    )}
                    {data.currentStats.present > data.lastStats.present && (
                      <li className="flex items-start gap-2 text-green-700">
                        <span className="mt-0.5">✅</span>
                        <span>تحسن ملحوظ في معدل الحضور</span>
                      </li>
                    )}
                    {data.currentStats.absent <= data.lastStats.absent &&
                      data.currentStats.late <= data.lastStats.late && (
                        <li className="flex items-start gap-2 text-green-700">
                          <span className="mt-0.5">✅</span>
                          <span>أداء مستقر - استمر على هذا النهج</span>
                        </li>
                      )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
