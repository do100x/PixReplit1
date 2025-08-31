import { useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StartScreenProps {
  onImageUpload: (file: File) => void;
}

const SAMPLE_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    alt: "Sample portrait",
    label: "Portrait"
  },
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    alt: "Sample landscape",
    label: "Landscape"
  },
  {
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    alt: "Sample object",
    label: "Product"
  },
  {
    url: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    alt: "Sample architecture",
    label: "Architecture"
  }
];

export default function StartScreen({ onImageUpload }: StartScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onImageUpload(file);
      }
    }
  }, [onImageUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleSampleImageClick = useCallback(async (imageUrl: string, label: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `sample-${label.toLowerCase()}.jpg`, { type: blob.type });
      onImageUpload(file);
    } catch (error) {
      console.error('Failed to load sample image:', error);
    }
  }, [onImageUpload]);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          AI-Powered Photo Editor
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Upload your image and transform it with AI. Retouch, apply filters, make adjustments, and crop with simple text prompts.
        </p>
      </div>

      {/* Upload Zone */}
      <div 
        className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-12 text-center transition-all duration-300 hover:bg-accent/20 cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        data-testid="upload-zone"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-500 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Upload Your Image</h3>
            <p className="text-muted-foreground mb-4">Drag and drop your image here, or click to browse</p>
            <Button 
              className="bg-gradient-to-r from-primary to-purple-500 text-white px-6 py-3 font-medium hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
              data-testid="button-choose-file"
            >
              Choose File
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Supports JPG, PNG, WebP up to 10MB
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        data-testid="input-file"
      />

      {/* Sample Images */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold mb-6 text-center">Or try with sample images</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SAMPLE_IMAGES.map((image, index) => (
            <div 
              key={index}
              className="group cursor-pointer"
              onClick={() => handleSampleImageClick(image.url, image.label)}
              data-testid={`sample-image-${image.label.toLowerCase()}`}
            >
              <img 
                src={image.url} 
                alt={image.alt} 
                className="w-full h-24 object-cover rounded-lg group-hover:shadow-lg transition-all duration-200" 
              />
              <p className="text-sm text-muted-foreground mt-2 text-center">{image.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
