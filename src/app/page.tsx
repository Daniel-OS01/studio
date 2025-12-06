"use client"

import { useState } from "react"
import {
  Bot,
  Library,
  Settings,
  Users,
} from "lucide-react"

import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { CommunityLibraryView } from "@/components/views/community-library-view"
import { LocalLibraryView } from "@/components/views/local-library-view"
import { SettingsView } from "@/components/views/settings-view"
import { StudioView } from "@/components/views/studio-view"
import { Logo } from "@/components/icons"
import type { View } from "@/lib/types"

export default function Home() {
  const [activeView, setActiveView] = useState<View>("studio")

  const renderView = () => {
    switch (activeView) {
      case "studio":
        return <StudioView />
      case "local-library":
        return <LocalLibraryView setView={setActiveView} />
      case "community-library":
        return <CommunityLibraryView setView={setActiveView} />
      case "settings":
        return <SettingsView />
      default:
        return <StudioView />
    }
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
             <Logo className="w-8 h-8 text-sidebar-primary" />
            <h2 className="font-headline text-2xl font-bold text-sidebar-primary-foreground">
              PromptForge
            </h2>
          </div>
        </SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveView("studio")}
              isActive={activeView === "studio"}
              tooltip="Studio"
            >
              <Bot />
              <span>Studio</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveView("local-library")}
              isActive={activeView === "local-library"}
              tooltip="My Library"
            >
              <Library />
              <span>My Library</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveView("community-library")}
              isActive={activeView === "community-library"}
              tooltip="Community"
            >
              <Users />
              <span>Community</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarFooter className="mt-auto">
          <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setActiveView("settings")}
                isActive={activeView === "settings"}
                tooltip="Settings"
              >
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{renderView()}</SidebarInset>
    </SidebarProvider>
  )
}
