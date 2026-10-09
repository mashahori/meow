import { Outlet } from 'react-router-dom'
import { AppSidebar } from './app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from './ui/sidebar'
import { TooltipProvider } from './ui/tooltip'

export function AppLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-transparent">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white px-4 md:hidden">
            <SidebarTrigger />
            <span className="font-display font-bold">Layered</span>
          </header>
          <div className="flex-1 p-5 sm:p-8 lg:p-10">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
