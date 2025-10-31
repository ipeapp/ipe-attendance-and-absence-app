"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface DepartmentFormProps {
  department?: {
    id: string
    name: string
    description: string | null
  }
}

export function DepartmentForm({ department }: DepartmentFormProps) {
  const [name, setName] = useState(department?.name || "")
  const [description, setDescription] = useState(department?.description || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (department) {
        const { error } = await supabase.from("departments").update({ name, description }).eq("id", department.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("departments").insert({ name, description })

        if (error) throw error
      }

      router.push("/dashboard/departments")
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Error saving department:", error)
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء الحفظ")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/departments">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-violet-600" />
            {department ? "تعديل القسم" : "إضافة قسم جديد"}
          </h1>
        </div>
      </div>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle>معلومات القسم</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم القسم *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: قسم المبيعات"
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
                placeholder="وصف مختصر عن القسم..."
                rows={4}
                className="text-right"
              />
            </div>

            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

            <div className="flex gap-3">
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700" disabled={isLoading}>
                {isLoading ? "جاري الحفظ..." : department ? "حفظ التعديلات" : "إضافة القسم"}
              </Button>
              <Link href="/dashboard/departments">
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
