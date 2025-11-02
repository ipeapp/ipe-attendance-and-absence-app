import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SupervisorAttendanceManager } from "@/components/supervisor-attendance-manager"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Star,
  Plus,
  BarChart3,
  ClipboardCheck,
} from "lucide-react"
import Link from "next/link"

async function getSupervisorData(supervisorId: string, departmentId: string | null) {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  // جلب موظفي القسم
  let employeesQuery = supabase
    .from("employees")
    .select("id, full_name, employee_number, position, department:departments(id, name), role")
    .eq("is_active", true)
    .neq("id", supervisorId) // استبعاد المشرف نفسه

  if (departmentId) {
    employeesQuery = employeesQuery.eq("department_id", departmentId)
  }

  const { data: employees } = await employeesQuery.order("full_name")

  // جلب سجلات حضور اليوم
  const employeeIds = employees?.map((e) => e.id) || []
  
  const { data: todayAttendance } = await supabase
    .from("attendance_records")
    .select("*")
    .in("employee_id", employeeIds)
    .eq("date", today)

  // جلب الفترات
  const { data: shifts } = await supabase
    .from("work_shifts")
    .select("*")
    .eq("is_active", true)
    .order("start_time")

  // الموظفون الذين يحتاجون تقييم
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const { data: recentEvaluations } = await supabase
    .from("evaluations")
    .select("employee_id, evaluation_date")
    .in("employee_id", employeeIds)
    .gte("evaluation_date", threeMonthsAgo.toISOString().split("T")[0])

  const evaluatedEmployeeIds = new Set(recentEvaluations?.map((e) => e.employee_id) || [])
  const employeesNeedingEvaluation = employees?.filter((e) => !evaluatedEmployeeIds.has(e.id)) || []

  return {
    employees: employees || [],
    todayAttendance: todayAttendance || [],
    shifts: shifts || [],
    employeesNeedingEvaluation,
  }
}

