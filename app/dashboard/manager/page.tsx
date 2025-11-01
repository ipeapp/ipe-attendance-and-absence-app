import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DepartmentStatsCard } from "@/components/department-stats-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Building2,
  Users,
  TrendingUp,
  Plus,
  FileText,
  Settings,
  Calendar,
  BarChart3,
  ClipboardCheck,
} from "lucide-react"
import Link from "next/link"

async function getManagerDashboardData() {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0]

  // جلب جميع الأقسام
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, description")
    .order("name")

  if (!departments) return null

  // جلب إحصائيات كل قسم
  const departmentsWithStats = await Promise.all(
    departments.map(async (dept) => {
      // عدد الموظفين
      const { count: employeeCount } = await supabase
        .from("employees")
        .select("*", { count: "exact" })
        .eq("department_id", dept.id)
        .eq("is_active", true)

      // موظفي القسم
      const { data: deptEmployees } = await supabase
        .from("employees")
        .select("id, role, full_name")
        .eq("department_id", dept.id)
        .eq("is_active", true)

      const employeeIds = deptEmployees?.map((e) => e.id) || []

      // إحصائيات الحضور اليوم
      const { data: todayAttendance } = await supabase
        .from("attendance_records")
        .select("status")
        .in("employee_id", employeeIds)
        .eq("date", today)

      const presentToday = todayAttendance?.filter((a) => a.status === "present").length || 0
      const lateToday = todayAttendance?.filter((a) => a.status === "late").length || 0
      const absentToday = (employeeCount || 0) - (todayAttendance?.length || 0)

      // نسبة الانضباط (حضور + تأخير / إجمالي الأيام العملية هذا الشهر)
      const { data: monthlyAttendance } = await supabase
        .from("attendance_records")
        .select("status")
        .in("employee_id", employeeIds)
        .gte("date", startOfMonth)
        .lte("date", today)

      const totalPossibleAttendance = (employeeCount || 0) * getWorkingDays(startOfMonth, today)
      const presentDays =
        monthlyAttendance?.filter((a) => a.status === "present" || a.status === "late").length || 0
      const attendanceRate =
        totalPossibleAttendance > 0 ? (presentDays / totalPossibleAttendance) * 100 : 0

      // نسبة الأداء (متوسط التقييمات للموظفين في آخر 3 أشهر)
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const { data: evaluations } = await supabase
        .from("evaluations")
        .select("overall_score")
        .in("employee_id", employeeIds)
        .gte("evaluation_date", threeMonthsAgo.toISOString().split("T")[0])
        .eq("status", "approved")

      const avgScore =
        evaluations && evaluations.length > 0
          ? evaluations.reduce((sum, e) => sum + (e.overall_score || 0), 0) / evaluations.length
          : 0

      // المشرف
      const supervisor = deptEmployees?.find((e) => e.role === "supervisor")

      return {
        id: dept.id,
        name: dept.name,
        description: dept.description,
        employeeCount: employeeCount || 0,
        attendanceRate,
        performanceRate: avgScore,
        presentToday,
        absentToday,
        lateToday,
        supervisorName: supervisor?.full_name,
      }
    })
  )

  // إحصائيات عامة
  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact" })
    .eq("is_active", true)

  const { data: allTodayAttendance } = await supabase
    .from("attendance_records")
    .select("status")
    .eq("date", today)

  const totalPresent =
    allTodayAttendance?.filter((a) => a.status === "present" || a.status === "late").length || 0

  return {
    departments: departmentsWithStats,
    totalEmployees: totalEmployees || 0,
    totalPresent,
    totalDepartments: departments.length,
  }
}

function getWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let count = 0

  while (start <= end) {
    const dayOfWeek = start.getDay()
    // نفترض أن أيام الجمعة والسبت هي عطلة (يمكن تخصيصها)
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      count++
    }
    start.setDate(start.getDate() + 1)
  }

  return count
}

