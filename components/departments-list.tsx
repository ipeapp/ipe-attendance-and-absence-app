"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, Edit, Trash2 } from "lucide-react"
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

interface Department {
  id: string
  name: string
  description: string | null
  employees: { count: number }[]
}

export function DepartmentsList({ departments }: { departments: Department[] }) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
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
      console.error("[v0] Error deleting department:", error)
      alert("حدث خطأ أثناء حذف القسم")
    } finally {
      setIsDeleting(false)
    }
  }

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id} className="border-violet-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-violet-600" />
                {dept.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dept.description && <p className="text-sm text-muted-foreground">{dept.description}</p>}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{dept.employees[0]?.count || 0} موظف</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/departments/${dept.id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 bg-transparent"
                  onClick={() => setDeleteId(dept.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف القسم نهائياً. لن تتمكن من التراجع عن هذا الإجراء.</AlertDialogDescription>
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
