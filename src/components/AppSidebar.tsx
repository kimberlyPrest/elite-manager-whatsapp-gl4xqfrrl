import {
  BarChart,
  MessageSquare,
  Users,
  Zap,
  FileText,
  Settings,
  LogOut,
  User,
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
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'AD'

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

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors group">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-primary/20 text-primary font-medium text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
                  Administrador
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 bg-sidebar border-sidebar-border"
          >
            <DropdownMenuLabel className="text-muted-foreground">
              Minha Conta
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sidebar-border" />
            <DropdownMenuItem className="text-sidebar-foreground focus:bg-sidebar-accent focus:text-sidebar-accent-foreground cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair do Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
