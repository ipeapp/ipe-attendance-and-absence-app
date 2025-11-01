import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Users,
  ArrowLeft,
  Edit,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Star,
  Mail,
  Phone,
  Calendar,
  Award,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getDepartmentDetails(deptId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0]

  // معلومات القسم
  const { data: department, error: deptError } = await supabase
    .from("departments")
    .select("*")
    .eq("id", deptId)
    .single()

  if (deptError || !department) return null

  // موظفو القسم
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("department_id", deptId)
    .eq("is_active", true)
    .order("role", { ascending: true }) // المشرف أولاً
    .order("full_name")

  if (!employees) return { department, employees: [] }

  // جلب إحصائيات كل موظف
  const employeesWithStats = await Promise.all(
    employees.map(async (emp) => {
      // حضور اليوم
      const { data: todayAttendance } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("employee_id", emp.id)
        .eq("date", today)
        .single()

      // إحصائيات الشهر
      const { data: monthlyAttendance } = await supabase
        .from("attendance_records")
        .select("status")
        .eq("employee_id", emp.id)
        .gte("date", startOfMonth)
        .lte("date", today)

      const presentDays =
        monthlyAttendance?.filter((a) => a.status === "present" || a.status === "late").length || 0
      const absentDays = monthlyAttendance?.filter((a) => a.status === "absent").length || 0
      const lateDays = monthlyAttendance?.filter((a) => a.status === "late").length || 0
      const totalDays = monthlyAttendance?.length || 0

      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

      // آخر تقييم
      const { data: lastEvaluation } = await supabase
        .from("evaluations")
        .select("overall_score, evaluation_date")
        .eq("employee_id", emp.id)
        .eq("status", "approved")
        .order("evaluation_date", { ascending: false })
        .limit(1)
        .single()

      // متوسط التقييمات
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const { data: recentEvaluations } = await supabase
        .from("evaluations")
        .select("overall_score")
        .eq("employee_id", emp.id)
        .gte("evaluation_date", threeMonthsAgo.toISOString().split("T")[0])
        .eq("status", "approved")

      const avgScore =
        recentEvaluations && recentEvaluations.length > 0
          ? recentEvaluations.reduce((sum, e) => sum + (e.overall_score || 0), 0) /
            recentEvaluations.length
          : 0

      return {
        ...emp,
        todayStatus: todayAttendance?.status || "absent",
        checkInTime: todayAttendance?.check_in_time,
        checkOutTime: todayAttendance?.check_out_time,
        lateMinutes: todayAttendance?.late_minutes || 0,
        monthlyStats: {
          presentDays,
          absentDays,
          lateDays,
          totalDays,
          attendanceRate,
        },
        lastEvaluationScore: lastEvaluation?.overall_score || null,
        lastEvaluationDate: lastEvaluation?.evaluation_date || null,
        avgEvaluationScore: avgScore,
      }
    })
  )

  return {
    department,
    employees: employeesWithStats,
  }
}

