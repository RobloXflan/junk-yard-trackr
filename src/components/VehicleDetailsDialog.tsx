
import React, { useState, useEffect } from 'react'
import { Vehicle, UploadedDocument } from '@/stores/vehicleStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { CarImagesUpload } from './CarImagesUpload'
import { DocumentUpload } from './forms/DocumentUpload'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { FileText, Trash2, Download, Calendar, DollarSign, User, MapPin, FileImage, Upload } from 'lucide-react'

interface VehicleDetailsDialogProps {
  vehicle: Vehicle | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

// Helper function to serialize documents for database storage
const serializeDocuments = (documents: UploadedDocument[]) => {
  return documents.map(doc => ({
    id: doc.id,
    name: doc.name,
    size: doc.size,
    url: doc.url
  }))
}

// Helper function to get file type from name
const getFileTypeFromName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf': return 'application/pdf'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'png': return 'image/png'
    default: return 'application/octet-stream'
  }
}

// Helper function to deserialize documents from database
const deserializeDocuments = (documentsData: any): UploadedDocument[] => {
  if (!documentsData || !Array.isArray(documentsData)) {
    return []
  }
  
  return documentsData.map(doc => ({
    id: doc.id,
    name: doc.name,
    size: doc.size,
    url: doc.url,
    file: new File([], doc.name, { type: getFileTypeFromName(doc.name) })
  }))
}

export function VehicleDetailsDialog({ vehicle, isOpen, onClose, onSave }: VehicleDetailsDialogProps) {
  const [editedVehicle, setEditedVehicle] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [documents, setDocuments] = useState<UploadedDocument[]>([])

  useEffect(() => {
    if (vehicle) {
      setEditedVehicle(vehicle)
      setDocuments(vehicle.documents || [])
    }
  }, [vehicle])

  if (!vehicle || !editedVehicle) {
    return null
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const updateData = {
        ...editedVehicle,
        documents: serializeDocuments(documents)
      }

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicle.id)

      if (error) throw error

      toast.success('Vehicle details updated successfully')
      onSave()
    } catch (error) {
      console.error('Error updating vehicle:', error)
      toast.error('Failed to update vehicle details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentsChange = (newDocuments: UploadedDocument[]) => {
    setDocuments(newDocuments)
  }

  const downloadDocument = async (doc: UploadedDocument) => {
    try {
      const response = await fetch(doc.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId))
  }

  const handleImagesUpdate = (updatedImages: any[]) => {
    setEditedVehicle(prev => prev ? { ...prev, carImages: updatedImages } : null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Vehicle Details - {editedVehicle.year} {editedVehicle.make} {editedVehicle.model}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle ID</Label>
                <Input
                  id="vehicleId"
                  value={editedVehicle.vehicleId}
                  onChange={(e) => setEditedVehicle({...editedVehicle, vehicleId: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input
                  id="licensePlate"
                  value={editedVehicle.licensePlate || ''}
                  onChange={(e) => setEditedVehicle({...editedVehicle, licensePlate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={editedVehicle.year}
                  onChange={(e) => setEditedVehicle({...editedVehicle, year: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={editedVehicle.make}
                  onChange={(e) => setEditedVehicle({...editedVehicle, make: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={editedVehicle.model}
                  onChange={(e) => setEditedVehicle({...editedVehicle, model: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellerName">Seller Name</Label>
                <Input
                  id="sellerName"
                  value={editedVehicle.sellerName || ''}
                  onChange={(e) => setEditedVehicle({...editedVehicle, sellerName: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editedVehicle.notes || ''}
                onChange={(e) => setEditedVehicle({...editedVehicle, notes: e.target.value})}
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={editedVehicle.purchaseDate || ''}
                  onChange={(e) => setEditedVehicle({...editedVehicle, purchaseDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={editedVehicle.purchasePrice || ''}
                  onChange={(e) => setEditedVehicle({...editedVehicle, purchasePrice: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleDate">Sale Date</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={editedVehicle.saleDate || ''}
                  onChange={(e) => setEditedVehicle({...editedVehicle, saleDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price</Label>
                <Input
                  id="salePrice"
                  type="number"
                  value={editedVehicle.salePrice || ''}
                  onChange={(e) => setEditedVehicle({...editedVehicle, salePrice: e.target.value})}
                />
              </div>
            </div>
            {editedVehicle.buyerFirstName && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Buyer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <p>{editedVehicle.buyerFirstName}</p>
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <p>{editedVehicle.buyerLastName}</p>
                  </div>
                  {editedVehicle.buyerAddress && (
                    <div className="md:col-span-2">
                      <Label>Address</Label>
                      <p>{editedVehicle.buyerAddress}</p>
                      {editedVehicle.buyerCity && (
                        <p>{editedVehicle.buyerCity}, {editedVehicle.buyerState} {editedVehicle.buyerZip}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <DocumentUpload
              uploadedDocuments={documents}
              onDocumentsChange={handleDocumentsChange}
            />
            {documents.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Documents</Label>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{doc.name}</span>
                        <Badge variant="secondary">{(doc.size / 1024).toFixed(1)} KB</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDocument(doc)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDocument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <CarImagesUpload
              vehicleId={editedVehicle.id}
              currentImages={editedVehicle.carImages || []}
              onImagesUpdate={handleImagesUpdate}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
