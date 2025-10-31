"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Plus, Edit, Trash2, Building2 } from "lucide-react"
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

interface EvaluationCriteriaListProps {
  criteria: any[]
}

export function EvaluationCriteriaList({ criteria }: EvaluationCriteriaListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    try {
      const { error } = await supabase.from("evaluation_criteria").delete().eq("id", deleteId)

      if (error) throw error

      router.refresh()
      setDeleteId(null)
    } catch (error) {
      console.error("[v0] Error deleting criteria:", error)
      alert("حدث خطأ أثناء حذف المعيار")
    } finally {
      setIsDeleting(false)
    }
  }

  if (criteria.length === 0) {
    return (
      <Card className="border-violet-100">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Star className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">لا توجد معايير تقييم</p>
          <p className="text-sm text-muted-foreground mb-4">ابدأ بإضافة معايير التقييم</p>
          <Link href="/dashboard/evaluations/criteria/new">
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 ml-2" />
              إضافة معيار
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Link href="/dashboard/evaluations/criteria/new">
          <Button className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 ml-2" />
            إضافة معيار
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {criteria.map((criterion) => (
          <Card key={criterion.id} className="border-violet-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-violet-600" />
                {criterion.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {criterion.description && <p className="text-sm text-muted-foreground">{criterion.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الوزن:</span>
                <span className="font-bold text-violet-600">{criterion.weight}%</span>
              </div>
              {criterion.department && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{criterion.department.name}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Link href={`/dashboard/evaluations/criteria/${criterion.id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 bg-transparent"
                  onClick={() => setDeleteId(criterion.id)}
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
            <AlertDialogDescription>
              سيتم حذف المعيار نهائياً. لن تتمكن من التراجع عن هذا الإجراء.
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
