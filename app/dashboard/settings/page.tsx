import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { WorkShiftManager } from "@/components/work-shift-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Clock, Building2, Users, Bell } from "lucide-react"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!employee || employee.role !== "manager") {
    redirect("/dashboard")
  }

  // جلب فترات العمل
  const { data: shifts } = await supabase
    .from("work_shifts")
    .select("*")
    .order("start_time")

  // جلب الأقسام
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name")

  return (
    <DashboardLayout userRole={employee.role} userName={employee.full_name}>
      <div className="flex flex-col gap-8">
        {/* رأس الصفحة */}
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-[var(--foreground)]">
            <Settings className="h-8 w-8 text-[var(--brand-600)]" />
            الإعدادات
          </h1>
          <p className="mt-2 text-[var(--neutral-500)]">إدارة إعدادات النظام والفترات والإشعارات</p>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="shifts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shifts">
              <Clock className="ml-2 h-4 w-4" />
              فترات العمل
            </TabsTrigger>
            <TabsTrigger value="departments">
              <Building2 className="ml-2 h-4 w-4" />
              إعدادات الأقسام
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="ml-2 h-4 w-4" />
              الإشعارات
            </TabsTrigger>
          </TabsList>

          {/* فترات العمل */}
          <TabsContent value="shifts" className="space-y-4">
            <Card className="border-violet-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-violet-600" />
                  إدارة فترات العمل
                </CardTitle>
                <CardDescription>
                  قم بإنشاء وتعديل فترات العمل المختلفة. يمكن تخصيص فترات خاصة لكل قسم أو استخدام فترات
                  عامة لجميع الأقسام.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkShiftManager
                  shifts={shifts || []}
                  departments={departments || []}
                  canEdit={true}
                />
              </CardContent>
            </Card>

            {/* معلومات إضافية */}
            <Card className="border-blue-100 bg-blue-50">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <h3 className="font-semibold text-blue-900">ملاحظات مهمة:</h3>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>فترة السماح هي المدة الزمنية المسموح بها للتأخير قبل احتساب الموظف متأخراً</li>
                    <li>يمكن تخصيص فترات معينة لأقسام محددة أو جعلها عامة لجميع الأقسام</li>
                    <li>تعطيل الفترة لا يؤثر على السجلات السابقة ولكن يمنع استخدامها في المستقبل</li>
                    <li>يُنصح بعدم حذف الفترات المستخدمة في سجلات الحضور السابقة</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* إعدادات الأقسام */}
          <TabsContent value="departments" className="space-y-4">
            <Card className="border-violet-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-violet-600" />
                  إعدادات الأقسام
                </CardTitle>
                <CardDescription>
                  تخصيص إعدادات خاصة لكل قسم مثل طرق الحضور المسموحة والمواقع الجغرافية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments && departments.length > 0 ? (
                    departments.map((dept) => (
                      <Card key={dept.id} className="border-violet-100">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-[var(--foreground)]">{dept.name}</h3>
                              <p className="text-sm text-[var(--neutral-500)]">
                                قريباً: إعدادات متقدمة للقسم
                              </p>
                            </div>
                            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-700">
                              قيد التطوير
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Building2 className="mb-4 h-16 w-16 text-muted-foreground" />
                        <p className="text-muted-foreground">لا توجد أقسام</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* الإشعارات */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-violet-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-violet-600" />
                  إعدادات الإشعارات
                </CardTitle>
                <CardDescription>
                  إدارة الإشعارات والتنبيهات للحضور والغياب والتقييمات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Card className="border-amber-100 bg-amber-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Bell className="h-8 w-8 text-amber-600" />
                        <div>
                          <h3 className="font-semibold text-amber-900">قريباً</h3>
                          <p className="text-sm text-amber-700">
                            سيتم إضافة نظام الإشعارات في التحديثات القادمة
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
