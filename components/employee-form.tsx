"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Users, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface EmployeeFormProps {
  employee?: {
    id: string
    full_name: string
    email: string
    phone: string | null
    employee_number: string
    role: string
    department_id: string | null
    hire_date: string
    is_active: boolean
  }
  departments: Array<{ id: string; name: string }>
}

export function EmployeeForm({ employee, departments }: EmployeeFormProps) {
  const [fullName, setFullName] = useState(employee?.full_name || "")
  const [email, setEmail] = useState(employee?.email || "")
  const [phone, setPhone] = useState(employee?.phone || "")
  const [employeeNumber, setEmployeeNumber] = useState(employee?.employee_number || "")
  const [role, setRole] = useState(employee?.role || "employee")
  const [departmentId, setDepartmentId] = useState(employee?.department_id || "none")
  const [hireDate, setHireDate] = useState(employee?.hire_date || "")
  const [isActive, setIsActive] = useState(employee?.is_active ?? true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const data = {
        full_name: fullName,
        email,
        phone: phone || null,
        employee_number: employeeNumber,
        role,
        department_id: departmentId === "none" ? null : departmentId,
        hire_date: hireDate,
        is_active: isActive,
      }

      if (employee) {
        const { error } = await supabase.from("employees").update(data).eq("id", employee.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("employees").insert(data)

        if (error) throw error
      }

      router.push("/dashboard/employees")
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Error saving employee:", error)
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/employees">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-violet-600" />
            {employee ? "تعديل الموظف" : "إضافة موظف جديد"}
          </h1>
        </div>
      </div>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle>معلومات الموظف</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="أحمد محمد"
                  required
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeNumber">رقم الموظف *</Label>
                <Input
                  id="employeeNumber"
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  placeholder="EMP001"
                  required
                  className="text-right"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@company.com"
                  required
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+967 777 123 456"
                  className="text-right"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">الدور الوظيفي *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">موظف</SelectItem>
                    <SelectItem value="supervisor">مشرف</SelectItem>
                    <SelectItem value="manager">مدير</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">القسم</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون قسم</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hireDate">تاريخ التعيين *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between space-x-2 pt-8">
                <Label htmlFor="isActive">الموظف نشط</Label>
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

            <div className="flex gap-3">
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isLoading}>
                {isLoading ? "جاري الحفظ..." : employee ? "حفظ التعديلات" : "إضافة الموظف"}
              </Button>
              <Link href="/dashboard/employees">
                <Button type="button" variant="outline">
                  إلغاء
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
