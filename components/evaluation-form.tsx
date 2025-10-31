"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, ArrowRight, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Slider } from "@/components/ui/slider"

interface EvaluationFormProps {
  evaluatorId: string
  employees: any[]
  criteria: any[]
}

export function EvaluationForm({ evaluatorId, employees, criteria }: EvaluationFormProps) {
  const [employeeId, setEmployeeId] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split("T")[0])
  const [comments, setComments] = useState("")
  const [scores, setScores] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores((prev) => ({ ...prev, [criteriaId]: value }))
  }

  const calculateOverallScore = () => {
    if (criteria.length === 0) return 0

    let totalWeightedScore = 0
    let totalWeight = 0

    criteria.forEach((criterion) => {
      const score = scores[criterion.id] || 0
      totalWeightedScore += (score * criterion.weight) / 100
      totalWeight += criterion.weight
    })

    return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0
  }

  const handleSubmit = async (status: "draft" | "submitted") => {
    if (!employeeId || !periodStart || !periodEnd) {
      setError("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const overallScore = calculateOverallScore()

      // Insert evaluation
      const { data: evaluation, error: evalError } = await supabase
        .from("evaluations")
        .insert({
          employee_id: employeeId,
          evaluator_id: evaluatorId,
          evaluation_date: evaluationDate,
          period_start: periodStart,
          period_end: periodEnd,
          overall_score: overallScore,
          comments,
          status,
        })
        .select()
        .single()

      if (evalError) throw evalError

      // Insert evaluation details
      const details = criteria.map((criterion) => ({
        evaluation_id: evaluation.id,
        criteria_id: criterion.id,
        score: scores[criterion.id] || 0,
      }))

      const { error: detailsError } = await supabase.from("evaluation_details").insert(details)

      if (detailsError) throw detailsError

      router.push("/dashboard/evaluations")
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Error saving evaluation:", error)
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/evaluations">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Star className="h-8 w-8 text-violet-600" />
            تقييم جديد
          </h1>
        </div>
      </div>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle>معلومات التقييم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee">الموظف *</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.employee_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="evaluationDate">تاريخ التقييم *</Label>
              <Input
                id="evaluationDate"
                type="date"
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="periodStart">بداية الفترة *</Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodEnd">نهاية الفترة *</Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle>معايير التقييم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {criteria.length > 0 ? (
            criteria.map((criterion) => (
              <div key={criterion.id} className="space-y-3 p-4 border border-violet-100 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{criterion.name}</h4>
                    {criterion.description && (
                      <p className="text-sm text-muted-foreground mt-1">{criterion.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">الوزن: {criterion.weight}%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>الدرجة</Label>
                    <span className="text-2xl font-bold text-violet-600">{scores[criterion.id] || 0}%</span>
                  </div>
                  <Slider
                    value={[scores[criterion.id] || 0]}
                    onValueChange={(value) => handleScoreChange(criterion.id, value[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">لا توجد معايير تقييم. يرجى إضافة معايير أولاً.</p>
          )}

          {criteria.length > 0 && (
            <div className="p-4 bg-violet-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">الدرجة الإجمالية:</span>
                <span className="text-3xl font-bold text-violet-600">{calculateOverallScore().toFixed(1)}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle>ملاحظات وتعليقات</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="أضف ملاحظاتك وتعليقاتك حول أداء الموظف..."
            rows={6}
            className="text-right"
          />
        </CardContent>
      </Card>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

      <div className="flex gap-3">
        <Button
          onClick={() => handleSubmit("submitted")}
          disabled={isLoading || criteria.length === 0}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {isLoading ? "جاري الحفظ..." : "حفظ وإرسال"}
        </Button>
        <Button onClick={() => handleSubmit("draft")} disabled={isLoading || criteria.length === 0} variant="outline">
          <Save className="h-4 w-4 ml-2" />
          حفظ كمسودة
        </Button>
        <Link href="/dashboard/evaluations">
          <Button type="button" variant="outline">
            إلغاء
          </Button>
        </Link>
      </div>
    </div>
  )
}
