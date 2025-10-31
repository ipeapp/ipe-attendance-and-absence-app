"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { FileSpreadsheet, FileText } from "lucide-react"
import { useState } from "react"

interface EmployeeReportProps {
  employees: any[]
  departments: any[]
}

export function EmployeeReport({ employees, departments }: EmployeeReportProps) {
  const [selectedDept, setSelectedDept] = useState("all")

  const filteredEmployees =
    selectedDept === "all" ? employees : employees.filter((emp) => emp.department_id === selectedDept)

  const exportToCSV = () => {
    const headers = ["الاسم الكامل", "رقم الموظف", "البريد الإلكتروني", "القسم"]
    const rows = filteredEmployees.map((emp) => [
      emp.full_name,
      emp.employee_number,
      emp.email || "-",
      departments.find((d) => d.id === emp.department_id)?.name || "-",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `تقرير_الموظفين_${new Date().toISOString().split("T")[0]}.csv`
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
        <title>تقرير الموظفين</title>
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
          <h2>تقرير الموظفين</h2>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-SA")}</p>
          <p>إجمالي الموظفين: ${filteredEmployees.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم الكامل</th>
              <th>رقم الموظف</th>
              <th>القسم</th>
            </tr>
          </thead>
          <tbody>
            ${filteredEmployees
              .map(
                (emp, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${emp.full_name}</td>
                <td>${emp.employee_number}</td>
                <td>${departments.find((d) => d.id === emp.department_id)?.name || "-"}</td>
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
          <span>تقرير الموظفين</span>
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
        <div className="space-y-2">
          <Label>تصفية حسب القسم</Label>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="max-w-xs">
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

        <div className="border border-violet-100 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-violet-50">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-medium">#</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الاسم</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">رقم الموظف</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">القسم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp, index) => (
                    <tr key={emp.id} className="hover:bg-violet-50/50">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">{emp.full_name}</td>
                      <td className="px-4 py-3 text-sm">{emp.employee_number}</td>
                      <td className="px-4 py-3 text-sm">
                        {departments.find((d) => d.id === emp.department_id)?.name || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      لا توجد بيانات للعرض
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">إجمالي الموظفين: {filteredEmployees.length}</div>
      </CardContent>
    </Card>
  )
}
