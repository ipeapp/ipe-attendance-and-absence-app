import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EmployeeForm } from "@/components/employee-form"

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: currentEmployee } = await supabase.from("employees").select("*").eq("user_id", user.id).single()

  if (!currentEmployee || currentEmployee.role !== "manager") {
    redirect("/dashboard")
  }

  const { data: employee } = await supabase.from("employees").select("*").eq("id", id).single()

  if (!employee) {
    redirect("/dashboard/employees")
  }

  const { data: departments } = await supabase.from("departments").select("*").order("name")

  return (
    <DashboardLayout userRole={currentEmployee.role} userName={currentEmployee.full_name}>
      <EmployeeForm employee={employee} departments={departments || []} />
    </DashboardLayout>
  )
}
