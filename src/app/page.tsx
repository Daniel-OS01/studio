"use client"

import { useState } from "react"
import {
  Bot,
  Library,
  Users,
} from "lucide-react"

import {
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { CommunityLibraryView } from "@/components/views/community-library-view"
import { LocalLibraryView } from "@/components/views/local-library-view"
import { StudioView } from "@/components/views/studio-view"
import { Logo } from "@/components/icons"

type View = "studio" | "local-library" | "community-library"

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
      </Sidebar>
      <SidebarInset>{renderView()}</SidebarInset>
    </SidebarProvider>
  )
}
