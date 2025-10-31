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
    <div className="relative min-h-screen text-foreground">
      {/* Mobile Header */}
      <div className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-surface/90 px-4 py-3 shadow-[var(--shadow-xs)] backdrop-blur lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-full"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <div className="flex items-center gap-2">
          <img src="/ipe-logo.png" alt="IPE Logo" className="h-8 w-auto" />
          <span className="text-sm font-semibold text-[var(--neutral-600)]">نظام الموارد البشرية</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-40 flex h-screen w-64 flex-col border-l border-[var(--sidebar-border)] bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shadow-[var(--shadow-md)] backdrop-blur transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4 border-b border-white/10 px-6 pb-8 pt-12">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--sidebar-accent)] text-2xl font-semibold text-[var(--sidebar-primary-foreground)] shadow-[var(--shadow-sm)]">
              HR
            </span>
            <p className="text-sm text-white/70">نظام الحضور وإدارة المواهب</p>
          </div>

          {/* User Info */}
          {userName && (
            <div className="border-b border-white/10 bg-[var(--sidebar-accent)]/60 px-6 py-4">
              <p className="text-sm font-medium text-[var(--sidebar-primary-foreground)]">{userName}</p>
              <p className="mt-1 text-xs text-white/70">
                {userRole === "manager" && "مدير"}
                {userRole === "supervisor" && "مشرف"}
                {userRole === "employee" && "موظف"}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all",
                    isActive
                      ? "bg-white/10 text-[var(--sidebar-primary-foreground)] shadow-[var(--shadow-xs)]"
                      : "text-white/60 hover:bg-white/5 hover:text-[var(--sidebar-primary-foreground)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 transition-colors",
                      isActive
                        ? "bg-white/15 text-[var(--sidebar-primary-foreground)]"
                        : "bg-white/5 text-white/60 group-hover:bg-white/10",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{item.title}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="border-t border-white/10 px-4 py-4">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-[var(--sidebar-primary-foreground)]"
              onClick={handleLogout}
            >
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-4 py-4 text-center text-[11px] text-white/50">
            <p>تطوير الولي سوفت</p>
            <p className="mt-1">+967777670507</p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="pt-16 lg:mr-64 lg:pt-0">
        <div className="app-shell py-10 lg:py-12">
          <div className="flex flex-col gap-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
