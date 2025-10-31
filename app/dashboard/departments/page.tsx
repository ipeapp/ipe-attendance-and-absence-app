import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Building2, Plus } from "lucide-react"
import Link from "next/link"
import { DepartmentsList } from "@/components/departments-list"

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

        <DepartmentsList departments={departments || []} />
      </div>
    </DashboardLayout>
  )
}
