import { Layers3, LogOut, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { useTranslation } from '../contexts/language-context'
import { LanguageSwitcher } from './language-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from './ui/sidebar'

const navigation = [
  // { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Budgets', url: '/budgets', icon: WalletCards },
]

export function AppSidebar() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const [signOutError, setSignOutError] = useState<string | null>(null)

  async function handleSignOut() {
    setSignOutError(null)
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      setSignOutError(error instanceof Error ? t(error.message) : t('Unable to sign out.'))
    }
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Layers3 size={19} />
          </span>
          <span className="font-display text-lg font-bold tracking-[-0.03em]">
            Layered
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel>{t('Workspace')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map(({ title, url, icon: Icon }) => (
                <SidebarMenuItem key={url}>
                  <SidebarMenuButton
                    isActive={location.pathname === url || location.pathname.startsWith(`${url}/`)}
                    render={<NavLink to={url} />}
                    tooltip={t(title)}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false)
                    }}
                  >
                    <Icon />
                    <span>{t(title)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-sidebar-border p-4">
        <LanguageSwitcher />
        <p className="truncate px-2 text-sm text-muted-foreground">{user?.email}</p>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                if (isMobile) setOpenMobile(false)
                void handleSignOut()
              }}
              tooltip={t('Sign out')}
            >
              <LogOut />
              <span>{t('Sign out')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {signOutError ? (
          <p role="alert" className="px-2 text-xs leading-5 text-destructive">
            {signOutError}
          </p>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  )
}
