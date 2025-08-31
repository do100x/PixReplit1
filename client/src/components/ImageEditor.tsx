import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { ImageHistoryItem, Tab, Hotspot } from '@/types';
import LoadingOverlay from './LoadingOverlay';
import RetouchPanel from './RetouchPanel';
import AdjustPanel from './AdjustPanel';
import FilterPanel from './FilterPanel';
import CropPanel from './CropPanel';
import { Button } from '@/components/ui/button';

interface ImageEditorProps {
  currentImage: ImageHistoryItem;
  originalImage: ImageHistoryItem | null;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addImageToHistory: (file: File) => void;
  isComparing: boolean;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'retouch', label: 'Retouch' },
  { id: 'adjust', label: 'Adjust' },
  { id: 'filters', label: 'Filters' },
  { id: 'crop', label: 'Crop' },
];

export default function ImageEditor({
  currentImage,
  originalImage,
  activeTab,
  setActiveTab,
  isLoading,
  setIsLoading,
  setError,
  addImageToHistory,
  isComparing
}: ImageEditorProps) {
  const [hotspot, setHotspot] = useState<Hotspot | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTab !== 'retouch') return;

    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;

    const originalX = Math.round(offsetX * scaleX);
    const originalY = Math.round(offsetY * scaleY);

    setHotspot({ x: originalX, y: originalY });
  }, [activeTab]);

  const handleCropComplete = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
      setError('Please select an area to crop.');
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Could not process the crop.');
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `cropped-${Date.now()}.png`, { type: 'image/png' });
        addImageToHistory(file);
        setCrop(undefined);
        setCompletedCrop(undefined);
      }
    }, 'image/png');
  }, [completedCrop, addImageToHistory, setError]);

  const renderImageDisplay = () => {
    if (activeTab === 'crop') {
      return (
        <ReactCrop
          crop={crop}
          onChange={c => setCrop(c)}
          onComplete={c => setCompletedCrop(c)}
          aspect={aspect}
          className="max-h-[70vh]"
        >
          <img
            ref={imgRef}
            src={currentImage.url}
            alt="Crop this image"
            className="w-full h-auto object-contain max-h-[70vh] rounded-xl"
            data-testid="img-crop"
          />
        </ReactCrop>
      );
    }

    return (
      <div className="relative">
        {originalImage && isComparing && (
          <img
            src={originalImage.url}
            alt="Original"
            className="w-full h-auto object-contain max-h-[70vh] rounded-xl pointer-events-none"
            data-testid="img-original"
          />
        )}
        
        <img
          ref={imgRef}
          src={currentImage.url}
          alt="Current"
          onClick={handleImageClick}
          className={`${isComparing ? 'absolute top-0 left-0' : ''} w-full h-auto object-contain max-h-[70vh] rounded-xl transition-opacity duration-200 ease-in-out ${
            isComparing ? 'opacity-0' : 'opacity-100'
          } ${activeTab === 'retouch' ? 'cursor-crosshair' : ''}`}
          data-testid="img-current"
        />

        {hotspot && !isLoading && activeTab === 'retouch' && (
          <div
            className="absolute w-6 h-6 bg-primary/60 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 hotspot-marker z-10"
            style={{
              left: `${(hotspot.x / imgRef.current!.naturalWidth) * imgRef.current!.clientWidth}px`,
              top: `${(hotspot.y / imgRef.current!.naturalHeight) * imgRef.current!.clientHeight}px`
            }}
            data-testid="hotspot-marker"
          >
            <div className="absolute inset-0 rounded-full bg-primary/40 animate-pulse-soft"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      {/* Image Canvas Area */}
      <div className="relative mb-8">
        <div className="relative bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
          {isLoading && <LoadingOverlay />}
          {renderImageDisplay()}
          
          {isComparing && originalImage && currentImage !== originalImage && (
            <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium border border-border">
              <span data-testid="text-comparison-label">
                {isComparing ? 'Original' : 'Edited'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-1 flex items-center gap-1 mb-8">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full py-3 px-6 rounded-md font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent bg-transparent border-none'
            }`}
            variant="ghost"
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <div className="space-y-6">
        {activeTab === 'retouch' && (
          <RetouchPanel
            currentImage={currentImage.file}
            hotspot={hotspot}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
            addImageToHistory={addImageToHistory}
            onHotspotClear={() => setHotspot(null)}
          />
        )}
        
        {activeTab === 'adjust' && (
          <AdjustPanel
            currentImage={currentImage.file}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
            addImageToHistory={addImageToHistory}
          />
        )}
        
        {activeTab === 'filters' && (
          <FilterPanel
            currentImage={currentImage.file}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
            addImageToHistory={addImageToHistory}
          />
        )}
        
        {activeTab === 'crop' && (
          <CropPanel
            onApplyCrop={handleCropComplete}
            onSetAspect={setAspect}
            isLoading={isLoading}
            isCropping={!!completedCrop?.width && completedCrop.width > 0}
          />
        )}
      </div>
    </div>
  );
}
