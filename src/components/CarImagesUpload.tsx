
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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

export function CarImagesUpload({ vehicleId, currentImages, onImagesUpdate, disabled }: CarImagesUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newImages: CarImage[] = [];
      
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        // Create a unique file name with timestamp
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2);
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const fileName = `${vehicleId}/${timestamp}_${randomId}.${fileExtension}`;

        console.log('Uploading car image:', fileName);

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading car image:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
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
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };
        
        newImages.push(newImage);
        console.log('Created car image object:', newImage);
      }

      if (newImages.length > 0) {
        // Update the images list
        const updatedImages = [...currentImages, ...newImages];
        onImagesUpdate(updatedImages);
        
        toast.success(`${newImages.length} car image(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Error uploading car images:', error);
      toast.error('Failed to upload car images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
    setCarouselIndex((prev) => (prev + 1) % currentImages.length);
  };

  const prevImage = () => {
    setCarouselIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Car Images
          {currentImages.length > 0 && (
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview View-Only
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>View-Only Account Preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {currentImages.length === 1 ? (
                    <div className="relative">
                      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                        <img
                          src={currentImages[0].url}
                          alt="Vehicle preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{currentImages[0].name}</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                        <img
                          src={currentImages[carouselIndex].url}
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
                        disabled={currentImages.length <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                        onClick={nextImage}
                        disabled={currentImages.length <= 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {carouselIndex + 1} / {currentImages.length}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-muted-foreground">{currentImages[carouselIndex].name}</p>
                        <p className="text-sm text-muted-foreground">
                          Image {carouselIndex + 1} of {currentImages.length}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground p-4 bg-blue-50 rounded-lg">
                    <strong>View-Only Preview:</strong> This is how your uploaded images will appear to view-only accounts. 
                    {currentImages.length > 1 && " They can navigate through all images using the arrow buttons or by clicking on the image."}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Button */}
        <div>
          <Button 
            onClick={handleAddImages}
            disabled={disabled || uploading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Add Car Images'}
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

        {/* Images Grid */}
        {currentImages.length > 0 ? (
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
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No car images added yet</p>
            <p className="text-sm">Click "Add Car Images" to upload photos of this vehicle</p>
          </div>
        )}
        
        {currentImages.length > 0 && (
          <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
            <strong>Note:</strong> The first image will be used as the header image in view-only accounts. 
            {currentImages.length > 1 && " View-only users can click on it to see all images in a carousel view."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
