import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Dashboard } from "@/pages/Dashboard";
import { Index } from "@/pages/Index";
import { Intake } from "@/pages/Intake";
import { Inventory } from "@/pages/Inventory";
import { InventoryOptimized } from "@/pages/InventoryOptimized";
import { PendingReleases } from "@/pages/PendingReleases";
import { PublicInventory } from "@/pages/PublicInventory";
import { NotFound } from "@/pages/NotFound";
import Documents from "@/pages/Documents";

const queryClient = new QueryClient();

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { toast } = useToast();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory-optimized" element={<InventoryOptimized />} />
          <Route path="/pending-releases" element={<PendingReleases />} />
          <Route path="/public-inventory" element={<PublicInventory />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
