import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Eye, ChevronLeft, ChevronRight, GripVertical, Save } from 'lucide-react';
import { toast } from 'sonner';
import { CarImage } from '@/stores/vehicleStore';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CarImagesUploadProps {
  vehicleId: string;
  currentImages: CarImage[];
  onImagesUpdate: (images: CarImage[]) => void;
  disabled?: boolean;
}

interface PendingImage {
  file: File;
  preview: string;
  id: string;
}

export function CarImagesUpload({ vehicleId, currentImages, onImagesUpdate, disabled }: CarImagesUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newPendingImages: PendingImage[] = [];
    
    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      const pendingImage: PendingImage = {
        file,
        preview,
        id: `pending_${Date.now()}_${Math.random().toString(36).substring(2)}`
      };
      
      newPendingImages.push(pendingImage);
    }

    setPendingImages(prev => [...prev, ...newPendingImages]);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingImage = (imageId: string) => {
    setPendingImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;
    
    const newImages = [...pendingImages];
    const draggedImage = newImages[draggedIndex];
    
    // Remove the dragged item
    newImages.splice(draggedIndex, 1);
    
    // Insert at the new position
    newImages.splice(dropIndex, 0, draggedImage);
    
    setPendingImages(newImages);
    setDraggedIndex(null);
  };

  const confirmUpload = async () => {
    if (pendingImages.length === 0) return;

    setUploading(true);
    try {
      const newImages: CarImage[] = [];
      
      for (const pendingImage of pendingImages) {
        // Create a unique file name with timestamp
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const fileExtension = pendingImage.file.name.split('.').pop() || 'jpg';
        const fileName = `${vehicleId}/${timestamp}_${randomId}.${fileExtension}`;

        console.log('Uploading car image:', fileName);

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(fileName, pendingImage.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading car image:', uploadError);
          toast.error(`Failed to upload ${pendingImage.file.name}`);
          continue;
        }

        console.log('Car image uploaded successfully:', uploadData);

        // Get the public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('car-images')
          .getPublicUrl(fileName);

        const newImage: CarImage = {
          id: `${timestamp}_${randomId}`,
          url: urlData.publicUrl,
          name: pendingImage.file.name,
          size: pendingImage.file.size,
          uploadedAt: new Date().toISOString()
        };
        
        newImages.push(newImage);
        console.log('Created car image object:', newImage);
      }

      if (newImages.length > 0) {
        // Update the images list - add new images to existing ones
        const updatedImages = [...currentImages, ...newImages];
        onImagesUpdate(updatedImages);
        
        toast.success(`${newImages.length} car image(s) uploaded successfully`);
        
        // Clear pending images and revoke blob URLs
        pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
        setPendingImages([]);
      }
    } catch (error) {
      console.error('Error uploading car images:', error);
      toast.error('Failed to upload car images');
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    // Revoke all blob URLs and clear pending images
    pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
    setPendingImages([]);
  };

  const handleRemoveImage = async (imageId: string) => {
    const imageToRemove = currentImages.find(img => img.id === imageId);
    if (!imageToRemove) return;

    try {
      // Extract the file path from the URL
      const urlParts = imageToRemove.url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'car-images');
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        
        console.log('Removing car image from storage:', filePath);
        
        // Delete from Supabase Storage
        const { error } = await supabase.storage
          .from('car-images')
          .remove([filePath]);

        if (error) {
          console.error('Error removing car image from storage:', error);
          // Continue anyway to remove from the UI
        }
      }
    } catch (error) {
      console.error('Error parsing image URL for deletion:', error);
    }

    // Remove from the current images list
    const updatedImages = currentImages.filter(img => img.id !== imageId);
    onImagesUpdate(updatedImages);
    toast.success('Car image removed');
  };

  const handleAddImages = () => {
    fileInputRef.current?.click();
  };

  const nextImage = () => {
    const totalImages = pendingImages.length > 0 ? pendingImages.length : currentImages.length;
    setCarouselIndex((prev) => (prev + 1) % totalImages);
  };

  const prevImage = () => {
    const totalImages = pendingImages.length > 0 ? pendingImages.length : currentImages.length;
    setCarouselIndex((prev) => (prev - 1 + totalImages) % totalImages);
  };

  // Get preview images (either pending or current)
  const previewImages = pendingImages.length > 0 ? pendingImages : currentImages;

  // Helper functions to safely access properties
  const getImageUrl = (image: PendingImage | CarImage) => {
    return 'preview' in image ? image.preview : image.url;
  };

  const getImageName = (image: PendingImage | CarImage) => {
    return 'file' in image ? image.file.name : image.name;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Car Images
          {(currentImages.length > 0 || pendingImages.length > 0) && (
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  <Eye className="w-4 h-4 mr-2" />
                  {pendingImages.length > 0 ? 'Preview Before Upload' : 'View-Only Preview'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>
                    {pendingImages.length > 0 ? 'Preview Before Upload' : 'View-Only Account Preview'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {previewImages.length === 1 ? (
                    <div className="relative">
                      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                        <img
                          src={getImageUrl(previewImages[0])}
                          alt="Vehicle preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {getImageName(previewImages[0])}
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                        <img
                          src={getImageUrl(previewImages[carouselIndex])}
                          alt={`Vehicle preview ${carouselIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Carousel Controls */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                        onClick={prevImage}
                        disabled={previewImages.length <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                        onClick={nextImage}
                        disabled={previewImages.length <= 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {carouselIndex + 1} / {previewImages.length}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-muted-foreground">
                          {getImageName(previewImages[carouselIndex])}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Image {carouselIndex + 1} of {previewImages.length}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground p-4 bg-blue-50 rounded-lg">
                    <strong>{pendingImages.length > 0 ? 'Upload Preview:' : 'View-Only Preview:'}</strong> 
                    {pendingImages.length > 0 ? 
                      ' This is how your images will appear to view-only accounts after upload. The first image will be the main thumbnail.' :
                      ' This is how your uploaded images appear to view-only accounts.'
                    }
                    {previewImages.length > 1 && " They can navigate through all images using the arrow buttons or by clicking on the image."}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Images Preview */}
        {pendingImages.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Images to Upload ({pendingImages.length})</h3>
              <p className="text-xs text-muted-foreground">Drag to reorder • First image will be the main thumbnail</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pendingImages.map((image, index) => (
                <div 
                  key={image.id} 
                  className="relative group cursor-move"
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={image.preview}
                      alt={image.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Main Thumbnail
                    </div>
                  )}
                  <div className="absolute top-2 right-8 bg-black bg-opacity-70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-3 h-3" />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removePendingImage(image.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <div className="mt-1 text-xs text-muted-foreground truncate">
                    {image.file.name}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={confirmUpload}
                disabled={disabled || uploading}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : `Upload ${pendingImages.length} Image${pendingImages.length > 1 ? 's' : ''}`}
              </Button>
              <Button 
                variant="outline"
                onClick={cancelUpload}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div>
          <Button 
            onClick={handleAddImages}
            disabled={disabled || uploading}
            className="w-full"
            variant={pendingImages.length > 0 ? "outline" : "default"}
          >
            <Upload className="w-4 h-4 mr-2" />
            {pendingImages.length > 0 ? 'Add More Images' : 'Add Car Images'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Current Images Grid */}
        {currentImages.length > 0 && pendingImages.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {currentImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Error loading car image:', image.url);
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                {index === 0 && currentImages.length > 1 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Header Image
                  </div>
                )}
                {currentImages.length > 1 && index === 0 && (
                  <div className="absolute top-2 right-8 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    +{currentImages.length - 1} more
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveImage(image.id)}
                  disabled={disabled}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </Button>
                <div className="mt-1 text-xs text-muted-foreground truncate">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {currentImages.length === 0 && pendingImages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No car images added yet</p>
            <p className="text-sm">Click "Add Car Images" to upload photos of this vehicle</p>
          </div>
        )}
        
        {(currentImages.length > 0 || pendingImages.length > 0) && (
          <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
            <strong>Note:</strong> The first image will be used as the header image in view-only accounts. 
            {(currentImages.length > 1 || pendingImages.length > 1) && " View-only users can click on it to see all images in a carousel view."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
