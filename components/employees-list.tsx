"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Edit, Trash2, Search, Mail, Phone, Building2, Calendar, Badge } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
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

interface Employee {
  id: string
  full_name: string
  email: string
  phone: string | null
  employee_number: string
  role: string
  hire_date: string
  is_active: boolean
  department: {
    id: string
    name: string
  } | null
}

interface Department {
  id: string
  name: string
}

export function EmployeesList({
  employees,
  departments,
  canEdit,
}: {
  employees: Employee[]
  departments: Department[]
  canEdit: boolean
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDept, setSelectedDept] = useState<string>("all")
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    try {
      const { error } = await supabase.from("employees").delete().eq("id", deleteId)

      if (error) throw error

      router.refresh()
      setDeleteId(null)
    } catch (error) {
      console.error("[v0] Error deleting employee:", error)
      alert("حدث خطأ أثناء حذف الموظف")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    if (searchTerm) {
      params.set("search", searchTerm)
    } else {
      params.delete("search")
    }
    if (selectedDept !== "all") {
      params.set("department", selectedDept)
    } else {
      params.delete("department")
    }
    router.push(`/dashboard/employees?${params.toString()}`)
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case "manager":
        return "مدير"
      case "supervisor":
        return "مشرف"
      case "employee":
        return "موظف"
      default:
        return role
    }
  }

  if (employees.length === 0) {
    return (
      <Card className="border-violet-100">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">لا يوجد موظفون</p>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || selectedDept !== "all" ? "لم يتم العثور على نتائج للبحث" : "ابدأ بإضافة موظف جديد"}
          </p>
          {canEdit && !searchTerm && selectedDept === "all" && (
            <Link href="/dashboard/employees/new">
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Users className="h-4 w-4 ml-2" />
                إضافة موظف
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-violet-100">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم، البريد، أو رقم الموظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pr-10"
              />
            </div>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="جميع الأقسام" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="bg-violet-600 hover:bg-violet-700">
              <Search className="h-4 w-4 ml-2" />
              بحث
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((emp) => (
          <Card key={emp.id} className="border-violet-100 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{emp.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{getRoleName(emp.role)}</p>
                </div>
                {!emp.is_active && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">غير نشط</span>}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Badge className="h-4 w-4" />
                  <span>{emp.employee_number}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{emp.email}</span>
                </div>
                {emp.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{emp.phone}</span>
                  </div>
                )}
                {emp.department && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{emp.department.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(emp.hire_date).toLocaleDateString("ar-SA")}</span>
                </div>
              </div>

              {canEdit && (
                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/employees/${emp.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      <Edit className="h-4 w-4 ml-2" />
                      تعديل
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 bg-transparent"
                    onClick={() => setDeleteId(emp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف الموظف نهائياً. لن تتمكن من التراجع عن هذا الإجراء.</AlertDialogDescription>
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
