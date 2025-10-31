import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardCheck, Calendar } from "lucide-react"
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-violet-600" />
            الحضور والغياب
          </h1>
          <p className="text-muted-foreground mt-1">تسجيل الحضور والانصراف ومتابعة السجلات</p>
        </div>

        <Tabs defaultValue="checkin" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="checkin">تسجيل الحضور</TabsTrigger>
            <TabsTrigger value="history">السجلات</TabsTrigger>
            {(employee.role === "manager" || employee.role === "supervisor") && (
              <TabsTrigger value="team">الفريق</TabsTrigger>
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
              <Card className="border-violet-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-violet-600" />
                    حضور الفريق اليوم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamAttendance && teamAttendance.length > 0 ? (
                    <div className="space-y-3">
                      {teamAttendance.map((record: any) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-4 border border-violet-100 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{record.employee.full_name}</p>
                            <p className="text-sm text-muted-foreground">{record.employee.employee_number}</p>
                          </div>
                          <div className="text-left">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                record.status === "present"
                                  ? "bg-green-100 text-green-700"
                                  : record.status === "late"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {record.status === "present" && "حاضر"}
                              {record.status === "late" && "متأخر"}
                              {record.status === "absent" && "غائب"}
                            </span>
                            {record.check_in_time && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {new Date(record.check_in_time).toLocaleTimeString("ar-SA", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">لا توجد سجلات حضور اليوم</p>
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
