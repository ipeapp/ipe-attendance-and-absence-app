"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface CriteriaFormProps {
  departments: any[]
  criteria?: any
}

export function CriteriaForm({ departments, criteria }: CriteriaFormProps) {
  const [name, setName] = useState(criteria?.name || "")
  const [description, setDescription] = useState(criteria?.description || "")
  const [weight, setWeight] = useState(criteria?.weight?.toString() || "")
  const [departmentId, setDepartmentId] = useState(criteria?.department_id || "none")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const data = {
        name,
        description: description || null,
        weight: Number.parseFloat(weight),
        department_id: departmentId === "none" ? null : departmentId,
        is_active: true,
      }

      if (criteria) {
        const { error } = await supabase.from("evaluation_criteria").update(data).eq("id", criteria.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("evaluation_criteria").insert(data)

        if (error) throw error
      }

      router.push("/dashboard/evaluations")
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Error saving criteria:", error)
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/evaluations">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Star className="h-8 w-8 text-violet-600" />
            {criteria ? "تعديل معيار التقييم" : "إضافة معيار تقييم"}
          </h1>
        </div>
      </div>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle>معلومات المعيار</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المعيار *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: الالتزام بالحضور"
                required
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر عن المعيار..."
                rows={3}
                className="text-right"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="weight">الوزن (%) *</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="25"
                  required
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">القسم</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأقسام" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">جميع الأقسام</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

            <div className="flex gap-3">
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isLoading}>
                {isLoading ? "جاري الحفظ..." : criteria ? "حفظ التعديلات" : "إضافة المعيار"}
              </Button>
              <Link href="/dashboard/evaluations">
                <Button type="button" variant="outline">
                  إلغاء
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
