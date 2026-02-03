import {
  BarChart,
  MessageSquare,
  Users,
  Zap,
  FileText,
  Settings,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

// Menu items
const items = [
  {
    title: 'Dashboard',
    url: '/',
    icon: BarChart,
  },
  {
    title: 'WhatsApp',
    url: '/whatsapp',
    icon: MessageSquare,
  },
  {
    title: 'Clientes',
    url: '/clients',
    icon: Users,
  },
  {
    title: 'Automação',
    url: '/automation',
    icon: Zap,
  },
  {
    title: 'Contexto',
    url: '/context',
    icon: FileText,
  },
  {
    title: 'Configurações',
    url: '/settings',
    icon: Settings,
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-primary">
            Elite Manager
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 px-4 text-xs uppercase tracking-wider">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isActive
                          ? 'bg-transparent text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground',
                      )}
                    >
                      <Link to={item.url}>
                        {/* Active Indicator Bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                        )}
                        <item.icon
                          className={cn(
                            'h-4 w-4 transition-colors duration-200 group-hover:text-primary',
                            isActive ? 'text-primary' : 'text-white',
                          )}
                        />
                        <span
                          className={cn(
                            'transition-colors duration-200 group-hover:text-primary',
                            isActive ? 'text-primary' : 'text-white',
                          )}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
