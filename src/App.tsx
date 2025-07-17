import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/pages/Dashboard";
import { Intake } from "@/pages/Intake";
import { InventoryOptimized } from "@/pages/InventoryOptimized";
import { PendingReleases } from "@/pages/PendingReleases";
import { Released } from "@/pages/Released";
import { Quotes } from "@/pages/Quotes";
import { Metrics } from "@/pages/Metrics";
import { SimpleCashAdmin } from "@/components/SimpleCashAdmin";
import { WorkerCashEntry } from "@/components/WorkerCashEntry";
import { PublicInventory } from "@/pages/PublicInventory";
import { SiteAuth } from "@/components/SiteAuth";
import { ViewOnlyInventory } from "@/components/ViewOnlyInventory";
import { BusinessPurchases } from "@/pages/BusinessPurchases";
import { SmartReceiptUpload } from "@/pages/SmartReceiptUpload";
import { Appointments } from "@/pages/Appointments";
import TelegramSetup from "@/pages/TelegramSetup";
import TelegramDebug from "@/pages/TelegramDebug";
import { Menu } from "lucide-react";
import { useState } from "react";

const queryClient = new QueryClient();

type UserType = 'admin' | 'viewer' | null;

const App = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [userType, setUserType] = useState<UserType>(null);
  const [username, setUsername] = useState("");

  // Check if we're on special routes
  const isPublicInventory = window.location.pathname === "/public-inventory";
  const isWorkerCash = window.location.pathname === "/worker-cash";

  const handleAuthentication = (type: UserType, user?: string) => {
    setUserType(type);
    if (user) setUsername(user);
  };

  const handleLogout = () => {
    // Clear remembered user data from localStorage
    localStorage.removeItem('rememberedUser');
    setUserType(null);
    setUsername("");
    setCurrentPage("dashboard");
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'intake':
        return <Intake />;
      case 'inventory':
        return <InventoryOptimized onNavigate={setCurrentPage} />;
      case 'pending-releases':
        return <PendingReleases />;
      case 'released':
        return <Released />;
      case 'quotes':
        return <Quotes />;
      case 'appointments':
        return <Appointments />;
      case 'business-purchases':
        return <BusinessPurchases />;
      case 'smart-receipt-upload':
        return <SmartReceiptUpload />;
      case 'telegram-setup':
        return <TelegramSetup />;
      case 'telegram-debug':
        return <TelegramDebug />;
      case 'metrics':
        return <Metrics />;
      case 'admin':
        return <SimpleCashAdmin />;
      case 'public-inventory':
        return <PublicInventory />;
      default:
        return <Dashboard />;
    }
  };

  // Handle URL-based routing for special routes
  if (isPublicInventory) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PublicInventory />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (isWorkerCash) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <WorkerCashEntry />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Show login if not authenticated
  if (!userType) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SiteAuth onAuthenticated={(type) => {
            handleAuthentication(type, type === 'admin' ? 'America Main' : 'ChocoXflan');
          }} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Show view-only inventory for viewer users
  if (userType === 'viewer') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ViewOnlyInventory onLogout={handleLogout} username={username} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Show full admin interface for admin users
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
            <main className="flex-1 flex flex-col">
              <header className="border-b bg-card px-3 py-2 sm:px-4 sm:py-3 lg:px-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  <SidebarTrigger className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </SidebarTrigger>
                  <nav className="hidden lg:flex items-center space-x-4">
                    <button
                      onClick={() => setCurrentPage("dashboard")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "dashboard"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setCurrentPage("intake")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "intake"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Vehicle Intake
                    </button>
                    <button
                      onClick={() => setCurrentPage("inventory")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "inventory"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Inventory
                    </button>
                    <button
                      onClick={() => setCurrentPage("pending-releases")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "pending-releases"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Pending Releases
                    </button>
                    <button
                      onClick={() => setCurrentPage("released")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "released"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Released
                    </button>
                    <button
                      onClick={() => setCurrentPage("quotes")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "quotes"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Quotes
                    </button>
                    <button
                      onClick={() => setCurrentPage("appointments")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "appointments"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Appointments
                    </button>
                    <button
                      onClick={() => setCurrentPage("business-purchases")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "business-purchases"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Business Purchases
                    </button>
                    <button
                      onClick={() => setCurrentPage("telegram-setup")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "telegram-setup"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Telegram Setup
                    </button>
                    <button
                      onClick={() => setCurrentPage("telegram-debug")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "telegram-debug"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Telegram Debug
                    </button>
                    <button
                      onClick={() => setCurrentPage("metrics")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "metrics"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Metrics
                    </button>
                    <button
                      onClick={() => {
                        const passcode = prompt("Enter admin passcode:");
                        if (passcode === "1426") {
                          setCurrentPage("admin");
                        } else if (passcode !== null) {
                          alert("Invalid passcode");
                        }
                      }}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "admin"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Admin
                    </button>
                  </nav>
                  <div className="ml-auto flex items-center gap-2 sm:gap-4">
                    <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">
                      Welcome, {username}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded touch-manipulation"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </header>
              <div className="flex-1 p-3 sm:p-4 lg:p-6">
                {renderPage()}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
