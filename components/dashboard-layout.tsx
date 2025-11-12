"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardCheck,
  Star,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole?: string
  userName?: string
}

const navigationItems = [
  {
    title: "لوحة التحكم",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["manager", "supervisor", "employee"],
  },
  {
    title: "الأقسام",
    href: "/dashboard/departments",
    icon: Building2,
    roles: ["manager"],
  },
  {
    title: "الموظفين",
    href: "/dashboard/employees",
    icon: Users,
    roles: ["manager", "supervisor"],
  },
  {
    title: "الحضور والغياب",
    href: "/dashboard/attendance",
    icon: ClipboardCheck,
    roles: ["manager", "supervisor", "employee"],
  },
  {
    title: "التقييمات",
    href: "/dashboard/evaluations",
    icon: Star,
    roles: ["manager", "supervisor", "employee"],
  },
  {
    title: "التقارير",
    href: "/dashboard/reports",
    icon: FileText,
    roles: ["manager", "supervisor"],
  },
  {
    title: "الإعدادات",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["manager"],
  },
]

export function DashboardLayout({ children, userRole = "employee", userName }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const filteredNavigation = navigationItems.filter((item) => item.roles.includes(userRole))

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 right-0 left-0 z-50 bg-white border-b border-violet-100 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <img src="/ipe-logo.png" alt="IPE Logo" className="h-8" />
          <div className="w-10" />
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-40 h-screen w-64 bg-white border-l border-violet-100 shadow-lg transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-violet-100">
            <div className="flex justify-center mb-4">
              <img src="/ipe-logo.png" alt="IPE Logo" className="h-20 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground text-center">نظام الحضور والغياب</p>
          </div>

          {/* User Info */}
          {userName && (
            <div className="p-4 border-b border-violet-100 bg-violet-50">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {userRole === "manager" && "مدير"}
                {userRole === "supervisor" && "مشرف"}
                {userRole === "employee" && "موظف"}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-violet-100 text-violet-700 font-medium"
                      : "text-muted-foreground hover:bg-violet-50 hover:text-violet-600",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-violet-100">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 ml-2" />
              تسجيل الخروج
            </Button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-violet-100 bg-muted/30">
            <p className="text-xs text-center text-muted-foreground">تطوير الولي سوفت</p>
            <p className="text-xs text-center text-muted-foreground mt-1">+967777670507</p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="lg:mr-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