export default async function SupervisorDashboardPage() {
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

  if (!employee || employee.role !== "supervisor") {
    redirect("/dashboard")
  }

  const data = await getSupervisorData(employee.id, employee.department_id)

  const today = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // إحصائيات سريعة
  const totalEmployees = data.employees.length
  const presentToday = data.todayAttendance.filter((a) => a.check_in_time && !a.check_out_time).length
  const absentToday = totalEmployees - data.todayAttendance.length
  const lateToday = data.todayAttendance.filter((a) => a.status === "late").length
  const completedToday = data.todayAttendance.filter((a) => a.check_out_time).length

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="flex flex-col gap-8">
        {/* رأس الصفحة */}
        <section className="surface-card overflow-hidden border border-transparent bg-gradient-to-br from-[var(--brand-600)]/10 via-white to-white p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-600)]">
                لوحة المشرف
              </span>
              <h1 className="mt-3 text-3xl font-bold text-gradient-brand sm:text-4xl">
                مرحباً، {employee.full_name}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--neutral-500)]">
                <Calendar className="h-4 w-4 text-[var(--brand-600)]" />
                {today}
              </p>
              {employee.department && (
                <p className="mt-1 text-sm text-[var(--neutral-500)]">
                  مشرف قسم: {employee.department.name}
                </p>
              )}
            </div>
          </div>

          {/* إحصائيات سريعة */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">إجمالي الموظفين</p>
                  <p className="mt-2 text-3xl font-bold">{totalEmployees}</p>
                </div>
                <Users className="h-10 w-10 opacity-80" />
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">حاضر</p>
                  <p className="mt-2 text-3xl font-bold">{presentToday}</p>
                </div>
                <CheckCircle2 className="h-10 w-10 opacity-80" />
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">غائب</p>
                  <p className="mt-2 text-3xl font-bold">{absentToday}</p>
                </div>
                <AlertCircle className="h-10 w-10 opacity-80" />
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">متأخر</p>
                  <p className="mt-2 text-3xl font-bold">{lateToday}</p>
                </div>
                <Clock className="h-10 w-10 opacity-80" />
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">مكتمل</p>
                  <p className="mt-2 text-3xl font-bold">{completedToday}</p>
                </div>
                <ClipboardCheck className="h-10 w-10 opacity-80" />
              </div>
            </div>
          </div>
        </section>

        {/* تنبيهات */}
        {data.employeesNeedingEvaluation.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900">
                    {data.employeesNeedingEvaluation.length} موظف يحتاج تقييم
                  </p>
                  <p className="text-sm text-amber-700">لم يتم تقييمهم خلال الثلاثة أشهر الماضية</p>
                </div>
              </div>
              <Link href="/dashboard/evaluations">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <Star className="ml-2 h-4 w-4" />
                  إدارة التقييمات
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* أزرار الإجراءات السريعة */}
        <section className="surface-card border-none p-6">
          <h2 className="mb-6 text-xl font-semibold text-[var(--foreground)]">إجراءات سريعة</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/attendance">
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-3 bg-white p-6 hover:border-green-400 hover:bg-green-50"
              >
                <ClipboardCheck className="h-8 w-8 text-green-600" />
                <div className="text-center">
                  <p className="font-semibold text-[var(--foreground)]">تسجيل الحضور</p>
                  <p className="text-xs text-[var(--neutral-500)]">تسجيل حضوري وانصرافي</p>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/evaluations/new">
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-3 bg-white p-6 hover:border-blue-400 hover:bg-blue-50"
              >
                <Star className="h-8 w-8 text-blue-600" />
                <div className="text-center">
                  <p className="font-semibold text-[var(--foreground)]">تقييم موظف</p>
                  <p className="text-xs text-[var(--neutral-500)]">إضافة تقييم جديد</p>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/reports">
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-3 bg-white p-6 hover:border-violet-400 hover:bg-violet-50"
              >
                <BarChart3 className="h-8 w-8 text-violet-600" />
                <div className="text-center">
                  <p className="font-semibold text-[var(--foreground)]">التقارير</p>
                  <p className="text-xs text-[var(--neutral-500)]">عرض التقارير والإحصائيات</p>
                </div>
              </Button>
            </Link>

            <Link href="/dashboard/employees">
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-3 bg-white p-6 hover:border-amber-400 hover:bg-amber-50"
              >
                <Users className="h-8 w-8 text-amber-600" />
                <div className="text-center">
                  <p className="font-semibold text-[var(--foreground)]">الموظفون</p>
                  <p className="text-xs text-[var(--neutral-500)]">عرض قائمة الموظفين</p>
                </div>
              </Button>
            </Link>
          </div>
        </section>

        {/* التبويبات الرئيسية */}
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">
              <ClipboardCheck className="ml-2 h-4 w-4" />
              إدارة الحضور والانصراف
            </TabsTrigger>
            <TabsTrigger value="evaluations">
              <Star className="ml-2 h-4 w-4" />
              التقييمات السريعة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <SupervisorAttendanceManager
              employees={data.employees}
              todayAttendance={data.todayAttendance}
              shifts={data.shifts}
              supervisorId={employee.id}
            />
          </TabsContent>

          <TabsContent value="evaluations" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">الموظفون الذين يحتاجون تقييم</h3>
                <p className="text-sm text-[var(--neutral-500)]">
                  لم يتم تقييمهم خلال الثلاثة أشهر الماضية
                </p>
              </div>
              <Link href="/dashboard/evaluations">
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <BarChart3 className="ml-2 h-4 w-4" />
                  جميع التقييمات
                </Button>
              </Link>
            </div>

            {data.employeesNeedingEvaluation.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="mb-4 h-16 w-16 text-green-600" />
                  <p className="text-lg font-medium text-green-600">ممتاز!</p>
                  <p className="text-muted-foreground">جميع الموظفين لديهم تقييمات حديثة</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.employeesNeedingEvaluation.map((emp) => (
                  <Card key={emp.id} className="border-amber-100 hover:border-amber-300 hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <h3 className="font-bold text-lg text-[var(--foreground)]">{emp.full_name}</h3>
                        <p className="text-sm text-[var(--neutral-500)]">{emp.employee_number}</p>
                        {emp.position && (
                          <p className="text-xs text-[var(--neutral-500)] mt-1">{emp.position}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-4 text-xs text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>يحتاج تقييم</span>
                      </div>

                      <Link href={`/dashboard/evaluations/new?employee_id=${emp.id}`} className="w-full">
                        <Button className="w-full bg-amber-600 hover:bg-amber-700">
                          <Star className="ml-2 h-4 w-4" />
                          تقييم الآن
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
