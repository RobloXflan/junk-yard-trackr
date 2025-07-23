import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Truck } from "lucide-react";

interface Truck {
  id: string;
  truck_number: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  status: string;
  current_driver_id: string;
  created_at: string;
}

interface Worker {
  id: string;
  name: string;
}

export function TruckManagement() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [formData, setFormData] = useState({
    truck_number: "",
    license_plate: "",
    make: "",
    model: "",
    year: "",
    status: "available",
    current_driver_id: ""
  });

  useEffect(() => {
    fetchTrucks();
    fetchWorkers();
  }, []);

  const fetchTrucks = async () => {
    const { data, error } = await supabase
      .from('trucks')
      .select(`
        *,
        workers!trucks_current_driver_id_fkey(name)
      `)
      .order('truck_number');
    
    if (error) {
      toast.error('Failed to fetch trucks');
      return;
    }
    setTrucks(data || []);
  };

  const fetchWorkers = async () => {
    const { data, error } = await supabase
      .from('workers')
      .select('id, name')
      .eq('status', 'active')
      .order('name');
    
    if (error) {
      toast.error('Failed to fetch workers');
      return;
    }
    setWorkers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const truckData = {
      ...formData,
      year: formData.year ? parseInt(formData.year) : null,
      current_driver_id: formData.current_driver_id === "unassigned" ? null : formData.current_driver_id || null
    };

    if (editingTruck) {
      const { error } = await supabase
        .from('trucks')
        .update(truckData)
        .eq('id', editingTruck.id);

      if (error) {
        toast.error('Failed to update truck');
        return;
      }
      toast.success('Truck updated successfully');
    } else {
      const { error } = await supabase
        .from('trucks')
        .insert(truckData);

      if (error) {
        toast.error('Failed to create truck');
        return;
      }
      toast.success('Truck created successfully');
    }

    setIsDialogOpen(false);
    setEditingTruck(null);
    resetForm();
    fetchTrucks();
  };

  const resetForm = () => {
    setFormData({
      truck_number: "",
      license_plate: "",
      make: "",
      model: "",
      year: "",
      status: "available",
      current_driver_id: "unassigned"
    });
  };

  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck);
    setFormData({
      truck_number: truck.truck_number,
      license_plate: truck.license_plate || "",
      make: truck.make || "",
      model: truck.model || "",
      year: truck.year?.toString() || "",
      status: truck.status,
      current_driver_id: truck.current_driver_id || "unassigned"
    });
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'in_use': return 'secondary';
      case 'maintenance': return 'destructive';
      case 'offline': return 'outline';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Truck Management
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingTruck(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Truck
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTruck ? 'Edit Truck' : 'Add New Truck'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="truck_number">Truck Number *</Label>
                  <Input
                    id="truck_number"
                    value={formData.truck_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, truck_number: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_plate">License Plate</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Input
                      id="make"
                      value={formData.make}
                      onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in_use">In Use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_driver_id">Current Driver</Label>
                  <Select value={formData.current_driver_id} onValueChange={(value) => setFormData(prev => ({ ...prev, current_driver_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">No driver assigned</SelectItem>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingTruck ? 'Update' : 'Create'} Truck
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Truck #</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trucks.map((truck) => (
              <TableRow key={truck.id}>
                <TableCell className="font-medium">#{truck.truck_number}</TableCell>
                <TableCell>
                  {truck.year} {truck.make} {truck.model}
                </TableCell>
                <TableCell>{truck.license_plate}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(truck.status)}>
                    {truck.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {(truck as any).workers?.name || 'Unassigned'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(truck)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}