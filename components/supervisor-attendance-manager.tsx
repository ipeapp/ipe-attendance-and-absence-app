"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  Search,
  UserCheck,
  AlertCircle,
  Filter,
} from "lucide-react"
import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Employee {
  id: string
  full_name: string
  employee_number: string
  department: { id: string; name: string } | null
  position: string | null
}

interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  status: string
  late_minutes: number
  shift_id: string | null
}

interface Shift {
  id: string
  name: string
  start_time: string
  end_time: string
  grace_period_minutes: number
}

interface SupervisorAttendanceManagerProps {
  employees: Employee[]
  todayAttendance: AttendanceRecord[]
  shifts: Shift[]
  supervisorId: string
}

export function SupervisorAttendanceManager({
  employees,
  todayAttendance,
  shifts,
  supervisorId,
}: SupervisorAttendanceManagerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedShift, setSelectedShift] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [action, setAction] = useState<"checkin" | "checkout" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  const today = new Date().toISOString().split("T")[0]

  // Create a map of employee IDs to their attendance records
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>()
    todayAttendance.forEach((record) => {
      map.set(record.employee_id, record)
    })
    return map
  }, [todayAttendance])

  // Filter employees based on search and status
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      if (filterStatus === "all") return true

      const attendance = attendanceMap.get(emp.id)
      if (filterStatus === "present") {
        return attendance && attendance.check_in_time && !attendance.check_out_time
      }
      if (filterStatus === "absent") {
        return !attendance || !attendance.check_in_time
      }
      if (filterStatus === "completed") {
        return attendance && attendance.check_out_time
      }
      if (filterStatus === "late") {
        return attendance && attendance.status === "late"
      }

      return true
    })
  }, [employees, searchTerm, filterStatus, attendanceMap])

  const getEmployeeStatus = (employeeId: string) => {
    const attendance = attendanceMap.get(employeeId)
    if (!attendance || !attendance.check_in_time) {
      return { text: "لم يسجل", color: "bg-gray-100 text-gray-700", icon: XCircle }
    }
    if (attendance.check_out_time) {
      return { text: "مكتمل", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 }
    }
    if (attendance.status === "late") {
      return { text: "متأخر", color: "bg-amber-100 text-amber-700", icon: AlertCircle }
    }
    return { text: "حاضر", color: "bg-green-100 text-green-700", icon: CheckCircle2 }
  }

  const handleCheckIn = async (employee: Employee) => {
    setSelectedEmployee(employee)
    setAction("checkin")
    setSelectedShift("")
    setNotes("")
  }

  const handleCheckOut = async (employee: Employee) => {
    setSelectedEmployee(employee)
    setAction("checkout")
    setNotes("")
  }

  const confirmAction = async () => {
    if (!selectedEmployee) return

    setIsLoading(true)
    try {
      if (action === "checkin") {
        if (!selectedShift) {
          alert("يرجى اختيار الفترة")
          setIsLoading(false)
          return
        }

        const shift = shifts.find((s) => s.id === selectedShift)
        if (!shift) {
          throw new Error("الفترة غير موجودة")
        }

        const now = new Date()
        const currentTime = now.toTimeString().split(" ")[0]
        const [startHour, startMin] = shift.start_time.split(":").map(Number)
        const [currentHour, currentMin] = currentTime.split(":").map(Number)
        const startMinutes = startHour * 60 + startMin + shift.grace_period_minutes
        const currentMinutes = currentHour * 60 + currentMin
        const lateMinutes = Math.max(0, currentMinutes - startMinutes)
        const status = lateMinutes > 0 ? "late" : "present"

        const { error } = await supabase.from("attendance_records").insert({
          employee_id: selectedEmployee.id,
          date: today,
          shift_id: selectedShift,
          check_in_time: now.toISOString(),
          status,
          late_minutes: lateMinutes,
          check_in_method: "supervisor",
          notes: notes || null,
          approved_by: supervisorId,
        })

        if (error) throw error
      } else if (action === "checkout") {
        const attendance = attendanceMap.get(selectedEmployee.id)
        if (!attendance) {
          throw new Error("لم يتم العثور على سجل حضور")
        }

        const { error } = await supabase
          .from("attendance_records")
          .update({
            check_out_time: new Date().toISOString(),
            notes: notes ? `${attendance.notes || ""}\n${notes}`.trim() : attendance.notes,
          })
          .eq("id", attendance.id)

        if (error) throw error
      }

      router.refresh()
      setSelectedEmployee(null)
      setAction(null)
      setNotes("")
      setSelectedShift("")
    } catch (error) {
      console.error("Error:", error)
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء العملية")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkCheckIn = async () => {
    if (selectedForBulk.size === 0 || !selectedShift) {
      alert("يرجى اختيار الموظفين والفترة")
      return
    }

    setIsLoading(true)
    try {
      const shift = shifts.find((s) => s.id === selectedShift)
      if (!shift) throw new Error("الفترة غير موجودة")

      const now = new Date()
      const currentTime = now.toTimeString().split(" ")[0]
      const [startHour, startMin] = shift.start_time.split(":").map(Number)
      const [currentHour, currentMin] = currentTime.split(":").map(Number)
      const startMinutes = startHour * 60 + startMin + shift.grace_period_minutes
      const currentMinutes = currentHour * 60 + currentMin
      const lateMinutes = Math.max(0, currentMinutes - startMinutes)
      const status = lateMinutes > 0 ? "late" : "present"

      const records = Array.from(selectedForBulk).map((employeeId) => ({
        employee_id: employeeId,
        date: today,
        shift_id: selectedShift,
        check_in_time: now.toISOString(),
        status,
        late_minutes: lateMinutes,
        check_in_method: "supervisor",
        notes: notes || null,
        approved_by: supervisorId,
      }))

      const { error } = await supabase.from("attendance_records").insert(records)
      if (error) throw error

      router.refresh()
      setSelectedForBulk(new Set())
      setNotes("")
      alert(`تم تسجيل حضور ${records.length} موظف بنجاح`)
    } catch (error) {
      console.error("Error:", error)
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء التسجيل الجماعي")
    } finally {
      setIsLoading(false)
    }
  }

  const stats = useMemo(() => {
    const total = employees.length
    const present = employees.filter(
      (e) => attendanceMap.get(e.id)?.check_in_time && !attendanceMap.get(e.id)?.check_out_time
    ).length
    const absent = employees.filter((e) => !attendanceMap.get(e.id)?.check_in_time).length
    const completed = employees.filter((e) => attendanceMap.get(e.id)?.check_out_time).length
    const late = employees.filter((e) => attendanceMap.get(e.id)?.status === "late").length

    return { total, present, absent, completed, late }
  }, [employees, attendanceMap])

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
                <p className="text-3xl font-bold text-violet-600">{stats.total}</p>
              </div>
              <Users className="h-10 w-10 text-violet-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">حاضر</p>
                <p className="text-3xl font-bold text-green-600">{stats.present}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">غائب</p>
                <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">متأخر</p>
                <p className="text-3xl font-bold text-amber-600">{stats.late}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-amber-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مكتمل</p>
                <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedForBulk.size > 0 && (
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-violet-600" />
                <span className="font-medium text-violet-900">
                  تم اختيار {selectedForBulk.size} موظف
                </span>
              </div>
              <div className="flex-1 flex gap-3">
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger className="w-full md:w-64 bg-white">
                    <SelectValue placeholder="اختر الفترة" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.name} ({shift.start_time} - {shift.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleBulkCheckIn}
                  disabled={isLoading || !selectedShift}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  تسجيل الحضور للمحددين
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedForBulk(new Set())}
                  className="bg-white"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="border-violet-100">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم أو رقم الموظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="present">حاضر</SelectItem>
                <SelectItem value="absent">غائب</SelectItem>
                <SelectItem value="late">متأخر</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees List */}
      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-600" />
            قائمة الموظفين ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا يوجد موظفون</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEmployees.map((employee) => {
                const status = getEmployeeStatus(employee.id)
                const attendance = attendanceMap.get(employee.id)
                const StatusIcon = status.icon
                const isSelected = selectedForBulk.has(employee.id)
                const canCheckIn = !attendance || !attendance.check_in_time
                const canCheckOut = attendance && attendance.check_in_time && !attendance.check_out_time

                return (
                  <div
                    key={employee.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                      isSelected ? "border-violet-400 bg-violet-50" : "border-violet-100 hover:border-violet-200"
                    }`}
                  >
                    {canCheckIn && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSet = new Set(selectedForBulk)
                          if (e.target.checked) {
                            newSet.add(employee.id)
                          } else {
                            newSet.delete(employee.id)
                          }
                          setSelectedForBulk(newSet)
                        }}
                        className="w-5 h-5 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{employee.full_name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} flex items-center gap-1`}>
                          <StatusIcon className="h-4 w-4" />
                          {status.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{employee.employee_number}</span>
                        {employee.position && <span>• {employee.position}</span>}
                        {employee.department && <span>• {employee.department.name}</span>}
                      </div>
                      {attendance && (
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {attendance.check_in_time && (
                            <span className="flex items-center gap-1 text-green-600">
                              <LogIn className="h-3 w-3" />
                              {new Date(attendance.check_in_time).toLocaleTimeString("ar-SA", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          {attendance.check_out_time && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <LogOut className="h-3 w-3" />
                              {new Date(attendance.check_out_time).toLocaleTimeString("ar-SA", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          {attendance.late_minutes > 0 && (
                            <span className="text-amber-600">تأخير: {attendance.late_minutes} دقيقة</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {canCheckIn && (
                        <Button
                          onClick={() => handleCheckIn(employee)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <LogIn className="h-4 w-4 ml-2" />
                          تسجيل حضور
                        </Button>
                      )}
                      {canCheckOut && (
                        <Button
                          onClick={() => handleCheckOut(employee)}
                          className="bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          <LogOut className="h-4 w-4 ml-2" />
                          تسجيل انصراف
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "checkin" ? "تسجيل حضور" : "تسجيل انصراف"} - {selectedEmployee?.full_name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 mt-4">
                {action === "checkin" && (
                  <div className="space-y-2">
                    <Label htmlFor="shift">اختر الفترة *</Label>
                    <Select value={selectedShift} onValueChange={setSelectedShift}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفترة" />
                      </SelectTrigger>
                      <SelectContent>
                        {shifts.map((shift) => (
                          <SelectItem key={shift.id} value={shift.id}>
                            {shift.name} ({shift.start_time} - {shift.end_time})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أضف ملاحظات إن وجدت..."
                    rows={3}
                    className="text-right"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={isLoading || (action === "checkin" && !selectedShift)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isLoading ? "جاري التسجيل..." : "تأكيد"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
