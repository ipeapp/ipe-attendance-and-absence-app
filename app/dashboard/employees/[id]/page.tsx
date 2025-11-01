import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceCalendar } from "@/components/attendance-calendar"
import {
  User,
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building2,
  Calendar,
  Badge,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Star,
  FileText,
  Trash2,
  Plus,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getEmployeeDetails(empId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0]

  // معلومات الموظف
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("*, department:departments(*)")
    .eq("id", empId)
    .single()

  if (empError || !employee) return null

  // سجلات الحضور
  const { data: attendanceRecords } = await supabase
    .from("attendance_records")
    .select("*, shift:work_shifts(*)")
    .eq("employee_id", empId)
    .order("date", { ascending: false })
    .limit(30)

  // إحصائيات الحضور الشهرية
  const { data: monthlyAttendance } = await supabase
    .from("attendance_records")
    .select("status, late_minutes")
    .eq("employee_id", empId)
    .gte("date", startOfMonth)
    .lte("date", today)

  const presentDays =
    monthlyAttendance?.filter((a) => a.status === "present" || a.status === "late").length || 0
  const absentDays = monthlyAttendance?.filter((a) => a.status === "absent").length || 0
  const lateDays = monthlyAttendance?.filter((a) => a.status === "late").length || 0
  const totalDays = monthlyAttendance?.length || 0
  const totalLateMinutes = monthlyAttendance?.reduce((sum, a) => sum + (a.late_minutes || 0), 0) || 0

  // التقييمات
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select(`
      *,
      evaluator:employees!evaluations_evaluator_id_fkey(full_name),
      details:evaluation_details(
        *,
        criteria:evaluation_criteria(name)
      )
    `)
    .eq("employee_id", empId)
    .order("evaluation_date", { ascending: false })

  // متوسط التقييمات
  const approvedEvaluations = evaluations?.filter((e) => e.status === "approved") || []
  const avgScore =
    approvedEvaluations.length > 0
      ? approvedEvaluations.reduce((sum, e) => sum + (e.overall_score || 0), 0) /
        approvedEvaluations.length
      : 0

  return {
    employee,
    attendanceRecords: attendanceRecords || [],
    monthlyStats: {
      presentDays,
      absentDays,
      lateDays,
      totalDays,
      attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
      totalLateMinutes,
      avgLateMinutes: lateDays > 0 ? totalLateMinutes / lateDays : 0,
    },
    evaluations: evaluations || [],
    avgEvaluationScore: avgScore,
  }
}

