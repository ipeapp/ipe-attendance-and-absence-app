"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Eye, Calendar, User, TrendingUp } from "lucide-react"
import Link from "next/link"

interface EvaluationsListProps {
  evaluations: any[]
  canCreate: boolean
}

export function EvaluationsList({ evaluations, canCreate }: EvaluationsListProps) {
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

  if (evaluations.length === 0) {
    return (
      <Card className="border-violet-100">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Star className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">لا توجد تقييمات بعد</p>
          {canCreate && (
            <>
              <p className="text-sm text-muted-foreground mb-4">ابدأ بإنشاء تقييم جديد</p>
              <Link href="/dashboard/evaluations/new">
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Star className="h-4 w-4 ml-2" />
                  تقييم جديد
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {evaluations.map((evaluation) => (
        <Card key={evaluation.id} className="border-violet-100 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{evaluation.employee.full_name}</h3>
                <p className="text-sm text-muted-foreground">{evaluation.employee.employee_number}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(evaluation.status)}`}>
                {getStatusText(evaluation.status)}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(evaluation.evaluation_date).toLocaleDateString("ar-SA")}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>المقيّم: {evaluation.evaluator.full_name}</span>
              </div>
              {evaluation.overall_score !== null && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                  <span className="font-medium text-violet-600">الدرجة: {evaluation.overall_score}%</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link href={`/dashboard/evaluations/${evaluation.id}`}>
                <Button variant="outline" className="w-full bg-transparent">
                  <Eye className="h-4 w-4 ml-2" />
                  عرض التفاصيل
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
