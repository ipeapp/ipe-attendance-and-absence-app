import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EvaluationForm } from "@/components/evaluation-form"

export default async function NewEvaluationPage() {
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

  const { data: employees } = await supabase.from("employees").select("*").eq("is_active", true).order("full_name")

  const { data: criteria } = await supabase.from("evaluation_criteria").select("*").eq("is_active", true).order("name")

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <EvaluationForm evaluatorId={employee.id} employees={employees || []} criteria={criteria || []} />
    </DashboardLayout>
  )
}
