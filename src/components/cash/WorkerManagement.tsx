import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, UserCheck, UserX } from "lucide-react";
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
  const [newWorker, setNewWorker] = useState({
    name: "",
    phone: ""
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}