export default async function ManagerDashboardPage() {
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

  if (!employee || employee.role !== "manager") {
    redirect("/dashboard")
  }

  const data = await getManagerDashboardData()

  if (!data) {
    return <div>خطأ في تحميل البيانات</div>
  }

  const today = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="flex flex-col gap-8">
        {/* رأس الصفحة */}
        <section className="surface-card overflow-hidden border border-transparent bg-gradient-to-br from-[var(--brand-600)]/10 via-white to-white p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-600)]">
                لوحة التحكم الإدارية
              </span>
              <h1 className="mt-3 text-3xl font-bold text-gradient-brand sm:text-4xl">
                مرحباً، {employee.full_name}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--neutral-500)]">
                <Calendar className="h-4 w-4 text-[var(--brand-600)]" />
                {today}
              </p>
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">إجمالي الأقسام</p>
                  <p className="mt-2 text-3xl font-bold">{data.totalDepartments}</p>
                </div>
                <Building2 className="h-12 w-12 opacity-80" />
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">إجمالي الموظفين</p>
                  <p className="mt-2 text-3xl font-bold">{data.totalEmployees}</p>
                </div>
                <Users className="h-12 w-12 opacity-80" />
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">الحاضرون اليوم</p>
                  <p className="mt-2 text-3xl font-bold">{data.totalPresent}</p>
                </div>
                <ClipboardCheck className="h-12 w-12 opacity-80" />
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">نسبة الحضور</p>
                  <p className="mt-2 text-3xl font-bold">
                    {data.totalEmployees > 0
                      ? Math.round((data.totalPresent / data.totalEmployees) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 opacity-80" />
              </div>
            </div>
          </div>
        </section>

        {/* أزرار الإجراءات السريعة */}
        <section className="surface-card border-none p-6">
          <h2 className="mb-6 text-xl font-semibold text-[var(--foreground)]">إجراءات سريعة</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/departments">
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-3 bg-white p-6 hover:border-violet-400 hover:bg-violet-50"
              >
                <Building2 className="h-8 w-8 text-violet-600" />
                <div className="text-center">
                  <p className="font-semibold text-[var(--foreground)]">إدارة الأقسام</p>
                  <p className="text-xs text-[var(--neutral-500)]">إضافة وتعديل الأقسام</p>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/employees">
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-3 bg-white p-6 hover:border-blue-400 hover:bg-blue-50"
              >
                <Users className="h-8 w-8 text-blue-600" />
                <div className="text-center">
                  <p className="font-semibold text-[var(--foreground)]">إدارة الموظفين</p>
                  <p className="text-xs text-[var(--neutral-500)]">إضافة وتعديل الموظفين</p>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/reports">
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-3 bg-white p-6 hover:border-green-400 hover:bg-green-50"
              >
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="text-center">
                  <p className="font-semibold text-[var(--foreground)]">التقارير</p>
                  <p className="text-xs text-[var(--neutral-500)]">تقارير مفصلة وإحصائيات</p>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/settings">
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-3 bg-white p-6 hover:border-amber-400 hover:bg-amber-50"
              >
                <Settings className="h-8 w-8 text-amber-600" />
                <div className="text-center">
                  <p className="font-semibold text-[var(--foreground)]">الإعدادات</p>
                  <p className="text-xs text-[var(--neutral-500)]">إعدادات النظام</p>
                </div>
              </Button>
            </Link>
          </div>
        </section>

        {/* بطاقات الأقسام */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">الأقسام</h2>
              <p className="text-sm text-[var(--neutral-500)]">
                اضغط على أي قسم لعرض التفاصيل والموظفين
              </p>
            </div>
            <Link href="/dashboard/departments/new">
              <Button className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)]">
                <Plus className="ml-2 h-4 w-4" />
                إضافة قسم جديد
              </Button>
            </Link>
          </div>

          {data.departments.length === 0 ? (
            <Card className="border-violet-100">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
                <p className="mb-2 text-lg font-medium text-muted-foreground">لا توجد أقسام بعد</p>
                <p className="mb-4 text-sm text-muted-foreground">ابدأ بإضافة قسم جديد</p>
                <Link href="/dashboard/departments/new">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة قسم
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.departments.map((dept) => (
                <DepartmentStatsCard key={dept.id} dept={dept} />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
