import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarProps {
  currentPage?: string;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: 'fa-tachometer-alt',
    id: 'dashboard'
  },
  {
    name: 'Layout Editor',
    href: '/layout-editor',
    icon: 'fa-warehouse',
    id: 'layout-editor'
  },
  {
    name: 'Inspections',
    href: '/inspection',
    icon: 'fa-clipboard-check',
    id: 'inspection'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: 'fa-file-pdf',
    id: 'reports'
  },
  {
    name: 'User Management',
    href: '/users',
    icon: 'fa-users',
    id: 'users',
    adminOnly: true
  }
];

export default function Sidebar({ currentPage }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useAuth();
  const [location] = useLocation();

  const isAdmin = user?.profile?.role === 'admin';

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || isAdmin
  );

  return (
    <aside 
      className={cn(
        "bg-white shadow-sm border-r border-gray-200 h-screen transition-all duration-300 fixed z-40",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-sm font-semibold text-gray-900">Navigation</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-600 hover:text-gray-900"
          data-testid="button-toggle-sidebar-collapse"
        >
          <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} />
        </Button>
      </div>

      <nav className="p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = currentPage === item.id || location === item.href;
          
          return (
            <Link key={item.id} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  isActive 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
                data-testid={`link-${item.id}`}
              >
                <i className={`fas ${item.icon} ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Button>
            </Link>
          );
        })}

        <div className="pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => window.open('/admin/', '_blank')}
            data-testid="link-admin"
          >
            <i className={`fas fa-cog ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span className="font-medium">Admin</span>}
          </Button>
        </div>
      </nav>
    </aside>
  );
}
