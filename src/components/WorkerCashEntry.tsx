import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, Check, CalendarIcon, Minus, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WorkerCashEntry {
  worker_id: string;
  worker_name: string;
  reported_cash: number;
  dinero_dado: number;
  dinero_recibido: number;
  total_cash: number;
  source: 'worker' | 'admin';
  entry_date: string;
}

const workers = [
  { id: 'angel', name: 'Angel' },
  { id: 'chino', name: 'Chino' },
  { id: 'dante', name: 'Dante' }
];

export function WorkerCashEntry() {
  const [selectedWorker, setSelectedWorker] = useState<string>("");
  const [reportedCash, setReportedCash] = useState("");
  const [dineroAmount, setDineroAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'dado' | 'recibido'>('dado');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  
  console.log('Worker form - selected date:', selectedDate);
  console.log('Worker form - dateKey:', dateKey);

  const handleSubmit = () => {
    // Reset error
    setError("");

    // Validation
    if (!selectedWorker || !reportedCash || !dineroAmount) {
      setError("Por favor completa todos los campos");
      return;
    }

    const reportedAmount = parseFloat(reportedCash);
    const dineroAmountValue = parseFloat(dineroAmount);

    if (isNaN(reportedAmount) || isNaN(dineroAmountValue) || reportedAmount < 0 || dineroAmountValue < 0) {
      setError("Por favor ingresa cantidades válidas positivas");
      return;
    }

    const worker = workers.find(w => w.id === selectedWorker);
    if (!worker) return;

    // Calculate totals based on tab selection
    const dineroGiven = activeTab === 'dado' ? dineroAmountValue : 0;
    const dineroReceived = activeTab === 'recibido' ? dineroAmountValue : 0;
    const totalAmount = reportedAmount - dineroGiven + dineroReceived;

    const newEntry: WorkerCashEntry = {
      worker_id: selectedWorker,
      worker_name: worker.name,
      reported_cash: reportedAmount,
      dinero_dado: dineroGiven,
      dinero_recibido: dineroReceived,
      total_cash: totalAmount,
      source: 'worker',
      entry_date: dateKey
    };

    // Get existing entries for selected date
    const stored = localStorage.getItem(`dailyCash_${dateKey}`);
    const existingEntries: WorkerCashEntry[] = stored ? JSON.parse(stored) : [];

    console.log('Worker form - saving data for date:', dateKey);
    console.log('Worker form - existing entries:', existingEntries);
    console.log('Worker form - new entry:', newEntry);

    // Remove any existing entry for this worker on this date
    const filteredEntries = existingEntries.filter(entry => entry.worker_id !== selectedWorker);
    
    // Add the new entry
    const updatedEntries = [...filteredEntries, newEntry];
    
    console.log('Worker form - final entries to save:', updatedEntries);
    
    // Save to localStorage
    localStorage.setItem(`dailyCash_${dateKey}`, JSON.stringify(updatedEntries));

    console.log('Worker form - data saved to localStorage key:', `dailyCash_${dateKey}`);
    console.log('Worker form - final entries saved:', updatedEntries);

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">¡Éxito!</h2>
              <p className="text-muted-foreground">
                Tu reporte de dinero ha sido enviado exitosamente.
              </p>
              <Button 
                onClick={() => {
                  setIsSubmitted(false);
                  setSelectedWorker("");
                  setReportedCash("");
                  setDineroAmount("");
                  setError("");
                }}
                className="w-full"
              >
                Enviar Otro Reporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reporte Diario de Dinero</CardTitle>
          <p className="text-muted-foreground text-sm">
            {format(selectedDate, "MMMM dd, yyyy")}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-base">Seleccionar Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 text-lg justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Elegir una fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="worker" className="text-base">Selecciona Tu Nombre</Label>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger className="h-12 text-lg">
                <SelectValue placeholder="Elige tu nombre..." />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id} className="text-lg py-3">
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reported" className="text-base">Dinero Reportado</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
              <Input
                id="reported"
                type="number"
                step="0.01"
                min="0"
                value={reportedCash}
                onChange={(e) => setReportedCash(e.target.value)}
                placeholder="0.00"
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'dado' | 'recibido')}>
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="dado" className="text-red-600 data-[state=active]:text-red-700">
                  <Minus className="w-4 h-4 mr-2" />
                  Dinero Dado
                </TabsTrigger>
                <TabsTrigger value="recibido" className="text-green-600 data-[state=active]:text-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Dinero Recibido
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="dado" className="mt-4">
                <div className="space-y-2">
                  <Label className="text-base text-red-600">Cantidad Dada (Restar del total)</Label>
                  <div className="relative">
                    <Minus className="absolute left-3 top-4 h-5 w-5 text-red-500" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={dineroAmount}
                      onChange={(e) => setDineroAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-10 h-12 text-lg border-red-200 focus:border-red-400"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="recibido" className="mt-4">
                <div className="space-y-2">
                  <Label className="text-base text-green-600">Cantidad Recibida (Sumar al total)</Label>
                  <div className="relative">
                    <Plus className="absolute left-3 top-4 h-5 w-5 text-green-500" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={dineroAmount}
                      onChange={(e) => setDineroAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-10 h-12 text-lg border-green-200 focus:border-green-400"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {reportedCash && dineroAmount && (
            <div className="p-4 bg-muted rounded-md">
              <div className="text-center space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Reportado:</span>
                  <span className="font-medium">${parseFloat(reportedCash).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${activeTab === 'dado' ? 'text-red-600' : 'text-green-600'}`}>
                    {activeTab === 'dado' ? 'Dado (-)' : 'Recibido (+)'}:
                  </span>
                  <span className={`font-medium ${activeTab === 'dado' ? 'text-red-600' : 'text-green-600'}`}>
                    {activeTab === 'dado' ? '-' : '+'}${parseFloat(dineroAmount).toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Final:</span>
                    <span className="text-xl font-bold text-foreground">
                      ${(parseFloat(reportedCash) + (activeTab === 'recibido' ? parseFloat(dineroAmount) : -parseFloat(dineroAmount))).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            disabled={!selectedWorker || !reportedCash || !dineroAmount}
            className="w-full h-12 text-lg"
          >
            Enviar Reporte
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}