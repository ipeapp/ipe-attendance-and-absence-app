"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Plus, Edit, Trash2, Save, X } from "lucide-react"
import { useState } from "react"
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

interface WorkShift {
  id: string
  name: string
  start_time: string
  end_time: string
  shift_type: "morning" | "evening"
  grace_period_minutes: number
  department_id: string | null
  is_active: boolean
}

interface Department {
  id: string
  name: string
}

interface WorkShiftManagerProps {
  shifts: WorkShift[]
  departments: Department[]
  canEdit: boolean
}

export function WorkShiftManager({ shifts, departments, canEdit }: WorkShiftManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: "",
    start_time: "08:00",
    end_time: "16:00",
    shift_type: "morning" as "morning" | "evening",
    grace_period_minutes: 15,
    department_id: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      start_time: "08:00",
      end_time: "16:00",
      shift_type: "morning",
      grace_period_minutes: 15,
      department_id: "",
    })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleEdit = (shift: WorkShift) => {
    setFormData({
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_type: shift.shift_type,
      grace_period_minutes: shift.grace_period_minutes,
      department_id: shift.department_id || "",
    })
    setEditingId(shift.id)
    setIsAdding(false)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.start_time || !formData.end_time) {
      alert("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    setIsLoading(true)
    try {
      const data = {
        name: formData.name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        shift_type: formData.shift_type,
        grace_period_minutes: formData.grace_period_minutes,
        department_id: formData.department_id || null,
        is_active: true,
      }

      if (editingId) {
        const { error } = await supabase.from("work_shifts").update(data).eq("id", editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("work_shifts").insert(data)
        if (error) throw error
      }

      router.refresh()
      resetForm()
    } catch (error) {
      console.error("Error saving shift:", error)
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsLoading(true)

    try {
      const { error } = await supabase.from("work_shifts").delete().eq("id", deleteId)
      if (error) throw error

      router.refresh()
      setDeleteId(null)
    } catch (error) {
      console.error("Error deleting shift:", error)
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء الحذف")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleActive = async (shiftId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("work_shifts")
        .update({ is_active: !currentStatus })
        .eq("id", shiftId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error toggling shift:", error)
      alert("حدث خطأ أثناء تغيير حالة الفترة")
    }
  }

  return (
    <div className="space-y-6">
      {/* إضافة/تعديل فترة */}
      {canEdit && (isAdding || editingId) && (
        <Card className="border-violet-200 bg-violet-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-violet-600" />
              {editingId ? "تعديل الفترة" : "إضافة فترة جديدة"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الفترة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: الفترة الصباحية"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift_type">نوع الفترة *</Label>
                <Select
                  value={formData.shift_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, shift_type: value as "morning" | "evening" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">صباحية</SelectItem>
                    <SelectItem value="evening">مسائية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">وقت البداية *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">وقت النهاية *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grace_period">فترة السماح (بالدقائق) *</Label>
                <Input
                  id="grace_period"
                  type="number"
                  min="0"
                  max="60"
                  value={formData.grace_period_minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, grace_period_minutes: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">القسم (اختياري)</Label>
                <Select
                  value={formData.department_id}
                  onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأقسام" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الأقسام</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Save className="ml-2 h-4 w-4" />
                {isLoading ? "جاري الحفظ..." : "حفظ"}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={isLoading}>
                <X className="ml-2 h-4 w-4" />
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* زر إضافة */}
      {canEdit && !isAdding && !editingId && (
        <Button onClick={() => setIsAdding(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="ml-2 h-4 w-4" />
          إضافة فترة جديدة
        </Button>
      )}

      {/* قائمة الفترات */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shifts.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="mb-4 h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground">لا توجد فترات عمل</p>
            </CardContent>
          </Card>
        ) : (
          shifts.map((shift) => {
            const department = departments.find((d) => d.id === shift.department_id)
            return (
              <Card
                key={shift.id}
                className={`border-2 transition-all ${
                  shift.is_active
                    ? "border-violet-200 hover:border-violet-300"
                    : "border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-[var(--foreground)]">{shift.name}</h3>
                      <p className="text-xs text-[var(--neutral-500)]">
                        {shift.shift_type === "morning" ? "صباحية" : "مسائية"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        shift.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {shift.is_active ? "نشطة" : "معطلة"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--neutral-500)]">البداية:</span>
                      <span className="font-semibold">{shift.start_time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--neutral-500)]">النهاية:</span>
                      <span className="font-semibold">{shift.end_time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--neutral-500)]">فترة السماح:</span>
                      <span className="font-semibold">{shift.grace_period_minutes} دقيقة</span>
                    </div>
                    {department && (
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--neutral-500)]">القسم:</span>
                        <span className="font-semibold">{department.name}</span>
                      </div>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(shift)}
                        className="flex-1"
                      >
                        <Edit className="ml-2 h-4 w-4" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(shift.id, shift.is_active)}
                        className="flex-1"
                      >
                        {shift.is_active ? "تعطيل" : "تفعيل"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(shift.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* حوار التأكيد للحذف */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الفترة نهائياً. هذا قد يؤثر على سجلات الحضور المرتبطة بها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
