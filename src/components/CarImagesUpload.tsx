
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { CarImage } from '@/stores/vehicleStore';

interface CarImagesUploadProps {
  vehicleId: string;
  currentImages: CarImage[];
  onImagesUpdate: (images: CarImage[]) => void;
  disabled?: boolean;
}

export function CarImagesUpload({ vehicleId, currentImages, onImagesUpdate, disabled }: CarImagesUploadProps) {
  const [uploading, setUploading] = useState(false);
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

        // Create a preview URL for immediate display
        const url = URL.createObjectURL(file);
        const newImage: CarImage = {
          id: `temp_${Date.now()}_${Math.random()}`,
          url,
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };
        
        newImages.push(newImage);
      }

      // Update the images list
      const updatedImages = [...currentImages, ...newImages];
      onImagesUpdate(updatedImages);
      
      toast.success(`${newImages.length} image(s) added successfully`);
    } catch (error) {
      console.error('Error uploading car images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (imageId: string) => {
    const updatedImages = currentImages.filter(img => img.id !== imageId);
    onImagesUpdate(updatedImages);
    toast.success('Image removed');
  };

  const handleAddImages = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Car Images
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
            {currentImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Error loading image:', image.url);
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
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
      </CardContent>
    </Card>
  );
}
