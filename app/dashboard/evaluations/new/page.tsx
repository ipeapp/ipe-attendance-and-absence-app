import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EnhancedEvaluationForm } from "@/components/enhanced-evaluation-form"
import { Card, CardContent } from "@/components/ui/card"
import { Star, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function NewEvaluationPage({
  searchParams,
}: {
  searchParams: Promise<{ employee_id?: string }>
}) {
  const { employee_id } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: currentEmployee } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!currentEmployee || (currentEmployee.role !== "manager" && currentEmployee.role !== "supervisor")) {
    redirect("/dashboard")
  }

  // Get employees that can be evaluated
  let employeesQuery = supabase
    .from("employees")
    .select("id, full_name, employee_number, department_id")
    .eq("is_active", true)
    .neq("id", currentEmployee.id) // Don't include the evaluator

  // If supervisor, only show employees from their department
  if (currentEmployee.role === "supervisor" && currentEmployee.department_id) {
    employeesQuery = employeesQuery.eq("department_id", currentEmployee.department_id)
  }

  const { data: employees } = await employeesQuery.order("full_name")

  // Get evaluation criteria
  const { data: criteria } = await supabase
    .from("evaluation_criteria")
    .select("*")
    .eq("is_active", true)
    .order("name")

  return (
    <DashboardLayout userRole={currentEmployee.role} userName={currentEmployee.full_name}>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <Link
            href="/dashboard/evaluations"
            className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--brand-600)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            ?????? ??? ?????????
          </Link>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-[var(--foreground)]">
            <Star className="h-8 w-8 text-[var(--brand-600)]" />
            ????? ????
          </h1>
          <p className="mt-2 text-[var(--neutral-500)]">?? ?????? ???? ?????? ???? ????</p>
        </div>

        {/* Instructions */}
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-blue-900">
                <p className="font-semibold">??????? ???????:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>?? ?????? ?? ????? ?????? ????? ??? ???? ?????? ???? ?????? ???????</li>
                  <li>?????? ????????? ??? ?????? ???????? ????? ??? ????? ????????</li>
                  <li>????? ??? ??????? ?????? ?????? ???? ??????</li>
                  <li>??? ??????? ??????? ??? ????? ??????? ?????? ??? ???????</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        {!employees || employees.length === 0 ? (
          <Card className="border-amber-100 bg-amber-50">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-amber-900">?? ???? ?????? ?????? ???????</p>
              <p className="mt-2 text-sm text-amber-700">
                {currentEmployee.role === "supervisor"
                  ? "?? ???? ?????? ?? ????"
                  : "?? ???? ?????? ????? ?? ??????"}
              </p>
            </CardContent>
          </Card>
        ) : !criteria || criteria.length === 0 ? (
          <Card className="border-amber-100 bg-amber-50">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-16 w-16 text-amber-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-amber-900">?? ???? ?????? ?????</p>
              <p className="mt-2 text-sm text-amber-700">
                ???? ????? ?????? ??????? ????? ?? ???? ?????????
              </p>
              <Link href="/dashboard/evaluations/criteria" className="mt-4 inline-block">
                <button className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
                  ????? ?????? ???????
                </button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <EnhancedEvaluationForm
            employees={employees}
            criteria={criteria}
            evaluatorId={currentEmployee.id}
            preSelectedEmployeeId={employee_id}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
