"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, Save, X, Plus, Trash2, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Criteria {
  id: string
  name: string
  description: string | null
  weight: number
}

interface Employee {
  id: string
  full_name: string
  employee_number: string
}

interface EnhancedEvaluationFormProps {
  employees: Employee[]
  criteria: Criteria[]
  evaluatorId: string
  preSelectedEmployeeId?: string
}

interface CriteriaScore {
  criteria_id: string
  score: number
  notes: string
}

export function EnhancedEvaluationForm({
  employees,
  criteria,
  evaluatorId,
  preSelectedEmployeeId,
}: EnhancedEvaluationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(preSelectedEmployeeId || "")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [comments, setComments] = useState("")
  const [status, setStatus] = useState<"draft" | "submitted">("submitted")
  
  const [criteriaScores, setCriteriaScores] = useState<CriteriaScore[]>(
    criteria.map((c) => ({
      criteria_id: c.id,
      score: 75,
      notes: "",
    }))
  )

  const router = useRouter()
  const supabase = createClient()

  const handleScoreChange = (criteriaId: string, score: number) => {
    setCriteriaScores((prev) =>
      prev.map((cs) => (cs.criteria_id === criteriaId ? { ...cs, score } : cs))
    )
  }

  const handleNotesChange = (criteriaId: string, notes: string) => {
    setCriteriaScores((prev) =>
      prev.map((cs) => (cs.criteria_id === criteriaId ? { ...cs, notes } : cs))
    )
  }

  const calculateOverallScore = () => {
    if (criteria.length === 0) return 0
    
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)
    if (totalWeight === 0) return 0

    const weightedSum = criteriaScores.reduce((sum, cs) => {
      const criterion = criteria.find((c) => c.id === cs.criteria_id)
      if (!criterion) return sum
      return sum + (cs.score * criterion.weight)
    }, 0)

    return Math.round(weightedSum / totalWeight)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 75) return "text-blue-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "ممتاز"
    if (score >= 75) return "جيد جداً"
    if (score >= 60) return "جيد"
    return "يحتاج تحسين"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEmployee || !periodStart || !periodEnd) {
      alert("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    if (new Date(periodStart) > new Date(periodEnd)) {
      alert("تاريخ بداية الفترة يجب أن يكون قبل تاريخ النهاية")
      return
    }

    setIsLoading(true)
    try {
      const overallScore = calculateOverallScore()

      // Create evaluation
      const { data: evaluation, error: evalError } = await supabase
        .from("evaluations")
        .insert({
          employee_id: selectedEmployee,
          evaluator_id: evaluatorId,
          evaluation_date: new Date().toISOString().split("T")[0],
          period_start: periodStart,
          period_end: periodEnd,
          overall_score: overallScore,
          comments: comments || null,
          status,
        })
        .select()
        .single()

      if (evalError) throw evalError

      // Create evaluation details
      const details = criteriaScores.map((cs) => ({
        evaluation_id: evaluation.id,
        criteria_id: cs.criteria_id,
        score: cs.score,
        notes: cs.notes || null,
      }))

      const { error: detailsError } = await supabase.from("evaluation_details").insert(details)

      if (detailsError) throw detailsError

      alert("تم حفظ التقييم بنجاح")
      router.push("/dashboard/evaluations")
      router.refresh()
    } catch (error) {
      console.error("Error saving evaluation:", error)
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء حفظ التقييم")
    } finally {
      setIsLoading(false)
    }
  }

  const overallScore = calculateOverallScore()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-violet-600" />
            معلومات التقييم الأساسية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee">الموظف *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee} required>
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
              <Label htmlFor="status">حالة التقييم *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "draft" | "submitted")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="submitted">قيد المراجعة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period_start">تاريخ بداية الفترة *</Label>
              <Input
                id="period_start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period_end">تاريخ نهاية الفترة *</Label>
              <Input
                id="period_end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Score Preview */}
      <Card className={cn("border-2", overallScore >= 75 ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50")}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--neutral-600)]">الدرجة الإجمالية</p>
              <p className="text-xs text-[var(--neutral-500)]">محسوبة تلقائياً بناءً على الأوزان</p>
            </div>
            <div className="text-center">
              <p className={cn("text-5xl font-bold", getScoreColor(overallScore))}>
                {overallScore}
              </p>
              <p className="text-sm font-medium text-[var(--neutral-600)]">{getScoreLabel(overallScore)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Criteria Scores */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">معايير التقييم</h3>
        {criteria.length === 0 ? (
          <Card className="border-amber-100 bg-amber-50">
            <CardContent className="py-12 text-center">
              <p className="text-amber-700">لا توجد معايير تقييم متاحة</p>
              <p className="mt-2 text-sm text-amber-600">يرجى إضافة معايير التقييم أولاً</p>
            </CardContent>
          </Card>
        ) : (
          criteria.map((criterion) => {
            const score = criteriaScores.find((cs) => cs.criteria_id === criterion.id)?.score || 0
            const notes = criteriaScores.find((cs) => cs.criteria_id === criterion.id)?.notes || ""

            return (
              <Card key={criterion.id} className="border-violet-100">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[var(--foreground)]">{criterion.name}</h4>
                      {criterion.description && (
                        <p className="text-sm text-[var(--neutral-500)] mt-1">{criterion.description}</p>
                      )}
                      <p className="text-xs text-[var(--neutral-400)] mt-1">الوزن: {criterion.weight}%</p>
                    </div>
                    <div className="text-center ml-4">
                      <p className={cn("text-3xl font-bold", getScoreColor(score))}>
                        {score}
                      </p>
                      <p className="text-xs text-[var(--neutral-500)]">من 100</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[var(--neutral-600)] min-w-[60px]">0</span>
                      <Slider
                        value={[score]}
                        onValueChange={(value) => handleScoreChange(criterion.id, value[0])}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-sm text-[var(--neutral-600)] min-w-[60px] text-right">100</span>
                    </div>
                    <div className="flex justify-between text-xs text-[var(--neutral-500)]">
                      <span>ضعيف</span>
                      <span>مقبول</span>
                      <span>جيد</span>
                      <span>ممتاز</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${criterion.id}`}>ملاحظات (اختياري)</Label>
                    <Textarea
                      id={`notes-${criterion.id}`}
                      value={notes}
                      onChange={(e) => handleNotesChange(criterion.id, e.target.value)}
                      placeholder="أضف ملاحظات حول هذا المعيار..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* General Comments */}
      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle>التعليقات العامة</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="أضف تعليقات عامة على أداء الموظف خلال الفترة..."
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isLoading || criteria.length === 0}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Save className="ml-2 h-4 w-4" />
          {isLoading ? "جاري الحفظ..." : "حفظ التقييم"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          <X className="ml-2 h-4 w-4" />
          إلغاء
        </Button>
      </div>
    </form>
  )
}
