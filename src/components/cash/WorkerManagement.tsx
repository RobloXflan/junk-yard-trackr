import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, UserCheck, UserX, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Worker {
  id: string;
  name: string;
  phone: string | null;
  hire_date: string;
  status: string;
  created_at: string;
}

export function WorkerManagement() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCashDialogOpen, setIsCashDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [newWorker, setNewWorker] = useState({
    name: "",
    phone: ""
  });
  const [cashData, setCashData] = useState({
    starting_cash: "",
    money_added: "",
    money_subtracted: ""
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async () => {
    if (!newWorker.name.trim()) {
      toast({
        title: "Error",
        description: "Worker name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('workers')
        .insert([{
          name: newWorker.name.trim(),
          phone: newWorker.phone.trim() || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Worker added successfully"
      });

      setNewWorker({ name: "", phone: "" });
      setIsAddDialogOpen(false);
      fetchWorkers();
    } catch (error) {
      console.error('Error adding worker:', error);
      toast({
        title: "Error",
        description: "Failed to add worker",
        variant: "destructive"
      });
    }
  };

  const toggleWorkerStatus = async (workerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('workers')
        .update({ status: newStatus })
        .eq('id', workerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Worker ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
      });

      fetchWorkers();
    } catch (error) {
      console.error('Error updating worker status:', error);
      toast({
        title: "Error",
        description: "Failed to update worker status",
        variant: "destructive"
      });
    }
  };

  const openCashDialog = (worker: Worker) => {
    setSelectedWorker(worker);
    setCashData({
      starting_cash: "",
      money_added: "",
      money_subtracted: ""
    });
    setIsCashDialogOpen(true);
  };

  const handleCashAdjustment = async () => {
    if (!selectedWorker) return;

    const startingCash = parseFloat(cashData.starting_cash) || 0;
    const moneyAdded = parseFloat(cashData.money_added) || 0;
    const moneySubtracted = parseFloat(cashData.money_subtracted) || 0;
    const finalTotal = startingCash + moneyAdded - moneySubtracted;

    try {
      const { error } = await supabase
        .from('worker_checkins')
        .upsert([{
          worker_id: selectedWorker.id,
          checkin_date: new Date().toISOString().split('T')[0],
          starting_cash: startingCash,
          money_added: moneyAdded,
          money_subtracted: moneySubtracted,
          final_total: finalTotal
        }], {
          onConflict: 'worker_id,checkin_date'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Cash adjustment recorded for ${selectedWorker.name}`
      });

      setIsCashDialogOpen(false);
      setCashData({
        starting_cash: "",
        money_added: "",
        money_subtracted: ""
      });
      setSelectedWorker(null);
    } catch (error) {
      console.error('Error recording cash adjustment:', error);
      toast({
        title: "Error",
        description: "Failed to record cash adjustment",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading workers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Worker Management</h2>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Worker</DialogTitle>
              <DialogDescription>
                Add a new team member to the cash management system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter worker name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={newWorker.phone}
                  onChange={(e) => setNewWorker(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddWorker}>Add Worker</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Workers</CardTitle>
          <CardDescription>
            Total: {workers.length} workers ({workers.filter(w => w.status === 'active').length} active)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No workers found. Add your first worker to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell className="font-medium">{worker.name}</TableCell>
                    <TableCell>{worker.phone || "—"}</TableCell>
                    <TableCell>{format(new Date(worker.hire_date), "MM/dd/yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant={worker.status === 'active' ? 'default' : 'secondary'}>
                        {worker.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCashDialog(worker)}
                          disabled={worker.status !== 'active'}
                        >
                          <DollarSign className="mr-2 h-4 w-4" />
                          Cash
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleWorkerStatus(worker.id, worker.status)}
                        >
                          {worker.status === 'active' ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cash Adjustment Dialog */}
      <Dialog open={isCashDialogOpen} onOpenChange={setIsCashDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cash Adjustment</DialogTitle>
            <DialogDescription>
              Manually adjust cash for {selectedWorker?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="starting_cash">Starting Cash ($)</Label>
              <Input
                id="starting_cash"
                type="number"
                step="0.01"
                value={cashData.starting_cash}
                onChange={(e) => setCashData(prev => ({ ...prev, starting_cash: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="money_added">Money Added ($)</Label>
              <Input
                id="money_added"
                type="number"
                step="0.01"
                value={cashData.money_added}
                onChange={(e) => setCashData(prev => ({ ...prev, money_added: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="money_subtracted">Money Subtracted ($)</Label>
              <Input
                id="money_subtracted"
                type="number"
                step="0.01"
                value={cashData.money_subtracted}
                onChange={(e) => setCashData(prev => ({ ...prev, money_subtracted: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            {(cashData.starting_cash || cashData.money_added || cashData.money_subtracted) && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">Final Total:</div>
                <div className="text-lg font-bold text-primary">
                  ${((parseFloat(cashData.starting_cash) || 0) + 
                     (parseFloat(cashData.money_added) || 0) - 
                     (parseFloat(cashData.money_subtracted) || 0)).toFixed(2)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCashDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCashAdjustment}>
              Record Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}