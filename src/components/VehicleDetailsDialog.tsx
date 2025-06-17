
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vehicle } from "@/stores/vehicleStore";
import { Save, X, ExternalLink, FileText } from "lucide-react";
import { BuyerSelector } from "@/components/forms/BuyerSelector";
import { Buyer } from "@/hooks/useBuyers";

interface VehicleDetailsDialogProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicleId: string, newStatus: Vehicle['status'], soldData?: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
  }) => void;
}

export function VehicleDetailsDialog({ vehicle, isOpen, onClose, onSave }: VehicleDetailsDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<Vehicle['status']>('yard');
  const [buyerSelectorOpen, setBuyerSelectorOpen] = useState(false);
  const [pendingSoldData, setPendingSoldData] = useState<{
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
  } | null>(null);

  // Reset state when vehicle changes or dialog opens/closes
  useEffect(() => {
    if (vehicle && isOpen) {
      setSelectedStatus(vehicle.status);
      setPendingSoldData(null);
      setBuyerSelectorOpen(false);
    }
  }, [vehicle, isOpen]);

  if (!vehicle) return null;

  const statusOptions = [
    { value: 'yard', label: 'In Yard', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
    { value: 'sold', label: 'Sold', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
    { value: 'pick-your-part', label: 'Pick Your Part', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
    { value: 'sa-recycling', label: 'SA Recycling', color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' }
  ] as const;

  const handleStatusChange = (newStatus: Vehicle['status']) => {
    if (newStatus === 'sold') {
      setBuyerSelectorOpen(true);
      // Don't update selectedStatus yet, wait for buyer selection
    } else {
      setSelectedStatus(newStatus);
      setPendingSoldData(null); // Clear sold data if not sold
    }
  };

  const handleBuyerSelect = (buyer: Buyer, salePrice: string, saleDate: string) => {
    setPendingSoldData({
      buyerFirstName: buyer.first_name,
      buyerLastName: buyer.last_name,
      salePrice,
      saleDate
    });
    setSelectedStatus('sold');
    setBuyerSelectorOpen(false);
  };

  const handleBuyerSelectorClose = (open: boolean) => {
    if (!open) {
      // Only reset if we don't have pending sold data (meaning it was cancelled, not confirmed)
      if (!pendingSoldData) {
        setSelectedStatus(vehicle.status); // Reset to original status only if cancelled
      }
    }
    setBuyerSelectorOpen(open);
  };

  const handleSave = () => {
    if (selectedStatus === 'sold' && pendingSoldData) {
      onSave(vehicle.id, selectedStatus, pendingSoldData);
    } else {
      onSave(vehicle.id, selectedStatus);
    }
    onClose();
  };

  const handleClose = () => {
    // Reset state when closing
    setSelectedStatus(vehicle.status);
    setPendingSoldData(null);
    setBuyerSelectorOpen(false);
    onClose();
  };

  const getStatusLabel = (status: Vehicle['status']) => {
    switch (status) {
      case 'yard': return 'In Yard';
      case 'sold': return 'Sold';
      case 'pick-your-part': return 'Pick Your Part';
      case 'sa-recycling': return 'SA Recycling';
      default: return status;
    }
  };

  // Get the current sale price - use pending data if available, otherwise vehicle data
  const currentSalePrice = pendingSoldData?.salePrice || vehicle.salePrice;

  // Helper function to determine if a document is a PDF
  const isPdfDocument = (document: any) => {
    return document.name?.toLowerCase().endsWith('.pdf') || 
           document.url?.toLowerCase().includes('.pdf');
  };

  // Helper function to determine if a document is an image
  const isImageDocument = (document: any) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => 
      document.name?.toLowerCase().endsWith(ext) || 
      document.url?.toLowerCase().includes(ext)
    );
  };

  const openDocumentInNewTab = (document: any) => {
    if (document.url) {
      window.open(document.url, '_blank');
    } else {
      console.error('No URL available for document:', document);
    }
  };

  console.log('Vehicle documents in dialog:', vehicle.documents);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vehicle Details - Takes 1 column */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Vehicle Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle ID:</span>
                    <span className="font-mono">{vehicle.vehicleId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Plate:</span>
                    <span>{vehicle.licensePlate || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Driver:</span>
                    <span>{vehicle.sellerName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Date:</span>
                    <span>{vehicle.purchaseDate || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Price:</span>
                    <span>{vehicle.purchasePrice ? `$${parseFloat(vehicle.purchasePrice).toLocaleString()}` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sale Price:</span>
                    <span>{currentSalePrice ? `$${parseFloat(currentSalePrice).toLocaleString()}` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Status:</span>
                    <Badge variant={
                      vehicle.status === 'sold' ? 'default' :
                      vehicle.status === 'yard' ? 'secondary' :
                      'outline'
                    }>
                      {getStatusLabel(vehicle.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Status Editor with Bubble Format */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Update Status</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Select new status:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusChange(option.value)}
                          className={`
                            px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2
                            ${selectedStatus === option.value 
                              ? 'border-primary shadow-md scale-105' 
                              : 'border-transparent hover:scale-102'
                            }
                            ${option.color}
                          `}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Show sold details if status is sold and we have pending data */}
                  {selectedStatus === 'sold' && pendingSoldData && (
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Sale Details:</p>
                        <p className="text-sm">Buyer: {pendingSoldData.buyerFirstName} {pendingSoldData.buyerLastName}</p>
                        <p className="text-sm">Sale Price: ${pendingSoldData.salePrice}</p>
                        <p className="text-sm">Date: {pendingSoldData.saleDate}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSave} 
                      className="flex-1"
                      disabled={selectedStatus === vehicle.status && !pendingSoldData}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Status
                    </Button>
                    <Button variant="outline" onClick={handleClose}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {vehicle.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {vehicle.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Documents - Takes 2 columns */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-3">Vehicle Documents</h3>
              {vehicle.documents && vehicle.documents.length > 0 ? (
                <div className="space-y-4">
                  {vehicle.documents.map((doc) => {
                    console.log('Rendering document:', doc.id, 'URL:', doc.url, 'Name:', doc.name);
                    
                    if (!doc.url) {
                      console.error('Document missing URL:', doc);
                      return (
                        <div key={doc.id} className="border rounded-lg p-4 bg-red-50">
                          <div className="flex items-center gap-2 text-red-600">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">Document unavailable: {doc.name}</span>
                          </div>
                        </div>
                      );
                    }
                    
                    if (isPdfDocument(doc)) {
                      return (
                        <div key={doc.id} className="border rounded-lg overflow-hidden">
                          <div className="p-2 bg-muted flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">{doc.name}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDocumentInNewTab(doc)}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open PDF
                            </Button>
                          </div>
                          <div className="relative w-full h-96">
                            <iframe
                              src={`${doc.url}#toolbar=1&navpanes=1&scrollbar=1`}
                              className="w-full h-full border-0"
                              title={`PDF: ${doc.name}`}
                              onLoad={() => console.log('PDF loaded successfully:', doc.url)}
                              onError={(e) => {
                                console.error('PDF failed to load:', doc.url, e);
                              }}
                            />
                          </div>
                        </div>
                      );
                    } else if (isImageDocument(doc)) {
                      return (
                        <div key={doc.id} className="border rounded-lg overflow-hidden">
                          <img 
                            src={doc.url} 
                            alt={`Vehicle document: ${doc.name}`}
                            className="w-full h-auto max-h-96 object-contain bg-muted"
                            onLoad={() => console.log('Image loaded successfully:', doc.url)}
                            onError={(e) => {
                              console.error('Image failed to load:', doc.url, e);
                              console.log('Image error event:', e.currentTarget);
                            }}
                          />
                          <div className="p-2 bg-muted">
                            <p className="text-sm text-muted-foreground">{doc.name}</p>
                          </div>
                        </div>
                      );
                    } else {
                      // Unknown document type - provide download link
                      return (
                        <div key={doc.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground">{doc.name}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDocumentInNewTab(doc)}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open Document
                            </Button>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No documents available for this vehicle</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BuyerSelector
        open={buyerSelectorOpen}
        onOpenChange={handleBuyerSelectorClose}
        onSelectBuyer={handleBuyerSelect}
      />
    </>
  );
}
