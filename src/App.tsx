
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
import { PublicInventory } from "@/pages/PublicInventory";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Check if the current URL is the public inventory route
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/public-inventory') {
      setCurrentPage('public-inventory');
    }
  }, []);

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
      case 'public-inventory':
        return <PublicInventory />;
      default:
        return <Dashboard />;
    }
  };

  // If on public inventory page, render without sidebar and header
  if (currentPage === 'public-inventory') {
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
            <main className="flex-1 flex flex-col">
              <header className="border-b bg-card px-4 py-3 lg:px-6">
                <div className="flex items-center gap-4">
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
                  </nav>
                </div>
              </header>
              <div className="flex-1 p-4 lg:p-6">
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
