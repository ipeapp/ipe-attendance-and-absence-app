import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DepartmentForm } from "@/components/department-form"

export default async function EditDepartmentPage({
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

  const { data: employee } = await supabase.from("employees").select("*").eq("user_id", user.id).single()

  if (!employee || employee.role !== "manager") {
    redirect("/dashboard")
  }

  const { data: department } = await supabase.from("departments").select("*").eq("id", id).single()

  if (!department) {
    redirect("/dashboard/departments")
  }

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <DepartmentForm department={department} />
    </DashboardLayout>
  )
}
