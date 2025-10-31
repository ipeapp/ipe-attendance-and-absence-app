import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import {
  Users,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowUpRight,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

async function getDashboardStats(employeeId: string, role: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]

  // Get today's attendance
  const { data: todayAttendance } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("date", today)
    .eq("employee_id", employeeId)
    .single()

  // Get monthly stats
  const { data: monthlyAttendance, count: totalDays } = await supabase
    .from("attendance_records")
    .select("*", { count: "exact" })
    .eq("employee_id", employeeId)
    .gte("date", startOfMonth)
    .lte("date", today)

  const presentDays = monthlyAttendance?.filter((r) => r.status === "present" || r.status === "late").length || 0
  const absentDays = monthlyAttendance?.filter((r) => r.status === "absent").length || 0
  const lateDays = monthlyAttendance?.filter((r) => r.status === "late").length || 0

  // Manager/Supervisor stats
  let teamStats = null
  if (role === "manager" || role === "supervisor") {
    const { count: totalEmployees } = await supabase
      .from("employees")
      .select("*", { count: "exact" })
      .eq("is_active", true)

    const { count: presentToday } = await supabase
      .from("attendance_records")
      .select("*", { count: "exact" })
      .eq("date", today)
      .in("status", ["present", "late"])

    teamStats = {
      totalEmployees: totalEmployees || 0,
      presentToday: presentToday || 0,
    }
  }

  return {
    todayAttendance,
    monthlyStats: {
      totalDays: totalDays || 0,
      presentDays,
      absentDays,
      lateDays,
    },
    teamStats,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get employee info
  const { data: employee } = await supabase
    .from("employees")
    .select("*, department:departments(*)")
    .eq("user_id", user.id)
    .single()

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">خطأ في الوصول</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              لم يتم العثور على بيانات الموظف. يرجى التواصل مع الإدارة.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = await getDashboardStats(employee.id, employee.role)
  const today = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="flex flex-col gap-8">
        {/* Hero */}
        <section className="surface-card overflow-hidden border border-transparent bg-gradient-to-br from-[var(--brand-600)]/10 via-white to-white p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-600)]">منصة الحضور</span>
              <h1 className="mt-3 text-3xl font-bold text-gradient-brand sm:text-4xl">
                مرحباً، {employee.full_name}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--neutral-500)]">
                <Calendar className="h-4 w-4 text-[var(--brand-600)]" />
                {today}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="stat-chip">
                <Sparkles className="h-4 w-4 text-[var(--brand-600)]" />
                <span>نسبة حضور هذا الشهر</span>
                <ArrowUpRight className="h-4 w-4 text-[var(--brand-600)]" />
                <span className="font-semibold text-[var(--foreground)]">
                  {stats.monthlyStats.totalDays > 0
                    ? Math.round((stats.monthlyStats.presentDays / stats.monthlyStats.totalDays) * 100)
                    : 0}
                  %
                </span>
              </div>
              {stats.teamStats ? (
                <div className="stat-chip">
                  <Users className="h-4 w-4 text-[var(--semantic-info)]" />
                  <span>الفريق الحاضر اليوم</span>
                  <span className="font-semibold text-[var(--foreground)]">{stats.teamStats.presentToday}</span>
                </div>
              ) : (
                <div className="stat-chip">
                  <ClipboardCheck className="h-4 w-4 text-[var(--semantic-success)]" />
                  <span>سجلك لليوم</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {stats.monthlyStats.presentDays} / {stats.monthlyStats.totalDays}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {stats.todayAttendance ? (
              <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-[var(--shadow-xs)]">
                <h2 className="text-sm font-semibold text-[var(--neutral-500)]">حالة الحضور اليوم</h2>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "stat-chip bg-white/90 px-5 py-2 text-sm",
                      stats.todayAttendance.status === "present" && "text-[var(--semantic-success)]",
                      stats.todayAttendance.status === "late" && "text-[var(--semantic-warning)]",
                      stats.todayAttendance.status === "absent" && "text-[var(--semantic-critical)]",
                    )}
                  >
                    {stats.todayAttendance.status === "present" && "حاضر"}
                    {stats.todayAttendance.status === "late" && "متأخر"}
                    {stats.todayAttendance.status === "absent" && "غائب"}
                  </span>
                  {stats.todayAttendance.late_minutes > 0 && (
                    <span className="stat-chip bg-white/90 px-5 py-2 text-sm text-[var(--semantic-warning)]">
                      تأخير {stats.todayAttendance.late_minutes} دقيقة
                    </span>
                  )}
                </div>
                <dl className="mt-6 grid gap-3 text-sm text-[var(--neutral-500)] sm:grid-cols-2">
                  {stats.todayAttendance.check_in_time && (
                    <div className="rounded-2xl bg-white/60 p-3">
                      <dt className="text-xs uppercase tracking-wide">وقت الحضور</dt>
                      <dd className="mt-1 font-medium text-[var(--foreground)]">
                        {new Date(stats.todayAttendance.check_in_time).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </dd>
                    </div>
                  )}
                  {stats.todayAttendance.check_out_time && (
                    <div className="rounded-2xl bg-white/60 p-3">
                      <dt className="text-xs uppercase tracking-wide">وقت الانصراف</dt>
                      <dd className="mt-1 font-medium text-[var(--foreground)]">
                        {new Date(stats.todayAttendance.check_out_time).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            ) : (
              <EmptyState
                icon={AlertCircle}
                title="لم يتم تسجيل الحضور"
                description="ابدأ يومك بتسجيل الحضور أو الانصراف من صفحة الحضور"
                action={
                  <Link
                    href="/dashboard/attendance"
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] transition hover:opacity-90"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    إلى صفحة الحضور
                  </Link>
                }
              />
            )}

            <div className="rounded-3xl border border-white/30 bg-white/70 p-6 shadow-[var(--shadow-xs)]">
              <h2 className="text-sm font-semibold text-[var(--neutral-500)]">نظرة سريعة على الشهر</h2>
              <div className="mt-4 flex flex-wrap gap-4">
                <div>
                  <p className="text-xs text-[var(--neutral-500)]">أيام الحضور</p>
                  <p className="text-2xl font-bold text-[var(--semantic-success)]">{stats.monthlyStats.presentDays}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--neutral-500)]">أيام الغياب</p>
                  <p className="text-2xl font-bold text-[var(--semantic-critical)]">{stats.monthlyStats.absentDays}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--neutral-500)]">أيام التأخير</p>
                  <p className="text-2xl font-bold text-[var(--semantic-warning)]">{stats.monthlyStats.lateDays}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Monthly Stats */}
        <section>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="surface-card border-none p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className="text-sm font-semibold text-[var(--neutral-500)]">أيام الحضور</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-[var(--semantic-success)]" />
              </CardHeader>
              <CardContent className="mt-5 space-y-2 p-0">
                <p className="text-3xl font-semibold text-[var(--semantic-success)]">{stats.monthlyStats.presentDays}</p>
                <p className="text-xs text-[var(--neutral-500)]">من {stats.monthlyStats.totalDays} يوم</p>
              </CardContent>
            </Card>

            <Card className="surface-card border-none p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className="text-sm font-semibold text-[var(--neutral-500)]">أيام الغياب</CardTitle>
                <AlertCircle className="h-5 w-5 text-[var(--semantic-critical)]" />
              </CardHeader>
              <CardContent className="mt-5 space-y-2 p-0">
                <p className="text-3xl font-semibold text-[var(--semantic-critical)]">{stats.monthlyStats.absentDays}</p>
                <p className="text-xs text-[var(--neutral-500)]">تحتاج متابعة</p>
              </CardContent>
            </Card>

            <Card className="surface-card border-none p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className="text-sm font-semibold text-[var(--neutral-500)]">أيام التأخير</CardTitle>
                <Clock className="h-5 w-5 text-[var(--semantic-warning)]" />
              </CardHeader>
              <CardContent className="mt-5 space-y-2 p-0">
                <p className="text-3xl font-semibold text-[var(--semantic-warning)]">{stats.monthlyStats.lateDays}</p>
                <p className="text-xs text-[var(--neutral-500)]">متوسط التأخير لكل يوم عمل</p>
              </CardContent>
            </Card>

            <Card className="surface-card border-none p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                <CardTitle className="text-sm font-semibold text-[var(--neutral-500)]">نسبة الحضور</CardTitle>
                <TrendingUp className="h-5 w-5 text-[var(--brand-600)]" />
              </CardHeader>
              <CardContent className="mt-5 space-y-2 p-0">
                <p className="text-3xl font-semibold text-[var(--brand-600)]">
                  {stats.monthlyStats.totalDays > 0
                    ? Math.round((stats.monthlyStats.presentDays / stats.monthlyStats.totalDays) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-[var(--neutral-500)]">ِنسبة التزام الحضور خلال الشهر</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Team Stats for Managers/Supervisors */}
        {stats.teamStats && (
          <section className="surface-card border-none p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-[var(--foreground)]">
                  <Users className="h-5 w-5 text-[var(--brand-600)]" />
                  فريق العمل اليوم
                </h2>
                <p className="mt-1 text-sm text-[var(--neutral-500)]">متابعة الحضور اللحظية للفريق تحت إشرافك</p>
              </div>
              <div className="flex gap-4">
                <div className="rounded-2xl bg-[var(--surface-muted)] px-5 py-3 text-center">
                  <p className="text-xs text-[var(--neutral-500)]">إجمالي الموظفين</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">{stats.teamStats.totalEmployees}</p>
                </div>
                <div className="rounded-2xl bg-[var(--surface-muted)] px-5 py-3 text-center">
                  <p className="text-xs text-[var(--neutral-500)]">الحاضرون اليوم</p>
                  <p className="text-2xl font-bold text-[var(--semantic-success)]">{stats.teamStats.presentToday}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="surface-card border-none p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">إجراءات سريعة</h2>
              <p className="text-sm text-[var(--neutral-500)]">وصول مباشر للمهام اليومية المتكررة</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/dashboard/attendance"
              className="group flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/70 p-4 shadow-[var(--shadow-xs)] transition hover:border-[var(--brand-600)]/30 hover:shadow-[var(--shadow-sm)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-600)]/10 text-[var(--brand-600)]">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-[var(--foreground)]">تسجيل الحضور</p>
                <p className="text-xs text-[var(--neutral-500)]">تسجيل الحضور أو الانصراف للفترة الحالية</p>
              </div>
            </Link>

            {(employee.role === "manager" || employee.role === "supervisor") && (
              <>
                <Link
                  href="/dashboard/employees"
                  className="group flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/70 p-4 shadow-[var(--shadow-xs)] transition hover:border-[var(--brand-600)]/30 hover:shadow-[var(--shadow-sm)]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-600)]/10 text-[var(--brand-600)]">
                    <Users className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">إدارة الموظفين</p>
                    <p className="text-xs text-[var(--neutral-500)]">إضافة أو متابعة سجلات فريقك</p>
                  </div>
                </Link>

                <Link
                  href="/dashboard/reports"
                  className="group flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/70 p-4 shadow-[var(--shadow-xs)] transition hover:border-[var(--brand-600)]/30 hover:shadow-[var(--shadow-sm)]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-600)]/10 text-[var(--brand-600)]">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">التقارير الذكية</p>
                    <p className="text-xs text-[var(--neutral-500)]">اكتشف مؤشرات الأداء للحضور والتقييمات</p>
                  </div>
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
