"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building2, Users, Edit, Trash2, Search, TrendingUp, CheckCircle2, AlertCircle, Eye } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
import { cn } from "@/lib/utils"

interface Department {
  id: string
  name: string
  description: string | null
  employees: { count: number }[]
  employeeCount?: number
  attendanceRate?: number
  performanceRate?: number
}

export function EnhancedDepartmentsList({ departments }: { departments: Department[] }) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    try {
      const { error } = await supabase.from("departments").delete().eq("id", deleteId)

      if (error) throw error

      router.refresh()
      setDeleteId(null)
    } catch (error) {
      console.error("Error deleting department:", error)
      alert("حدث خطأ أثناء حذف القسم")
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (departments.length === 0) {
    return (
      <Card className="border-violet-100">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">لا توجد أقسام بعد</p>
          <p className="text-sm text-muted-foreground mb-4">ابدأ بإضافة قسم جديد</p>
          <Link href="/dashboard/departments/new">
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Building2 className="h-4 w-4 ml-2" />
              إضافة قسم
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* بحث */}
      <Card className="border-violet-100 mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث عن قسم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {filteredDepartments.length === 0 ? (
        <Card className="border-violet-100">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لم يتم العثور على نتائج</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDepartments.map((dept) => {
            const employeeCount = dept.employeeCount !== undefined 
              ? dept.employeeCount 
              : (dept.employees[0]?.count || 0)
            
            return (
              <Card 
                key={dept.id} 
                className="group border-2 border-violet-100 hover:border-violet-300 hover:shadow-xl transition-all duration-300"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 group-hover:bg-violet-200 transition-colors">
                        <Building2 className="h-5 w-5 text-violet-600" />
                      </div>
                      <span className="text-lg">{dept.name}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dept.description && (
                    <p className="text-sm text-[var(--neutral-500)] line-clamp-2">
                      {dept.description}
                    </p>
                  )}

                  {/* إحصائيات */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-violet-50 p-3">
                      <div className="flex items-center gap-2 text-sm text-[var(--neutral-600)]">
                        <Users className="h-4 w-4 text-violet-600" />
                        <span>عدد الموظفين</span>
                      </div>
                      <span className="text-lg font-bold text-violet-600">{employeeCount}</span>
                    </div>

                    {dept.attendanceRate !== undefined && (
                      <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                        <div className="flex items-center gap-2 text-sm text-[var(--neutral-600)]">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>نسبة الانضباط</span>
                        </div>
                        <span className={cn(
                          "text-lg font-bold",
                          dept.attendanceRate >= 90 ? "text-green-600" : 
                          dept.attendanceRate >= 75 ? "text-amber-600" : "text-red-600"
                        )}>
                          {dept.attendanceRate.toFixed(0)}%
                        </span>
                      </div>
                    )}

                    {dept.performanceRate !== undefined && (
                      <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                        <div className="flex items-center gap-2 text-sm text-[var(--neutral-600)]">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span>معدل الأداء</span>
                        </div>
                        <span className={cn(
                          "text-lg font-bold",
                          dept.performanceRate >= 90 ? "text-green-600" : 
                          dept.performanceRate >= 75 ? "text-amber-600" : "text-red-600"
                        )}>
                          {dept.performanceRate.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/dashboard/departments/${dept.id}`} className="flex-1">
                      <Button 
                        variant="outline" 
                        className="w-full bg-violet-50 border-violet-200 hover:bg-violet-100 hover:border-violet-300"
                      >
                        <Eye className="h-4 w-4 ml-2" />
                        عرض
                      </Button>
                    </Link>
                    <Link href={`/dashboard/departments/${dept.id}/edit`}>
                      <Button variant="outline" size="icon" className="bg-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 bg-white"
                      onClick={() => setDeleteId(dept.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف القسم نهائياً. قد يؤثر هذا على الموظفين المرتبطين بهذا القسم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
