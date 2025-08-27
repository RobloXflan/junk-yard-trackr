
import { Car, BarChart3, Upload, Clock, Settings, CheckCircle, FileText, TrendingUp, ShoppingCart, ScanLine, Calendar, Printer, Users, Truck } from "lucide-react";
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

const mainMenuItems = [
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
    title: "Pending Releases",
    page: "pending-releases",
    icon: Clock,
  },
  {
    title: "Released",
    page: "released",
    icon: CheckCircle,
  },
  {
    title: "Quotes",
    page: "quotes",
    icon: FileText,
  },
  {
    title: "Appointments",
    page: "appointments",
    icon: Calendar,
  },
  {
    title: "SA Trips",
    page: "sa-trips",
    icon: Truck,
  },
  {
    title: "Pick Your Part Trips", 
    page: "pyp-trips",
    icon: Truck,
  },
  {
    title: "PYP Documents",
    page: "pyp-documents",
    icon: FileText,
  },
  {
    title: "Print",
    page: "print",
    icon: Printer,
  },
  {
    title: "Smart Receipt Upload",
    page: "smart-receipt-upload",
    icon: ScanLine,
  },
];

const adminMenuItems = [
  {
    title: "Business Purchases",
    page: "business-purchases",
    icon: ShoppingCart,
    locked: true,
  },
  {
    title: "Metrics",
    page: "metrics",
    icon: TrendingUp,
    locked: true,
  },
  {
    title: "Admin",
    page: "admin",  
    icon: Settings,
    locked: true,
  },
];

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const { setOpenMobile } = useSidebar();

  const handleNavigation = (page: string, locked?: boolean) => {
    if (locked) {
      const passcode = prompt("Enter admin passcode:");
      if (passcode !== "1426") {
        alert("Invalid passcode");
        return;
      }
    }
    onNavigate(page);
    // Close mobile sidebar after navigation
    setOpenMobile(false);
  };

  return (
    <Sidebar className="border-r border-slate-200 bg-white">
      <SidebarHeader className="p-3 sm:p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">JunkCar Pro</h2>
            <p className="text-xs text-slate-500">Admin Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-medium">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNavigation(item.page)}
                    isActive={currentPage === item.page}
                    className={`hover:bg-slate-100 cursor-pointer py-3 px-3 touch-manipulation ${
                      currentPage === item.page 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 sm:w-4 sm:h-4" />
                      <span className="font-medium text-base sm:text-sm">{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-medium">
            Admin Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNavigation(item.page, item.locked)}
                    isActive={currentPage === item.page}
                    className={`hover:bg-slate-100 cursor-pointer py-3 px-3 touch-manipulation ${
                      currentPage === item.page 
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 sm:w-4 sm:h-4" />
                      <span className="font-medium text-base sm:text-sm">{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-3 sm:p-4 border-t border-slate-200 bg-white">
        <div className="text-xs text-slate-400">
          © 2024 JunkCar Pro
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
