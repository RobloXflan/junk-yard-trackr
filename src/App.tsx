
import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/pages/Dashboard";
import { Intake } from "@/pages/Intake";
import { InventoryOptimized } from "@/pages/InventoryOptimized";
import { Menu } from "lucide-react";

const queryClient = new QueryClient();

const App = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'intake':
        return <Intake />;
      case 'inventory':
        return <InventoryOptimized onNavigate={handleNavigate} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar currentPage={currentPage} onNavigate={handleNavigate} />
            <main className="flex-1 flex flex-col">
              <header className="border-b bg-card px-4 py-3 lg:px-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="lg:hidden">
                    <Menu className="w-5 h-5" />
                  </SidebarTrigger>
                  <nav className="hidden lg:flex items-center space-x-4">
                    <button
                      onClick={() => handleNavigate("dashboard")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "dashboard"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleNavigate("intake")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "intake"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Vehicle Intake
                    </button>
                    <button
                      onClick={() => handleNavigate("inventory")}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentPage === "inventory"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Inventory
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
