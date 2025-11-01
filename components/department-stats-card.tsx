"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, TrendingUp, TrendingDown, Users, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DepartmentStats {
  id: string
  name: string
  description: string | null
  employeeCount: number
  attendanceRate: number
  performanceRate: number
  presentToday: number
  absentToday: number
  lateToday: number
  supervisorName?: string
}

export function DepartmentStatsCard({ dept }: { dept: DepartmentStats }) {
  // تحديد لون الحالة بناءً على نسبة الانضباط
  const getStatusColor = (rate: number) => {
    if (rate >= 90) return "success"
    if (rate >= 75) return "warning"
    return "critical"
  }

  const attendanceStatus = getStatusColor(dept.attendanceRate)
  const performanceStatus = getStatusColor(dept.performanceRate)

  const statusColors = {
    success: "from-green-50 to-emerald-50 border-green-200",
    warning: "from-amber-50 to-yellow-50 border-amber-200",
    critical: "from-red-50 to-rose-50 border-red-200",
  }

  const mainStatusColor = attendanceStatus === "critical" || performanceStatus === "critical" 
    ? statusColors.critical
    : attendanceStatus === "warning" || performanceStatus === "warning"
    ? statusColors.warning
    : statusColors.success

  return (
    <Link href={`/dashboard/departments/${dept.id}`}>
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 bg-gradient-to-br",
          mainStatusColor
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-xl mb-1">
                <Building2 className="h-5 w-5 text-[var(--brand-600)]" />
                {dept.name}
              </CardTitle>
              {dept.description && (
                <p className="text-xs text-[var(--neutral-500)] line-clamp-1">{dept.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--neutral-500)]">
              <Users className="h-3 w-3" />
              <span>{dept.employeeCount}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* نسب الأداء */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/80 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--neutral-500)]">الانضباط</span>
                {dept.attendanceRate >= 90 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-end gap-2">
                <span className={cn(
                  "text-2xl font-bold",
                  dept.attendanceRate >= 90 ? "text-green-600" : dept.attendanceRate >= 75 ? "text-amber-600" : "text-red-600"
                )}>
                  {dept.attendanceRate.toFixed(0)}%
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    dept.attendanceRate >= 90 ? "bg-green-600" : dept.attendanceRate >= 75 ? "bg-amber-600" : "bg-red-600"
                  )}
                  style={{ width: `${dept.attendanceRate}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl bg-white/80 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--neutral-500)]">الأداء</span>
                {dept.performanceRate >= 90 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-end gap-2">
                <span className={cn(
                  "text-2xl font-bold",
                  dept.performanceRate >= 90 ? "text-green-600" : dept.performanceRate >= 75 ? "text-amber-600" : "text-red-600"
                )}>
                  {dept.performanceRate.toFixed(0)}%
                </span>
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    dept.performanceRate >= 90 ? "bg-green-600" : dept.performanceRate >= 75 ? "bg-amber-600" : "bg-red-600"
                  )}
                  style={{ width: `${dept.performanceRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* إحصائيات اليوم */}
          <div className="flex items-center justify-between rounded-xl bg-white/80 p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-semibold">{dept.presentToday}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-600">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-semibold">{dept.lateToday}</span>
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">{dept.absentToday}</span>
              </div>
            </div>
            <span className="text-xs text-[var(--neutral-500)]">اليوم</span>
          </div>

          {/* المشرف */}
          {dept.supervisorName && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--neutral-500)]">المشرف:</span>
              <span className="font-medium text-[var(--foreground)]">{dept.supervisorName}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
