import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">مرحباً، {employee.full_name}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {today}
          </p>
        </div>

        {/* Today's Status */}
        <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-violet-600" />
              حالة الحضور اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.todayAttendance ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">الحالة:</span>
                  <span
                    className={cn(
                      "font-medium px-3 py-1 rounded-full text-sm",
                      stats.todayAttendance.status === "present" && "bg-green-100 text-green-700",
                      stats.todayAttendance.status === "late" && "bg-amber-100 text-amber-700",
                      stats.todayAttendance.status === "absent" && "bg-red-100 text-red-700",
                    )}
                  >
                    {stats.todayAttendance.status === "present" && "حاضر"}
                    {stats.todayAttendance.status === "late" && "متأخر"}
                    {stats.todayAttendance.status === "absent" && "غائب"}
                  </span>
                </div>
                {stats.todayAttendance.check_in_time && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">وقت الحضور:</span>
                    <span className="font-medium">
                      {new Date(stats.todayAttendance.check_in_time).toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {stats.todayAttendance.late_minutes > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">مدة التأخير:</span>
                    <span className="font-medium text-amber-600">{stats.todayAttendance.late_minutes} دقيقة</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">لم يتم تسجيل الحضور بعد</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-violet-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">أيام الحضور</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.monthlyStats.presentDays}</div>
              <p className="text-xs text-muted-foreground mt-1">من {stats.monthlyStats.totalDays} يوم</p>
            </CardContent>
          </Card>

          <Card className="border-violet-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">أيام الغياب</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.monthlyStats.absentDays}</div>
              <p className="text-xs text-muted-foreground mt-1">هذا الشهر</p>
            </CardContent>
          </Card>

          <Card className="border-violet-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">أيام التأخير</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.monthlyStats.lateDays}</div>
              <p className="text-xs text-muted-foreground mt-1">هذا الشهر</p>
            </CardContent>
          </Card>

          <Card className="border-violet-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">نسبة الحضور</CardTitle>
              <TrendingUp className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-600">
                {stats.monthlyStats.totalDays > 0
                  ? Math.round((stats.monthlyStats.presentDays / stats.monthlyStats.totalDays) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">هذا الشهر</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Stats for Managers/Supervisors */}
        {stats.teamStats && (
          <Card className="border-violet-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-600" />
                إحصائيات الفريق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
                  <p className="text-3xl font-bold text-violet-600">{stats.teamStats.totalEmployees}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">الحاضرون اليوم</p>
                  <p className="text-3xl font-bold text-green-600">{stats.teamStats.presentToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="border-violet-100">
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/dashboard/attendance"
                className="flex items-center gap-3 p-4 rounded-lg border border-violet-100 hover:bg-violet-50 transition-colors"
              >
                <ClipboardCheck className="h-8 w-8 text-violet-600" />
                <div>
                  <p className="font-medium">تسجيل الحضور</p>
                  <p className="text-xs text-muted-foreground">سجل حضورك أو انصرافك</p>
                </div>
              </Link>

              {(employee.role === "manager" || employee.role === "supervisor") && (
                <>
                  <Link
                    href="/dashboard/employees"
                    className="flex items-center gap-3 p-4 rounded-lg border border-violet-100 hover:bg-violet-50 transition-colors"
                  >
                    <Users className="h-8 w-8 text-violet-600" />
                    <div>
                      <p className="font-medium">إدارة الموظفين</p>
                      <p className="text-xs text-muted-foreground">عرض وإدارة الموظفين</p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/reports"
                    className="flex items-center gap-3 p-4 rounded-lg border border-violet-100 hover:bg-violet-50 transition-colors"
                  >
                    <FileText className="h-8 w-8 text-violet-600" />
                    <div>
                      <p className="font-medium">التقارير</p>
                      <p className="text-xs text-muted-foreground">عرض التقارير والإحصائيات</p>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
