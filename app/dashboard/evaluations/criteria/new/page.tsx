import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CriteriaForm } from "@/components/criteria-form"

export default async function NewCriteriaPage() {
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

  const { data: departments } = await supabase.from("departments").select("*").order("name")

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <CriteriaForm departments={departments || []} />
    </DashboardLayout>
  )
}
