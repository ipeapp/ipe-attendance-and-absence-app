"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, FileSpreadsheet, FileText } from "lucide-react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface AttendanceReportProps {
  data: any[]
  departments: any[]
  employees: any[]
  startDate: string
  endDate: string
}

export function AttendanceReport({ data, departments, employees, startDate, endDate }: AttendanceReportProps) {
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
    const headers = [
      "التاريخ",
      "الموظف",
      "رقم الموظف",
      "الفترة",
      "الحالة",
      "وقت الحضور",
      "وقت الانصراف",
      "التأخير (دقيقة)",
    ]
    const rows = data.map((record) => [
      record.date,
      record.employee.full_name,
      record.employee.employee_number,
      record.shift?.name || "-",
      record.status === "present"
        ? "حاضر"
        : record.status === "late"
          ? "متأخر"
          : record.status === "absent"
            ? "غائب"
            : record.status,
      record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString("ar-SA") : "-",
      record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString("ar-SA") : "-",
      record.late_minutes || 0,
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `تقرير_الحضور_${new Date().toISOString().split("T")[0]}.csv`
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
        <title>تقرير الحضور والغياب</title>
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
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>خبراء العطور الدولية</h1>
          <h2>تقرير الحضور والغياب</h2>
          <p>من ${new Date(localStartDate).toLocaleDateString("ar-SA")} إلى ${new Date(localEndDate).toLocaleDateString("ar-SA")}</p>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-SA")}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الموظف</th>
              <th>رقم الموظف</th>
              <th>الفترة</th>
              <th>الحالة</th>
              <th>وقت الحضور</th>
              <th>وقت الانصراف</th>
              <th>التأخير</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (record) => `
              <tr>
                <td>${new Date(record.date).toLocaleDateString("ar-SA")}</td>
                <td>${record.employee.full_name}</td>
                <td>${record.employee.employee_number}</td>
                <td>${record.shift?.name || "-"}</td>
                <td>${record.status === "present" ? "حاضر" : record.status === "late" ? "متأخر" : record.status === "absent" ? "غائب" : record.status}</td>
                <td>${record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                <td>${record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                <td>${record.late_minutes || 0} دقيقة</td>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "text-green-600"
      case "late":
        return "text-amber-600"
      case "absent":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card className="border-violet-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>تقرير الحضور والغياب</span>
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
                  <th className="px-4 py-3 text-right text-sm font-medium">الفترة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الحضور</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الانصراف</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">التأخير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-100">
                {data.length > 0 ? (
                  data.map((record) => (
                    <tr key={record.id} className="hover:bg-violet-50/50">
                      <td className="px-4 py-3 text-sm">{new Date(record.date).toLocaleDateString("ar-SA")}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">{record.employee.full_name}</p>
                          <p className="text-muted-foreground text-xs">{record.employee.employee_number}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{record.shift?.name || "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`font-medium ${getStatusColor(record.status)}`}>
                          {record.status === "present" && "حاضر"}
                          {record.status === "late" && "متأخر"}
                          {record.status === "absent" && "غائب"}
                          {record.status === "half_day" && "نصف يوم"}
                          {record.status === "excused" && "إجازة"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {record.check_in_time
                          ? new Date(record.check_in_time).toLocaleTimeString("ar-SA", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {record.check_out_time
                          ? new Date(record.check_out_time).toLocaleTimeString("ar-SA", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {record.late_minutes > 0 ? (
                          <span className="text-amber-600 font-medium">{record.late_minutes} دقيقة</span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
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
