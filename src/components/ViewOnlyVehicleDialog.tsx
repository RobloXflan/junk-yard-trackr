import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { CheckCircle, XCircle, FileText, Eye, X } from "lucide-react";
import { Vehicle } from "@/stores/vehicleStore";

interface ViewOnlyVehicleDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewOnlyVehicleDialog = ({ vehicle, open, onOpenChange }: ViewOnlyVehicleDialogProps) => {
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);

  if (!vehicle) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "yard":
        return "bg-blue-100 text-blue-800";
      case "sold":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaperworkColor = (paperwork: string) => {
    switch (paperwork?.toLowerCase()) {
      case "complete":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "missing":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const viewDocument = (document: any) => {
    setSelectedDocument(document);
  };

  const closeDocumentView = () => {
    setSelectedDocument(null);
  };

  // Filter documents that are images
  const imageDocuments = vehicle.documents?.filter(doc => 
    doc.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
  ) || [];

  // Filter documents that are not images
  const otherDocuments = vehicle.documents?.filter(doc => 
    !doc.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
  ) || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Vehicle Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Vehicle ID</p>
                    <p className="font-semibold">{vehicle.vehicleId}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(vehicle.status)}>
                      {vehicle.status || "Unknown"}
                    </Badge>
                    <Badge className={getPaperworkColor(vehicle.paperwork || '')}>
                      {vehicle.paperwork || "Unknown"} Paperwork
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    {vehicle.titlePresent ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm">Title Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {vehicle.billOfSale ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm">Bill of Sale</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images Carousel */}
            {imageDocuments.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Vehicle Images ({imageDocuments.length})</h3>
                  <Carousel className="w-full">
                    <CarouselContent>
                      {imageDocuments.map((document, index) => (
                        <CarouselItem key={document.id || index} className="md:basis-1/2 lg:basis-1/3">
                          <div className="p-1">
                            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => viewDocument(document)}>
                              <CardContent className="p-4">
                                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2">
                                  <img 
                                    src={document.url} 
                                    alt={document.name || `Vehicle image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg";
                                    }}
                                  />
                                </div>
                                <p className="text-sm font-medium truncate">{document.name}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      viewDocument(document);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {imageDocuments.length > 3 && (
                      <>
                        <CarouselPrevious />
                        <CarouselNext />
                      </>
                    )}
                  </Carousel>
                </CardContent>
              </Card>
            )}

            {/* Other Documents */}
            {otherDocuments.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Documents ({otherDocuments.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {otherDocuments.map((document, index) => (
                      <div key={document.id || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{document.name}</p>
                          {document.size && (
                            <p className="text-xs text-gray-500">{(document.size / 1024 / 1024).toFixed(2)} MB</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewDocument(document)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Documents Message */}
            {(!vehicle.documents || vehicle.documents.length === 0) && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">No documents or images available for this vehicle.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Screen Document Viewer */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={closeDocumentView}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
            <div className="relative w-full h-[95vh]">
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white"
                onClick={closeDocumentView}
              >
                <X className="w-4 h-4" />
              </Button>
              
              {selectedDocument.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ? (
                <img 
                  src={selectedDocument.url} 
                  alt={selectedDocument.name}
                  className="w-full h-full object-contain bg-gray-100"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">{selectedDocument.name}</p>
                    <Button 
                      className="mt-4"
                      onClick={() => window.open(selectedDocument.url, '_blank')}
                    >
                      Open Document
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
