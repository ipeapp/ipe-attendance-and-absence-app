"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Circle } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface AttendanceRecord {
  date: string
  status: "present" | "absent" | "late" | "excused" | "half_day"
  check_in_time?: string
  check_out_time?: string
  late_minutes?: number
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[]
  employeeName?: string
}

export function AttendanceCalendar({ records, employeeName }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first and last day of month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Create a map of dates to attendance records
  const recordsMap = new Map<string, AttendanceRecord>()
  records.forEach((record) => {
    recordsMap.set(record.date, record)
  })

  const monthNames = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ]

  const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 border-green-300 text-green-700"
      case "late":
        return "bg-amber-100 border-amber-300 text-amber-700"
      case "absent":
        return "bg-red-100 border-red-300 text-red-700"
      case "excused":
        return "bg-blue-100 border-blue-300 text-blue-700"
      case "half_day":
        return "bg-purple-100 border-purple-300 text-purple-700"
      default:
        return "bg-gray-50 border-gray-200 text-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="h-4 w-4" />
      case "late":
        return <Clock className="h-4 w-4" />
      case "absent":
        return <XCircle className="h-4 w-4" />
      case "excused":
        return <Circle className="h-4 w-4 fill-current" />
      default:
        return null
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
      case "excused":
        return "إجازة"
      case "half_day":
        return "نصف يوم"
      default:
        return ""
    }
  }

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const today = new Date().toISOString().split("T")[0]

  // Calculate statistics for the month
  const monthStats = {
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    total: 0,
  }

  records.forEach((record) => {
    const recordDate = new Date(record.date)
    if (recordDate.getMonth() === month && recordDate.getFullYear() === year) {
      monthStats.total++
      if (record.status === "present") monthStats.present++
      else if (record.status === "late") monthStats.late++
      else if (record.status === "absent") monthStats.absent++
      else if (record.status === "excused") monthStats.excused++
    }
  })

  // Generate calendar days
  const calendarDays = []
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <Card className="border-violet-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-violet-600" />
            تقويم الحضور
            {employeeName && <span className="text-sm font-normal text-[var(--neutral-500)]">- {employeeName}</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center font-semibold">
              {monthNames[month]} {year}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Month Statistics */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-xs text-green-700">حاضر</p>
            <p className="text-2xl font-bold text-green-600">{monthStats.present}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-center">
            <p className="text-xs text-amber-700">متأخر</p>
            <p className="text-2xl font-bold text-amber-600">{monthStats.late}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-xs text-red-700">غائب</p>
            <p className="text-2xl font-bold text-red-600">{monthStats.absent}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3 text-center">
            <p className="text-xs text-blue-700">إجازة</p>
            <p className="text-2xl font-bold text-blue-600">{monthStats.excused}</p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div>
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-[var(--neutral-500)] p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const record = recordsMap.get(dateStr)
              const isToday = dateStr === today
              const dayOfWeek = new Date(dateStr).getDay()
              const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 // Friday or Saturday

              return (
                <div
                  key={day}
                  className={cn(
                    "aspect-square rounded-lg border-2 p-2 transition-all hover:shadow-md",
                    record ? getStatusColor(record.status) : "bg-white border-gray-200",
                    isToday && "ring-2 ring-violet-400 ring-offset-2",
                    isWeekend && !record && "bg-gray-50"
                  )}
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <span className="text-sm font-semibold">{day}</span>
                    {record && (
                      <div className="mt-1 flex items-center justify-center">
                        {getStatusIcon(record.status)}
                      </div>
                    )}
                    {!record && isWeekend && (
                      <span className="text-xs text-gray-400">عطلة</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-green-100 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-sm text-[var(--neutral-600)]">حاضر</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-100 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-sm text-[var(--neutral-600)]">متأخر</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-red-100 text-red-700">
              <XCircle className="h-4 w-4" />
            </div>
            <span className="text-sm text-[var(--neutral-600)]">غائب</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-700">
              <Circle className="h-4 w-4 fill-current" />
            </div>
            <span className="text-sm text-[var(--neutral-600)]">إجازة</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
