"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, FileSpreadsheet, FileText } from "lucide-react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface EvaluationReportProps {
  data: any[]
  departments: any[]
  employees: any[]
  startDate: string
  endDate: string
}

export function EvaluationReport({ data, departments, employees, startDate, endDate }: EvaluationReportProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate)
  const [localEndDate, setLocalEndDate] = useState(endDate)
  const [selectedDept, setSelectedDept] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams)
    params.set("startDate", localStartDate)
    params.set("endDate", localEndDate)
    if (selectedDept !== "all") {
      params.set("department", selectedDept)
    } else {
      params.delete("department")
    }
    if (selectedEmployee !== "all") {
      params.set("employee", selectedEmployee)
    } else {
      params.delete("employee")
    }
    router.push(`/dashboard/reports?${params.toString()}`)
  }

  const exportToCSV = () => {
    const headers = ["التاريخ", "الموظف", "رقم الموظف", "المقيّم", "الدرجة الإجمالية", "الحالة"]
    const rows = data.map((evaluation) => [
      evaluation.evaluation_date,
      evaluation.employee.full_name,
      evaluation.employee.employee_number,
      evaluation.evaluator.full_name,
      evaluation.overall_score?.toFixed(1) || "-",
      evaluation.status === "approved" ? "معتمد" : evaluation.status === "submitted" ? "مقدم" : "مسودة",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `تقرير_التقييمات_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  const exportToPrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير التقييمات</title>
        <style>
          body { font-family: 'Cairo', Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; }
          .header h1 { color: #8b5cf6; margin: 0; }
          .header p { color: #666; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
          th { background-color: #8b5cf6; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>خبراء العطور الدولية</h1>
          <h2>تقرير التقييمات</h2>
          <p>من ${new Date(localStartDate).toLocaleDateString("ar-SA")} إلى ${new Date(localEndDate).toLocaleDateString("ar-SA")}</p>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-SA")}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الموظف</th>
              <th>رقم الموظف</th>
              <th>المقيّم</th>
              <th>الدرجة</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (evaluation) => `
              <tr>
                <td>${new Date(evaluation.evaluation_date).toLocaleDateString("ar-SA")}</td>
                <td>${evaluation.employee.full_name}</td>
                <td>${evaluation.employee.employee_number}</td>
                <td>${evaluation.evaluator.full_name}</td>
                <td>${evaluation.overall_score?.toFixed(1) || "-"}%</td>
                <td>${evaluation.status === "approved" ? "معتمد" : evaluation.status === "submitted" ? "مقدم" : "مسودة"}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>تطوير الولي سوفت - alwalisoftt@gmail.com - +967777670507</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <Card className="border-violet-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>تقرير التقييمات</span>
          <div className="flex gap-2">
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-700 bg-transparent"
            >
              <FileSpreadsheet className="h-4 w-4 ml-2" />
              تصدير Excel
            </Button>
            <Button
              onClick={exportToPrint}
              variant="outline"
              size="sm"
              className="text-violet-600 hover:text-violet-700 bg-transparent"
            >
              <FileText className="h-4 w-4 ml-2" />
              طباعة PDF
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>من تاريخ</Label>
            <Input type="date" value={localStartDate} onChange={(e) => setLocalStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>إلى تاريخ</Label>
            <Input type="date" value={localEndDate} onChange={(e) => setLocalEndDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>القسم</Label>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الأقسام" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>الموظف</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="جميع الموظفين" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الموظفين</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleFilter} className="bg-violet-600 hover:bg-violet-700">
          <Filter className="h-4 w-4 ml-2" />
          تطبيق الفلاتر
        </Button>

        {/* Data Table */}
        <div className="border border-violet-100 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-violet-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium">التاريخ</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الموظف</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">المقيّم</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الفترة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الدرجة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100">
                {data.length > 0 ? (
                  data.map((evaluation) => (
                    <tr key={evaluation.id} className="hover:bg-violet-50/50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(evaluation.evaluation_date).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{evaluation.employee.full_name}</p>
                          <p className="text-muted-foreground text-xs">{evaluation.employee.employee_number}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{evaluation.evaluator.full_name}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(evaluation.period_start).toLocaleDateString("ar-SA")} -{" "}
                        {new Date(evaluation.period_end).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-bold text-violet-600">
                          {evaluation.overall_score?.toFixed(1) || "-"}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            evaluation.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : evaluation.status === "submitted"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {evaluation.status === "approved" && "معتمد"}
                          {evaluation.status === "submitted" && "مقدم"}
                          {evaluation.status === "draft" && "مسودة"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      لا توجد بيانات للعرض
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
