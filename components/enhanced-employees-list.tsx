"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  Edit, 
  Trash2, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  Badge, 
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star
} from "lucide-react"
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
import { cn } from "@/lib/utils"

interface Employee {
  id: string
  full_name: string
  email: string
  phone: string | null
  employee_number: string
  role: string
  hire_date: string
  is_active: boolean
  position?: string | null
  department: {
    id: string
    name: string
  } | null
}

interface Department {
  id: string
  name: string
}

export function EnhancedEmployeesList({
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
  const [selectedRole, setSelectedRole] = useState<string>("all")
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
      console.error("Error deleting employee:", error)
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "manager":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "supervisor":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "employee":
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDept = selectedDept === "all" || emp.department?.id === selectedDept
    const matchesRole = selectedRole === "all" || emp.role === selectedRole

    return matchesSearch && matchesDept && matchesRole
  })

  if (employees.length === 0) {
    return (
      <Card className="border-violet-100">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">لا يوجد موظفون</p>
          <p className="text-sm text-muted-foreground mb-4">ابدأ بإضافة موظف جديد</p>
          {canEdit && (
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
      {/* البحث والفلاتر */}
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
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="جميع الأدوار" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                <SelectItem value="manager">مدير</SelectItem>
                <SelectItem value="supervisor">مشرف</SelectItem>
                <SelectItem value="employee">موظف</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* النتائج */}
      {filteredEmployees.length === 0 ? (
        <Card className="border-violet-100">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لم يتم العثور على نتائج</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((emp) => (
            <Card 
              key={emp.id} 
              className="group border-2 border-violet-100 hover:border-violet-300 hover:shadow-xl transition-all duration-300"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-[var(--foreground)] truncate">
                      {emp.full_name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span 
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs font-medium",
                          getRoleBadge(emp.role)
                        )}
                      >
                        {getRoleName(emp.role)}
                      </span>
                      {!emp.is_active && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          غير نشط
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[var(--neutral-500)]">
                    <Badge className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{emp.employee_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--neutral-500)]">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-[var(--neutral-500)]">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                  {emp.position && (
                    <div className="flex items-center gap-2 text-[var(--neutral-500)]">
                      <Star className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{emp.position}</span>
                    </div>
                  )}
                  {emp.department && (
                    <div className="flex items-center gap-2 text-[var(--neutral-500)]">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{emp.department.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[var(--neutral-500)]">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span>{new Date(emp.hire_date).toLocaleDateString("ar-SA")}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/employees/${emp.id}`} className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full bg-violet-50 border-violet-200 hover:bg-violet-100 hover:border-violet-300"
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      عرض
                    </Button>
                  </Link>
                  {canEdit && (
                    <>
                      <Link href={`/dashboard/employees/${emp.id}/edit`}>
                        <Button variant="outline" size="icon" className="bg-white">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 bg-white"
                        onClick={() => setDeleteId(emp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الموظف نهائياً. سيؤثر هذا على جميع سجلات الحضور والتقييمات المرتبطة به.
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