export default async function EmployeeDetailPage({ params }: PageProps) {
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

  if (!currentEmployee || (currentEmployee.role !== "manager" && currentEmployee.role !== "supervisor")) {
    redirect("/dashboard")
  }

  const data = await getEmployeeDetails(id)

  if (!data) {
    notFound()
  }

  const { employee, attendanceRecords, monthlyStats, evaluations, avgEvaluationScore } = data

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
      case "excused":
        return { text: "إجازة", color: "bg-blue-100 text-blue-700 border-blue-200" }
      default:
        return { text: status, color: "bg-gray-100 text-gray-700 border-gray-200" }
    }
  }

  const getEvaluationStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return { text: "معتمد", color: "bg-green-100 text-green-700" }
      case "submitted":
        return { text: "قيد المراجعة", color: "bg-blue-100 text-blue-700" }
      case "draft":
        return { text: "مسودة", color: "bg-gray-100 text-gray-700" }
      default:
        return { text: status, color: "bg-gray-100 text-gray-700" }
    }
  }

  return (
    <DashboardLayout userRole={currentEmployee.role} userName={currentEmployee.full_name}>
      <div className="flex flex-col gap-8">
        {/* رأس الصفحة */}
        <div className="flex items-start justify-between">
          <div>
            <Link
              href={employee.department ? `/dashboard/departments/${employee.department.id}` : "/dashboard/employees"}
              className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--brand-600)] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              {employee.department ? `العودة إلى ${employee.department.name}` : "العودة إلى قائمة الموظفين"}
            </Link>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-[var(--foreground)]">
              <User className="h-8 w-8 text-[var(--brand-600)]" />
              {employee.full_name}
            </h1>
            <p className="mt-2 text-[var(--neutral-500)]">{getRoleName(employee.role)}</p>
          </div>
          <div className="flex gap-2">
            {currentEmployee.role === "manager" && (
              <>
                <Link href={`/dashboard/employees/${id}/edit`}>
                  <Button variant="outline">
                    <Edit className="ml-2 h-4 w-4" />
                    تعديل
                  </Button>
                </Link>
                <Button variant="outline" className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف
                </Button>
              </>
            )}
          </div>
        </div>

        {/* معلومات الموظف الأساسية */}
        <Card className="border-violet-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-violet-600" />
              المعلومات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                  <Badge className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--neutral-500)]">رقم الموظف</p>
                  <p className="font-semibold text-[var(--foreground)]">{employee.employee_number}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--neutral-500)]">البريد الإلكتروني</p>
                  <p className="font-semibold text-[var(--foreground)]">{employee.email}</p>
                </div>
              </div>

              {employee.phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--neutral-500)]">رقم الهاتف</p>
                    <p className="font-semibold text-[var(--foreground)]">{employee.phone}</p>
                  </div>
                </div>
              )}

              {employee.department && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Building2 className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--neutral-500)]">القسم</p>
                    <p className="font-semibold text-[var(--foreground)]">{employee.department.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--neutral-500)]">تاريخ التعيين</p>
                  <p className="font-semibold text-[var(--foreground)]">
                    {new Date(employee.hire_date).toLocaleDateString("ar-SA")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الإحصائيات */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--neutral-500)]">أيام الحضور</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">{monthlyStats.presentDays}</p>
                  <p className="text-xs text-[var(--neutral-500)]">من {monthlyStats.totalDays} يوم</p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--neutral-500)]">نسبة الحضور</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">
                    {monthlyStats.attendanceRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-[var(--neutral-500)]">هذا الشهر</p>
                </div>
                <TrendingUp className="h-10 w-10 text-amber-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100 bg-gradient-to-br from-red-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--neutral-500)]">أيام التأخير</p>
                  <p className="mt-2 text-3xl font-bold text-red-600">{monthlyStats.lateDays}</p>
                  <p className="text-xs text-[var(--neutral-500)]">
                    متوسط {monthlyStats.avgLateMinutes.toFixed(0)} د
                  </p>
                </div>
                <Clock className="h-10 w-10 text-red-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--neutral-500)]">متوسط التقييم</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600">
                    {avgEvaluationScore > 0 ? avgEvaluationScore.toFixed(0) : "-"}
                  </p>
                  <p className="text-xs text-[var(--neutral-500)]">من 100</p>
                </div>
                <Star className="h-10 w-10 text-blue-600 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">
              <ClipboardCheck className="ml-2 h-4 w-4" />
              سجل الحضور والغياب
            </TabsTrigger>
            <TabsTrigger value="evaluations">
              <Star className="ml-2 h-4 w-4" />
              التقييمات
            </TabsTrigger>
          </TabsList>

          {/* سجل الحضور */}
          <TabsContent value="attendance" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">سجل الحضور</h3>
              <Link href={`/dashboard/attendance?employee_id=${id}`}>
                <Button variant="outline" size="sm">
                  <BarChart3 className="ml-2 h-4 w-4" />
                  عرض التقرير الكامل
                </Button>
              </Link>
            </div>

            {/* تقويم الحضور */}
            <AttendanceCalendar 
              records={attendanceRecords.map(record => ({
                date: record.date,
                status: record.status as any,
                check_in_time: record.check_in_time || undefined,
                check_out_time: record.check_out_time || undefined,
                late_minutes: record.late_minutes || undefined,
              }))} 
              employeeName={employee.full_name}
            />

            <h3 className="text-lg font-semibold pt-6">التفاصيل (آخر 30 يوم)</h3>

            {attendanceRecords.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">لا توجد سجلات حضور</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {attendanceRecords.map((record) => {
                  const status = getStatusBadge(record.status)
                  return (
                    <Card key={record.id} className="border-violet-100">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <p className="font-semibold text-[var(--foreground)]">
                                {new Date(record.date).toLocaleDateString("ar-SA", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                              <span
                                className={cn("rounded-full border px-3 py-1 text-xs font-medium", status.color)}
                              >
                                {status.text}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--neutral-500)]">
                              {record.check_in_time && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  حضور:{" "}
                                  {new Date(record.check_in_time).toLocaleTimeString("ar-SA", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                              {record.check_out_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  انصراف:{" "}
                                  {new Date(record.check_out_time).toLocaleTimeString("ar-SA", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                              {record.late_minutes > 0 && (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <AlertCircle className="h-4 w-4" />
                                  تأخير: {record.late_minutes} دقيقة
                                </span>
                              )}
                              {record.shift && (
                                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                                  {record.shift.name}
                                </span>
                              )}
                            </div>

                            {record.notes && (
                              <p className="mt-2 text-sm text-[var(--neutral-500)]">
                                <span className="font-medium">ملاحظات:</span> {record.notes}
                              </p>
                            )}
                          </div>

                          {currentEmployee.role === "manager" && (
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* التقييمات */}
          <TabsContent value="evaluations" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">سجل التقييمات</h3>
              <Link href={`/dashboard/evaluations/new?employee_id=${id}`}>
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة تقييم جديد
                </Button>
              </Link>
            </div>

            {evaluations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Star className="mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="mb-2 text-muted-foreground">لا توجد تقييمات</p>
                  <Link href={`/dashboard/evaluations/new?employee_id=${id}`}>
                    <Button className="mt-4 bg-violet-600 hover:bg-violet-700">
                      <Plus className="ml-2 h-4 w-4" />
                      إضافة تقييم
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {evaluations.map((evaluation) => {
                  const evalStatus = getEvaluationStatusBadge(evaluation.status)
                  return (
                    <Card key={evaluation.id} className="border-violet-100">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <p className="font-semibold text-[var(--foreground)]">
                                {new Date(evaluation.evaluation_date).toLocaleDateString("ar-SA", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                              <span className={cn("rounded-full px-3 py-1 text-xs font-medium", evalStatus.color)}>
                                {evalStatus.text}
                              </span>
                            </div>

                            <div className="mb-3 flex items-center gap-4 text-sm text-[var(--neutral-500)]">
                              <span>
                                الفترة: {new Date(evaluation.period_start).toLocaleDateString("ar-SA")} -{" "}
                                {new Date(evaluation.period_end).toLocaleDateString("ar-SA")}
                              </span>
                              {evaluation.evaluator && (
                                <span>
                                  المقيّم: {evaluation.evaluator.full_name}
                                </span>
                              )}
                            </div>

                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-sm text-[var(--neutral-500)]">الدرجة الإجمالية:</span>
                              <span className="flex items-center gap-1 text-2xl font-bold text-blue-600">
                                {evaluation.overall_score || "-"}
                                <span className="text-sm font-normal text-[var(--neutral-500)]">/ 100</span>
                              </span>
                            </div>

                            {evaluation.comments && (
                              <p className="mt-2 text-sm text-[var(--neutral-500)]">
                                <span className="font-medium">تعليقات:</span> {evaluation.comments}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Link href={`/dashboard/evaluations/${evaluation.id}`}>
                              <Button variant="outline" size="sm">
                                <FileText className="ml-2 h-4 w-4" />
                                التفاصيل
                              </Button>
                            </Link>
                            {currentEmployee.role === "manager" && evaluation.status !== "approved" && (
                              <Button variant="outline" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
