"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, MapPin, Fingerprint, Smartphone, UserCheck, LogIn, LogOut, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface AttendanceCheckInProps {
  employee: any
  todayAttendance: any[]
  shifts: any[]
}

export function AttendanceCheckIn({ employee, todayAttendance, shifts }: AttendanceCheckInProps) {
  const [selectedShift, setSelectedShift] = useState<string>("")
  const [checkInMethod, setCheckInMethod] = useState<string>("manual")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const hasCheckedIn = todayAttendance.some((a) => a.check_in_time)
  const hasCheckedOut = todayAttendance.some((a) => a.check_out_time)

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setCheckInMethod("location")
        },
        (error) => {
          console.error("[v0] Error getting location:", error)
          alert("تعذر الحصول على الموقع. يرجى السماح بالوصول إلى الموقع.")
        },
      )
    } else {
      alert("المتصفح لا يدعم خدمات الموقع")
    }
  }

  const handleCheckIn = async () => {
    if (!selectedShift) {
      setError("يرجى اختيار الفترة")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const shift = shifts.find((s) => s.id === selectedShift)
      const now = new Date()
      const today = now.toISOString().split("T")[0]
      const currentTime = now.toTimeString().split(" ")[0]

      // Calculate if late
      const shiftStartTime = shift.start_time
      const gracePeriod = shift.grace_period_minutes || 0

      const [startHour, startMin] = shiftStartTime.split(":").map(Number)
      const [currentHour, currentMin, currentSec] = currentTime.split(":").map(Number)

      const startMinutes = startHour * 60 + startMin + gracePeriod
      const currentMinutes = currentHour * 60 + currentMin

      const lateMinutes = Math.max(0, currentMinutes - startMinutes)
      const status = lateMinutes > 0 ? "late" : "present"

      const { error } = await supabase.from("attendance_records").insert({
        employee_id: employee.id,
        date: today,
        shift_id: selectedShift,
        check_in_time: now.toISOString(),
        status,
        late_minutes: lateMinutes,
        check_in_method: checkInMethod,
        check_in_location: location ? `${location.lat},${location.lng}` : null,
        notes: notes || null,
      })

      if (error) throw error

      router.refresh()
      setNotes("")
      setSelectedShift("")
    } catch (error: unknown) {
      console.error("[v0] Error checking in:", error)
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الحضور")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const record = todayAttendance.find((a) => a.check_in_time && !a.check_out_time)
      if (!record) {
        throw new Error("لم يتم العثور على سجل حضور")
      }

      const { error } = await supabase
        .from("attendance_records")
        .update({
          check_out_time: new Date().toISOString(),
          notes: notes || record.notes,
        })
        .eq("id", record.id)

      if (error) throw error

      router.refresh()
      setNotes("")
    } catch (error: unknown) {
      console.error("[v0] Error checking out:", error)
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الانصراف")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Check-in Status */}
      <Card className="surface-card border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[var(--border)]/60 p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-[var(--brand-600)]" />
            حالة الحضور اليوم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {todayAttendance.length > 0 ? (
            todayAttendance.map((record) => (
              <div key={record.id} className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)]/80 px-4 py-3">
                  <span className="text-xs font-medium text-[var(--neutral-500)]">الفترة</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">{record.shift?.name}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)]/80 px-4 py-3">
                  <span className="text-xs font-medium text-[var(--neutral-500)]">الحالة</span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                      record.status === "present"
                        ? "bg-[var(--semantic-success)]/10 text-[var(--semantic-success)]"
                        : record.status === "late"
                          ? "bg-[var(--semantic-warning)]/10 text-[var(--semantic-warning)]"
                          : "bg-[var(--semantic-critical)]/10 text-[var(--semantic-critical)]",
                    )}
                  >
                    {record.status === "present" && "حاضر"}
                    {record.status === "late" && "متأخر"}
                    {record.status === "absent" && "غائب"}
                  </span>
                </div>
                {record.check_in_time && (
                  <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)]/80 px-4 py-3">
                    <span className="text-xs font-medium text-[var(--neutral-500)]">وقت الحضور</span>
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      {new Date(record.check_in_time).toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {record.check_out_time && (
                  <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)]/80 px-4 py-3">
                    <span className="text-xs font-medium text-[var(--neutral-500)]">وقت الانصراف</span>
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      {new Date(record.check_out_time).toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {record.late_minutes > 0 && (
                  <div className="flex items-center justify-between rounded-2xl bg-[var(--semantic-warning)]/10 px-4 py-3">
                    <span className="text-xs font-medium text-[var(--neutral-500)]">مدة التأخير</span>
                    <span className="text-sm font-semibold text-[var(--semantic-warning)]">{record.late_minutes} دقيقة</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-10 text-center">
              <Clock className="mx-auto mb-3 h-12 w-12 text-[var(--neutral-400)]" />
              <p className="text-sm text-[var(--neutral-500)]">لم يتم تسجيل الحضور بعد</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in Form */}
      <Card className="surface-card border-none">
        <CardHeader className="border-b border-[var(--border)]/60 p-6 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            {hasCheckedIn && !hasCheckedOut ? (
              <>
                <LogOut className="h-5 w-5 text-[var(--brand-600)]" />
                تسجيل الانصراف
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5 text-[var(--brand-600)]" />
                تسجيل الحضور
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          {!hasCheckedIn ? (
            <>
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

              <div className="space-y-2">
                <Label>طريقة التسجيل</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={checkInMethod === "location" ? "default" : "outline"}
                    className="justify-start"
                    onClick={getLocation}
                  >
                    <MapPin className="h-4 w-4 ml-2" />
                    الموقع
                  </Button>
                  <Button
                    type="button"
                    variant={checkInMethod === "nfc" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setCheckInMethod("nfc")}
                  >
                    <Smartphone className="h-4 w-4 ml-2" />
                    NFC
                  </Button>
                  <Button
                    type="button"
                    variant={checkInMethod === "fingerprint" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setCheckInMethod("fingerprint")}
                  >
                    <Fingerprint className="h-4 w-4 ml-2" />
                    البصمة
                  </Button>
                  <Button
                    type="button"
                    variant={checkInMethod === "manual" ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setCheckInMethod("manual")}
                  >
                    <UserCheck className="h-4 w-4 ml-2" />
                    يدوي
                  </Button>
                </div>
                {location && (
                  <p className="flex items-center gap-1 text-xs text-[var(--semantic-success)]">
                    <CheckCircle2 className="h-3 w-3" />
                    تم الحصول على الموقع بنجاح
                  </p>
                )}
              </div>
            </>
          ) : null}

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

          {error && <div className="rounded-2xl bg-[var(--semantic-critical)]/10 p-3 text-sm text-[var(--semantic-critical)]">{error}</div>}

          {!hasCheckedIn ? (
            <Button
              onClick={handleCheckIn}
              disabled={isLoading || !selectedShift}
              className="w-full rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] transition hover:opacity-90"
            >
              {isLoading ? "جاري التسجيل..." : "تسجيل الحضور"}
            </Button>
          ) : !hasCheckedOut ? (
            <Button
              onClick={handleCheckOut}
              disabled={isLoading}
              className="w-full rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] transition hover:opacity-90"
            >
              {isLoading ? "جاري التسجيل..." : "تسجيل الانصراف"}
            </Button>
          ) : (
            <div className="rounded-2xl bg-[var(--semantic-success)]/10 px-4 py-6 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-[var(--semantic-success)]" />
              <p className="text-sm font-medium text-[var(--semantic-success)]">تم تسجيل الحضور والانصراف</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
