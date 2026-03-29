import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden bg-[#262626] rounded-xl",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-shimmer",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-white/[0.06] before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }