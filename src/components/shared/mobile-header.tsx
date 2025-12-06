"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Menu } from "lucide-react"

export function MobileHeader() {
  return (
    <header className="flex md:hidden items-center h-14 px-4 border-b bg-background sticky top-0 z-10">
      <SidebarTrigger>
        <Menu />
      </SidebarTrigger>
      <div className="flex-1 text-center font-bold">PromptForge</div>
      <div className="w-8" />
    </header>
  )
}
