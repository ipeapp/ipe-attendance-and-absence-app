import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/empty-state"
import { ClipboardCheck, Calendar, Users } from "lucide-react"
import { AttendanceCheckIn } from "@/components/attendance-check-in"
import { AttendanceHistory } from "@/components/attendance-history"
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

  // For managers/supervisors, get team attendance
  let teamAttendance = null
  if (employee.role === "manager" || employee.role === "supervisor") {
    const { data } = await supabase
      .from("attendance_records")
      .select("*, employee:employees(full_name, employee_number), shift:work_shifts(*)")
      .eq("date", today)
      .order("created_at", { ascending: false })

    teamAttendance = data
  }

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="flex flex-col gap-8">
        <div className="surface-card border-none p-6 sm:p-7">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-600)]">
              التحكم في الحضور
            </span>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gradient-brand sm:text-4xl">
              <ClipboardCheck className="h-7 w-7 text-[var(--brand-600)]" />
              الحضور والغياب
            </h1>
            <p className="text-sm text-[var(--neutral-500)]">تسجيل الحضور والانصراف ومتابعة سجلات الفريق في مكان واحد.</p>
          </div>
        </div>

        <Tabs defaultValue="checkin" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 rounded-full bg-[var(--surface-muted)] p-1">
            <TabsTrigger value="checkin" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-[var(--shadow-xs)]">
              تسجيل الحضور
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-[var(--shadow-xs)]">
              السجلات
            </TabsTrigger>
            {(employee.role === "manager" || employee.role === "supervisor") && (
              <TabsTrigger
                value="team"
                className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-[var(--shadow-xs)]"
              >
                الفريق
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="checkin" className="space-y-6">
            <AttendanceCheckIn employee={employee} todayAttendance={todayAttendance || []} shifts={shifts || []} />
          </TabsContent>

          <TabsContent value="history">
            <AttendanceHistory attendance={attendanceHistory || []} canFilter={true} />
          </TabsContent>

          {(employee.role === "manager" || employee.role === "supervisor") && (
            <TabsContent value="team">
              <Card className="surface-card border-none p-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5 text-[var(--brand-600)]" />
                      حضور الفريق اليوم
                    </CardTitle>
                    <p className="mt-2 text-sm text-[var(--neutral-500)]">سجل حضور اليوم للفريق المرتبط بك</p>
                  </div>
                </CardHeader>
                <CardContent className="mt-6 space-y-3 p-0">
                  {teamAttendance && teamAttendance.length > 0 ? (
                    teamAttendance.map((record: any) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)]/70 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">{record.employee.full_name}</p>
                          <p className="text-xs text-[var(--neutral-500)]">{record.employee.employee_number}</p>
                        </div>
                        <div className="text-left">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                              record.status === "present" && "bg-[var(--semantic-success)]/10 text-[var(--semantic-success)]",
                              record.status === "late" && "bg-[var(--semantic-warning)]/10 text-[var(--semantic-warning)]",
                              record.status === "absent" && "bg-[var(--semantic-critical)]/10 text-[var(--semantic-critical)]",
                            )}
                          >
                            {record.status === "present" && "حاضر"}
                            {record.status === "late" && "متأخر"}
                            {record.status === "absent" && "غائب"}
                          </span>
                          {record.check_in_time && (
                            <p className="mt-2 text-xs text-[var(--neutral-500)]">
                              {new Date(record.check_in_time).toLocaleTimeString("ar-SA", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={Calendar}
                      title="لا توجد سجلات اليوم"
                      description="لم يتم تسجيل حضور لأي موظف بعد. تابع لاحقاً أو اطلب من موظفيك التسجيل."
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
