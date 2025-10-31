import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ArrowRight, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function EvaluationDetailPage({
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

  if (!employee) {
    redirect("/dashboard")
  }

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select(`
      *,
      employee:employees!evaluations_employee_id_fkey(full_name, employee_number, email),
      evaluator:employees!evaluations_evaluator_id_fkey(full_name)
    `)
    .eq("id", id)
    .single()

  if (!evaluation) {
    redirect("/dashboard/evaluations")
  }

  const { data: details } = await supabase
    .from("evaluation_details")
    .select("*, criteria:evaluation_criteria(*)")
    .eq("evaluation_id", id)
    .order("created_at")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700"
      case "submitted":
        return "bg-blue-100 text-blue-700"
      case "draft":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "معتمد"
      case "submitted":
        return "مقدم"
      case "draft":
        return "مسودة"
      default:
        return status
    }
  }

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/evaluations">
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Star className="h-8 w-8 text-violet-600" />
              تفاصيل التقييم
            </h1>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(evaluation.status)}`}>
            {getStatusText(evaluation.status)}
          </span>
        </div>

        <Card className="border-violet-100">
          <CardHeader>
            <CardTitle>معلومات التقييم</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">الموظف</p>
                <p className="font-medium">{evaluation.employee.full_name}</p>
                <p className="text-sm text-muted-foreground">{evaluation.employee.employee_number}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">المقيّم</p>
                <p className="font-medium">{evaluation.evaluator.full_name}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  تاريخ التقييم
                </p>
                <p className="font-medium">{new Date(evaluation.evaluation_date).toLocaleDateString("ar-SA")}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">بداية الفترة</p>
                <p className="font-medium">{new Date(evaluation.period_start).toLocaleDateString("ar-SA")}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">نهاية الفترة</p>
                <p className="font-medium">{new Date(evaluation.period_end).toLocaleDateString("ar-SA")}</p>
              </div>
            </div>

            {evaluation.overall_score !== null && (
              <div className="p-6 bg-violet-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-violet-600" />
                    <span className="text-lg font-medium">الدرجة الإجمالية</span>
                  </div>
                  <span className="text-4xl font-bold text-violet-600">{evaluation.overall_score.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-violet-100">
          <CardHeader>
            <CardTitle>تفاصيل المعايير</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {details && details.length > 0 ? (
              details.map((detail: any) => (
                <div key={detail.id} className="p-4 border border-violet-100 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{detail.criteria.name}</h4>
                      {detail.criteria.description && (
                        <p className="text-sm text-muted-foreground mt-1">{detail.criteria.description}</p>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-violet-600">{detail.score}%</p>
                      <p className="text-xs text-muted-foreground">الوزن: {detail.criteria.weight}%</p>
                    </div>
                  </div>
                  {detail.notes && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                      <p className="text-muted-foreground">{detail.notes}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">لا توجد تفاصيل للتقييم</p>
            )}
          </CardContent>
        </Card>

        {evaluation.comments && (
          <Card className="border-violet-100">
            <CardHeader>
              <CardTitle>ملاحظات وتعليقات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{evaluation.comments}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