export default async function DepartmentDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: currentEmployee } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!currentEmployee || currentEmployee.role !== "manager") {
    redirect("/dashboard")
  }

  const data = await getDepartmentDetails(id)

  if (!data) {
    notFound()
  }

  const { department, employees } = data

  // فصل المشرف عن الموظفين
  const supervisor = employees.find((e) => e.role === "supervisor")
  const regularEmployees = employees.filter((e) => e.role !== "supervisor")

  // حساب إحصائيات القسم
  const totalEmployees = employees.length
  const presentToday = employees.filter((e) => e.todayStatus === "present" || e.todayStatus === "late")
    .length
  const absentToday = employees.filter((e) => e.todayStatus === "absent").length
  const lateToday = employees.filter((e) => e.todayStatus === "late").length

  const avgAttendanceRate =
    totalEmployees > 0
      ? employees.reduce((sum, e) => sum + e.monthlyStats.attendanceRate, 0) / totalEmployees
      : 0

  const employeesWithEval = employees.filter((e) => e.avgEvaluationScore > 0)
  const avgPerformance =
    employeesWithEval.length > 0
      ? employeesWithEval.reduce((sum, e) => sum + e.avgEvaluationScore, 0) / employeesWithEval.length
      : 0

  const getRoleName = (role: string) => {
    switch (role) {
      case "manager":
        return "مدير"
      case "supervisor":
        return "مشرف"
      case "employee":
        return "موظف"
      default:
        return role
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return { text: "حاضر", color: "bg-green-100 text-green-700 border-green-200" }
      case "late":
        return { text: "متأخر", color: "bg-amber-100 text-amber-700 border-amber-200" }
      case "absent":
        return { text: "غائب", color: "bg-red-100 text-red-700 border-red-200" }
      default:
        return { text: "غير محدد", color: "bg-gray-100 text-gray-700 border-gray-200" }
    }
  }

  return (
    <DashboardLayout userRole={currentEmployee.role} userName={currentEmployee.full_name}>
      <div className="flex flex-col gap-8">
        {/* رأس الصفحة */}
        <div className="flex items-start justify-between">
          <div>
            <Link
              href="/dashboard/manager"
              className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--brand-600)] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة إلى لوحة التحكم
            </Link>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-[var(--foreground)]">
              <Building2 className="h-8 w-8 text-[var(--brand-600)]" />
              {department.name}
            </h1>
            {department.description && (
              <p className="mt-2 text-[var(--neutral-500)]">{department.description}</p>
            )}
          </div>
          <Link href={`/dashboard/departments/${id}/edit`}>
            <Button variant="outline">
              <Edit className="ml-2 h-4 w-4" />
              تعديل القسم
            </Button>
          </Link>
        </div>

        {/* إحصائيات القسم */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--neutral-500)]">إجمالي الموظفين</p>
                  <p className="mt-2 text-3xl font-bold text-violet-600">{totalEmployees}</p>
                </div>
                <Users className="h-10 w-10 text-violet-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--neutral-500)]">الحاضرون اليوم</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">{presentToday}</p>
                  <p className="text-xs text-[var(--neutral-500)]">
                    {totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0}%
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--neutral-500)]">معدل الانضباط</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">
                    {avgAttendanceRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-[var(--neutral-500)]">هذا الشهر</p>
                </div>
                <TrendingUp className="h-10 w-10 text-amber-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--neutral-500)]">معدل الأداء</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600">
                    {avgPerformance.toFixed(0)}%
                  </p>
                  <p className="text-xs text-[var(--neutral-500)]">آخر 3 أشهر</p>
                </div>
                <Award className="h-10 w-10 text-blue-600 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* بطاقة المشرف */}
        {supervisor && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">مشرف القسم</h2>
            <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 md:flex-row">
                  <div className="flex-1">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-[var(--foreground)]">
                          {supervisor.full_name}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-violet-600">
                          {getRoleName(supervisor.role)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-sm font-medium",
                          getStatusBadge(supervisor.todayStatus).color
                        )}
                      >
                        {getStatusBadge(supervisor.todayStatus).text}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm text-[var(--neutral-500)]">
                        <Mail className="h-4 w-4" />
                        <span>{supervisor.email}</span>
                      </div>
                      {supervisor.phone && (
                        <div className="flex items-center gap-2 text-sm text-[var(--neutral-500)]">
                          <Phone className="h-4 w-4" />
                          <span>{supervisor.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-[var(--neutral-500)]">
                        <Calendar className="h-4 w-4" />
                        <span>منذ {new Date(supervisor.hire_date).toLocaleDateString("ar-SA")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 border-t pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                    <div className="text-center">
                      <p className="text-xs text-[var(--neutral-500)]">الحضور</p>
                      <p className="mt-1 text-2xl font-bold text-green-600">
                        {supervisor.monthlyStats.attendanceRate.toFixed(0)}%
                      </p>
                      <p className="text-xs text-[var(--neutral-500)]">
                        {supervisor.monthlyStats.presentDays}/{supervisor.monthlyStats.totalDays}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[var(--neutral-500)]">التقييم</p>
                      <p className="mt-1 text-2xl font-bold text-blue-600">
                        {supervisor.avgEvaluationScore > 0
                          ? supervisor.avgEvaluationScore.toFixed(0)
                          : "-"}
                      </p>
                      <p className="text-xs text-[var(--neutral-500)]">من 100</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Link href={`/dashboard/employees/${supervisor.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <BarChart3 className="ml-2 h-4 w-4" />
                      عرض التفاصيل الكاملة
                    </Button>
                  </Link>
                  <Link href={`/dashboard/evaluations/new?employee_id=${supervisor.id}`}>
                    <Button className="bg-violet-600 hover:bg-violet-700">
                      <Star className="ml-2 h-4 w-4" />
                      تقييم المشرف
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* قائمة الموظفين */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">
            موظفو القسم ({regularEmployees.length})
          </h2>

          {regularEmployees.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="mb-4 h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">لا يوجد موظفون في هذا القسم</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {regularEmployees.map((emp) => (
                <Link key={emp.id} href={`/dashboard/employees/${emp.id}`}>
                  <Card className="group cursor-pointer border-violet-100 transition-all hover:border-violet-300 hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-[var(--foreground)]">{emp.full_name}</h3>
                          <p className="text-xs text-[var(--neutral-500)]">{emp.employee_number}</p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium",
                            getStatusBadge(emp.todayStatus).color
                          )}
                        >
                          {getStatusBadge(emp.todayStatus).text}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[var(--neutral-500)]">الحضور هذا الشهر:</span>
                          <span
                            className={cn(
                              "font-semibold",
                              emp.monthlyStats.attendanceRate >= 90
                                ? "text-green-600"
                                : emp.monthlyStats.attendanceRate >= 75
                                ? "text-amber-600"
                                : "text-red-600"
                            )}
                          >
                            {emp.monthlyStats.attendanceRate.toFixed(0)}%
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--neutral-500)]">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            {emp.monthlyStats.presentDays}
                          </span>
                          <span className="flex items-center gap-1 text-amber-600">
                            <Clock className="h-3 w-3" />
                            {emp.monthlyStats.lateDays}
                          </span>
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            {emp.monthlyStats.absentDays}
                          </span>
                        </div>

                        {emp.avgEvaluationScore > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--neutral-500)]">التقييم:</span>
                            <span className="flex items-center gap-1 font-semibold text-blue-600">
                              <Star className="h-3 w-3 fill-blue-600" />
                              {emp.avgEvaluationScore.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 text-xs text-[var(--neutral-400)] group-hover:text-[var(--brand-600)]">
                        اضغط لعرض التفاصيل ←
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
