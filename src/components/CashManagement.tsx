import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CashDashboard } from "./cash/CashDashboard";
import { WorkerManagement } from "./cash/WorkerManagement";
import { TransactionEntry } from "./cash/TransactionEntry";
import { TransactionHistory } from "./cash/TransactionHistory";
import { DollarSign, Users, History, Plus } from "lucide-react";

export function CashManagement() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cash Management</h1>
          <p className="text-muted-foreground">Track daily cash flow and worker balances</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Transaction
          </TabsTrigger>
          <TabsTrigger value="workers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Workers
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <CashDashboard selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Cash Transaction</CardTitle>
              <CardDescription>
                Record daily cash transactions for workers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionEntry selectedDate={selectedDate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers" className="space-y-4">
          <WorkerManagement />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <TransactionHistory selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}