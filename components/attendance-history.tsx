"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"
import { Calendar, Filter, Clock, MapPin } from "lucide-react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface AttendanceHistoryProps {
  attendance: any[]
  canFilter?: boolean
}

export function AttendanceHistory({ attendance, canFilter = false }: AttendanceHistoryProps) {
  const [dateFilter, setDateFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams)
    if (dateFilter) {
      params.set("date", dateFilter)
    } else {
      params.delete("date")
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter)
    } else {
      params.delete("status")
    }
    router.push(`/dashboard/attendance?${params.toString()}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-[var(--semantic-success)]/10 text-[var(--semantic-success)]"
      case "late":
        return "bg-[var(--semantic-warning)]/10 text-[var(--semantic-warning)]"
      case "absent":
        return "bg-[var(--semantic-critical)]/10 text-[var(--semantic-critical)]"
      case "half_day":
        return "bg-[var(--brand-600)]/10 text-[var(--brand-600)]"
      case "excused":
        return "bg-[var(--semantic-info)]/10 text-[var(--semantic-info)]"
      default:
        return "bg-[var(--surface-muted)] text-[var(--neutral-600)]"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "present":
        return "حاضر"
      case "late":
        return "متأخر"
      case "absent":
        return "غائب"
      case "half_day":
        return "نصف يوم"
      case "excused":
        return "إجازة"
      default:
        return status
    }
  }

  return (
    <Card className="surface-card border-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[var(--border)]/60 p-6 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-[var(--brand-600)]" />
            سجل الحضور
          </CardTitle>
          <p className="mt-1 text-sm text-[var(--neutral-500)]">تتبع السجلات التاريخية للحضور والانصراف</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {canFilter && (
          <div className="flex flex-col md:flex-row gap-3">
            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="md:w-48" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="present">حاضر</SelectItem>
                <SelectItem value="late">متأخر</SelectItem>
                <SelectItem value="absent">غائب</SelectItem>
                <SelectItem value="half_day">نصف يوم</SelectItem>
                <SelectItem value="excused">إجازة</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleFilter} className="bg-violet-600 hover:bg-violet-700">
              <Filter className="h-4 w-4 ml-2" />
              تصفية
            </Button>
          </div>
        )}

        {attendance.length > 0 ? (
          <div className="space-y-3">
            {attendance.map((record) => (
              <div
                key={record.id}
                className="p-4 border border-violet-100 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">
                      {new Date(record.date).toLocaleDateString("ar-SA", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {record.shift && <p className="text-sm text-muted-foreground mt-1">{record.shift.name}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                    {getStatusText(record.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {record.check_in_time && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        حضور:{" "}
                        {new Date(record.check_in_time).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {record.check_out_time && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        انصراف:{" "}
                        {new Date(record.check_out_time).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  {record.late_minutes > 0 && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="h-4 w-4" />
                      <span>تأخير: {record.late_minutes} دقيقة</span>
                    </div>
                  )}
                  {record.check_in_method && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {record.check_in_method === "location" && "الموقع"}
                        {record.check_in_method === "fingerprint" && "البصمة"}
                        {record.check_in_method === "nfc" && "NFC"}
                        {record.check_in_method === "supervisor" && "المشرف"}
                        {record.check_in_method === "manual" && "يدوي"}
                      </span>
                    </div>
                  )}
                </div>

                {record.notes && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                    <p className="text-muted-foreground">{record.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد سجلات حضور</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
