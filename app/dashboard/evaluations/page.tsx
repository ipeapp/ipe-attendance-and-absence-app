import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Star, Plus } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EvaluationsList } from "@/components/evaluations-list"
import { EvaluationCriteriaList } from "@/components/evaluation-criteria-list"

export default async function EvaluationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: employee } = await supabase.from("employees").select("*").eq("user_id", user.id).single()

  if (!employee) {
    redirect("/dashboard")
  }

  // Get evaluations
  let evaluationsQuery = supabase
    .from("evaluations")
    .select(
      "*, employee:employees!evaluations_employee_id_fkey(full_name, employee_number), evaluator:employees!evaluations_evaluator_id_fkey(full_name)",
    )
    .order("evaluation_date", { ascending: false })

  if (employee.role === "employee") {
    evaluationsQuery = evaluationsQuery.eq("employee_id", employee.id)
  }

  const { data: evaluations } = await evaluationsQuery

  // Get evaluation criteria
  const { data: criteria } = await supabase
    .from("evaluation_criteria")
    .select("*, department:departments(name)")
    .eq("is_active", true)
    .order("name")

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Star className="h-8 w-8 text-violet-600" />
              التقييمات
            </h1>
            <p className="text-muted-foreground mt-1">إدارة تقييمات الموظفين ومعايير الأداء</p>
          </div>
          {(employee.role === "manager" || employee.role === "supervisor") && (
            <Link href="/dashboard/evaluations/new">
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="h-4 w-4 ml-2" />
                تقييم جديد
              </Button>
            </Link>
          )}
        </div>

        <Tabs defaultValue="evaluations" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="evaluations">التقييمات</TabsTrigger>
            {employee.role === "manager" && <TabsTrigger value="criteria">المعايير</TabsTrigger>}
          </TabsList>

          <TabsContent value="evaluations">
            <EvaluationsList
              evaluations={evaluations || []}
              canCreate={employee.role === "manager" || employee.role === "supervisor"}
            />
          </TabsContent>

          {employee.role === "manager" && (
            <TabsContent value="criteria">
              <EvaluationCriteriaList criteria={criteria || []} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
