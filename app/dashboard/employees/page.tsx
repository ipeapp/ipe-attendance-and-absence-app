import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Plus, ArrowLeft, Building2, UserCheck, UserX } from "lucide-react"
import Link from "next/link"
import { EnhancedEmployeesList } from "@/components/enhanced-employees-list"

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; department?: string }>
}) {
  const { search, department } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: employee } = await supabase.from("employees").select("*").eq("user_id", user.id).single()

  if (!employee || (employee.role !== "manager" && employee.role !== "supervisor")) {
    redirect("/dashboard")
  }

  let query = supabase.from("employees").select("*, department:departments(*)").order("full_name")

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,employee_number.ilike.%${search}%`)
  }

  if (department) {
    query = query.eq("department_id", department)
  }

  const { data: employees } = await query

  const { data: departments } = await supabase.from("departments").select("*").order("name")

  // إحصائيات
  const totalEmployees = employees?.length || 0
  const activeEmployees = employees?.filter((e) => e.is_active).length || 0
  const inactiveEmployees = totalEmployees - activeEmployees
  const managers = employees?.filter((e) => e.role === "manager").length || 0
  const supervisors = employees?.filter((e) => e.role === "supervisor").length || 0
  const regularEmployees = employees?.filter((e) => e.role === "employee").length || 0

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="space-y-6">
        <div>
          <Link
            href={employee.role === "manager" ? "/dashboard/manager" : "/dashboard/supervisor"}
            className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--brand-600)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة إلى لوحة التحكم
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users className="h-8 w-8 text-violet-600" />
                إدارة الموظفين
              </h1>
              <p className="text-muted-foreground mt-1">إضافة وتعديل وحذف الموظفين</p>
            </div>
            {employee.role === "manager" && (
              <Link href="/dashboard/employees/new">
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة موظف جديد
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 text-violet-600 mx-auto mb-2" />
                <p className="text-sm text-[var(--neutral-500)]">إجمالي الموظفين</p>
                <p className="mt-1 text-3xl font-bold text-violet-600">{totalEmployees}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-[var(--neutral-500)]">نشط</p>
                <p className="mt-1 text-3xl font-bold text-green-600">{activeEmployees}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-[var(--neutral-500)]">مشرفون</p>
                <p className="mt-1 text-3xl font-bold text-blue-600">{supervisors}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <p className="text-sm text-[var(--neutral-500)]">موظفون</p>
                <p className="mt-1 text-3xl font-bold text-amber-600">{regularEmployees}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <UserX className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-[var(--neutral-500)]">غير نشط</p>
                <p className="mt-1 text-3xl font-bold text-gray-600">{inactiveEmployees}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <EnhancedEmployeesList
          employees={employees || []}
          departments={departments || []}
          canEdit={employee.role === "manager"}
        />
      </div>
    </DashboardLayout>
  )
}
