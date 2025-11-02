"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataPoint {
  label: string
  value: number
  color?: string
}

interface StatsChartProps {
  title: string
  data: DataPoint[]
  type?: "bar" | "line" | "pie"
  showPercentage?: boolean
  icon?: React.ReactNode
}

export function StatsChart({ 
  title, 
  data, 
  type = "bar", 
  showPercentage = false,
  icon 
}: StatsChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value))
  const total = data.reduce((sum, d) => sum + d.value, 0)

  const defaultColors = [
    "bg-violet-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-amber-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-cyan-500",
  ]

  return (
    <Card className="border-violet-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {type === "bar" && (
          <div className="space-y-4">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0
              const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[var(--foreground)]">{item.label}</span>
                    <span className="text-[var(--neutral-500)]">
                      {item.value}
                      {showPercentage && ` (${percentage.toFixed(1)}%)`}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        item.color || defaultColors[index % defaultColors.length]
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {type === "pie" && (
          <div className="space-y-4">
            {/* Simple visual representation */}
            <div className="grid grid-cols-2 gap-4">
              {data.map((item, index) => {
                const percentage = total > 0 ? (item.value / total) * 100 : 0
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-lg p-4 text-center",
                      item.color ? item.color.replace("bg-", "bg-") + "/10" : defaultColors[index % defaultColors.length].replace("bg-", "bg-") + "/10"
                    )}
                  >
                    <p className="text-sm font-medium text-[var(--neutral-600)]">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold">{item.value}</p>
                    <p className="mt-1 text-sm text-[var(--neutral-500)]">{percentage.toFixed(1)}%</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {type === "line" && (
          <div className="space-y-6">
            <div className="relative h-48 w-full">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-xs text-[var(--neutral-500)]">
                <span>{maxValue}</span>
                <span>{Math.round(maxValue * 0.75)}</span>
                <span>{Math.round(maxValue * 0.5)}</span>
                <span>{Math.round(maxValue * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Chart area */}
              <div className="ml-8 flex h-full items-end justify-around border-b border-l border-gray-200">
                {data.map((item, index) => {
                  const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0
                  
                  return (
                    <div key={index} className="flex flex-1 items-end justify-center px-1">
                      <div className="relative w-full">
                        <div
                          className={cn(
                            "w-full rounded-t-lg transition-all duration-500",
                            item.color || defaultColors[index % defaultColors.length]
                          )}
                          style={{ height: `${height}%`, minHeight: height > 0 ? "4px" : "0" }}
                        />
                        {/* Value label */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="ml-8 flex justify-around">
              {data.map((item, index) => (
                <span key={index} className="flex-1 text-center text-xs text-[var(--neutral-500)]">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ComparisonCardProps {
  title: string
  currentValue: number
  previousValue: number
  icon?: React.ReactNode
  valueLabel?: string
}

export function ComparisonCard({
  title,
  currentValue,
  previousValue,
  icon,
  valueLabel = "",
}: ComparisonCardProps) {
  const difference = currentValue - previousValue
  const percentageChange = previousValue > 0 ? (difference / previousValue) * 100 : 0
  const isPositive = difference >= 0

  return (
    <Card className="border-violet-100">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {icon}
              <p className="text-sm font-medium text-[var(--neutral-500)]">{title}</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">
              {currentValue}
              {valueLabel && <span className="text-lg text-[var(--neutral-500)]"> {valueLabel}</span>}
            </p>
            <div className="mt-2 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span
                className={cn(
                  "text-sm font-semibold",
                  isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {isPositive ? "+" : ""}
                {percentageChange.toFixed(1)}%
              </span>
              <span className="text-xs text-[var(--neutral-500)]">عن الشهر الماضي</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
