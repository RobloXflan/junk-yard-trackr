
import { Car, FileText, BarChart3, Upload, Users, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    page: "dashboard",
    icon: BarChart3,
  },
  {
    title: "Vehicle Intake",
    page: "intake",
    icon: Upload,
  },
  {
    title: "Vehicle Inventory",
    page: "inventory",
    icon: Car,
  },
  {
    title: "Documents",
    page: "documents",
    icon: FileText,
  },
  {
    title: "Users",
    page: "users",
    icon: Users,
  },
  {
    title: "Settings",
    page: "settings",
    icon: Settings,
  },
];

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const { setOpenMobile } = useSidebar();

  const handleNavigation = (page: string) => {
    onNavigate(page);
    // Close mobile sidebar after navigation
    setOpenMobile(false);
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">JunkCar Pro</h2>
            <p className="text-xs text-sidebar-foreground/70">Admin Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNavigation(item.page)}
                    isActive={currentPage === item.page}
                    className="hover:bg-sidebar-accent cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-sidebar-foreground">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="text-xs text-sidebar-foreground/50">
          © 2024 JunkCar Pro
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
