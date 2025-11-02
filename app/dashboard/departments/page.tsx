import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { EnhancedDepartmentsList } from "@/components/enhanced-departments-list"

export default async function DepartmentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: employee } = await supabase.from("employees").select("*").eq("user_id", user.id).single()

  if (!employee || employee.role !== "manager") {
    redirect("/dashboard")
  }

  const { data: departments } = await supabase.from("departments").select("*, employees:employees(count)").order("name")

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="space-y-6">
        <div>
          <Link
            href="/dashboard/manager"
            className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--brand-600)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة إلى لوحة التحكم
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Building2 className="h-8 w-8 text-violet-600" />
                إدارة الأقسام
              </h1>
              <p className="text-muted-foreground mt-1">إضافة وتعديل وحذف الأقسام</p>
            </div>
            <Link href="/dashboard/departments/new">
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="h-4 w-4 ml-2" />
                إضافة قسم جديد
              </Button>
            </Link>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-[var(--neutral-500)]">إجمالي الأقسام</p>
                <p className="mt-2 text-4xl font-bold text-violet-600">{departments?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-[var(--neutral-500)]">إجمالي الموظفين</p>
                <p className="mt-2 text-4xl font-bold text-blue-600">
                  {departments?.reduce((sum, dept) => sum + (dept.employees[0]?.count || 0), 0) || 0}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-[var(--neutral-500)]">متوسط الموظفين/قسم</p>
                <p className="mt-2 text-4xl font-bold text-green-600">
                  {departments && departments.length > 0
                    ? Math.round(
                        departments.reduce((sum, dept) => sum + (dept.employees[0]?.count || 0), 0) /
                          departments.length
                      )
                    : 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <EnhancedDepartmentsList departments={departments || []} />
      </div>
    </DashboardLayout>
  )
}
