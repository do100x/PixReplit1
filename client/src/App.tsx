/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect, useRef as useRef2 } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import { UndoIcon, RedoIcon, EyeIcon } from './components/icons';
import StartScreen from './components/StartScreen';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  if (arr.length < 2) throw new Error("Invalid data URL");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

type Tab = 'retouch' | 'adjust' | 'filters' | 'crop';

const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{x: number, y: number} | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{x: number, y: number} | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);

  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setActiveTab('retouch');
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError('No image loaded to edit.');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a description for your edit.');
      return;
    }

    if (!editHotspot) {
      setError('Please click on the image to select an area to edit.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot);
      const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
      addImageToHistory(newImageFile);
      setEditHotspot(null);
      setDisplayHotspot(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate the image. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory]);

  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply a filter to.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
      const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
      addImageToHistory(newImageFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to apply the filter. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply an adjustment to.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
      const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
      addImageToHistory(newImageFile);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to apply the adjustment. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyCrop = useCallback(() => {
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

    const croppedImageUrl = canvas.toDataURL('image/png');
    const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
    addImageToHistory(newImageFile);
  }, [completedCrop, addImageToHistory]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canUndo, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setEditHotspot(null);
      setDisplayHotspot(null);
    }
  }, [history]);

  const handleUploadNew = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
    setError(null);
    setPrompt('');
    setEditHotspot(null);
    setDisplayHotspot(null);
  }, []);

  const handleDownload = useCallback(() => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(currentImage);
      link.download = `edited-${currentImage.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  }, [currentImage]);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const tabs: Tab[] = ['retouch', 'adjust', 'filters', 'crop'];
  
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const currentIndex = tabs.indexOf(activeTab);
    if (direction === 'left' && currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  }, [activeTab]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
    
    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = Math.abs(touchEndRef.current.y - touchStartRef.current.y);
    
    // Only trigger swipe if horizontal movement is significant and vertical is minimal
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
    }
    
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [handleSwipe]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTab !== 'retouch') return;

    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDisplayHotspot({ x: offsetX, y: offsetY });

    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
    const scaleX = naturalWidth / clientWidth;
    const scaleY = naturalHeight / clientHeight;

    const originalX = Math.round(offsetX * scaleX);
    const originalY = Math.round(offsetY * scaleY);

    setEditHotspot({ x: originalX, y: originalY });
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center animate-fade-in bg-red-500/10 border border-red-500/20 p-8 rounded-lg max-w-2xl mx-auto flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-red-300">An Error Occurred</h2>
          <p className="text-md text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-md transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!currentImageUrl) {
      return <StartScreen onImageUpload={handleImageUpload} />;
    }

    const imageDisplay = (
      <div className="relative">
        {/* Base image is the original, always at the bottom */}
        {originalImageUrl && (
          <img
            key={originalImageUrl}
            src={originalImageUrl}
            alt="Original"
            className="w-full h-auto object-contain max-h-[40vh] sm:max-h-[60vh] rounded-xl pointer-events-none"
          />
        )}

        {/* The current image is an overlay that fades in/out for comparison */}
        <img
          ref={imgRef}
          key={currentImageUrl}
          src={currentImageUrl}
          alt="Current"
          onClick={handleImageClick}
          className={`absolute top-0 left-0 w-full h-auto object-contain max-h-[40vh] sm:max-h-[60vh] rounded-xl transition-opacity duration-200 ease-in-out ${
            isComparing ? 'opacity-0' : 'opacity-100'
          } ${activeTab === 'retouch' ? 'cursor-crosshair' : ''}`}
        />
      </div>
    );

    // For ReactCrop, we need a single image element. We'll use the current one.
    const cropImageElement = (
      <img
        ref={imgRef}
        key={`crop-${currentImageUrl}`}
        src={currentImageUrl}
        alt="Crop this image"
        className="w-full h-auto object-contain max-h-[40vh] sm:max-h-[60vh] rounded-xl"
      />
    );

    return (
      <div className="w-full max-w-6xl mx-auto animate-fade-in space-y-4 sm:space-y-6 relative px-4 sm:px-0">
        {/* Image Canvas Area */}
        <div className="relative">
          <div className="relative bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 z-50 flex flex-col items-center justify-center gap-4 animate-fade-in">
                <Spinner />
                <p className="text-gray-300 font-medium">AI is working its magic...</p>
                <p className="text-sm text-gray-500">This may take a few seconds</p>
              </div>
            )}

            {activeTab === 'crop' ? (
              <div className="flex justify-center items-center">
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  onComplete={c => setCompletedCrop(c)}
                  aspect={aspect}
                  className="max-h-[50vh] sm:max-h-[70vh]"
                >
                  {cropImageElement}
                </ReactCrop>
              </div>
            ) : (
              <>
                {imageDisplay}
                {displayHotspot && !isLoading && activeTab === 'retouch' && imgRef.current && (
                  <div
                    className="absolute w-8 h-8 sm:w-6 sm:h-6 bg-blue-400 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 z-10 touch-manipulation"
                    style={{
                      left: `${displayHotspot.x}px`,
                      top: `${displayHotspot.y}px`
                    }}
                  >
                    <div className="absolute inset-0 rounded-full bg-blue-400/40 animate-pulse"></div>
                  </div>
                )}
              </>
            )}

            {isComparing && originalImage && currentImage !== originalImage && (
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium text-white border border-gray-700">
                {isComparing ? 'Original' : 'Edited'}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-1 grid grid-cols-4 gap-1 sm:flex sm:items-center relative">
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 sm:hidden">
            Swipe left or right to switch tabs
          </div>
          {[
            { id: 'retouch', label: 'Retouch' },
            { id: 'adjust', label: 'Adjust' },
            { id: 'filters', label: 'Filters' },
            { id: 'crop', label: 'Crop' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`w-full py-4 px-3 sm:px-6 rounded-md font-semibold transition-all duration-200 touch-manipulation min-h-[48px] ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50 active:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        <div 
          className="space-y-6"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {activeTab === 'retouch' && (
            <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 animate-fade-in backdrop-blur-sm">
              <h3 className="text-base sm:text-lg font-semibold text-center text-gray-300">
                {editHotspot ? 'Describe your precise edit' : 'Tap a point on the image'}
              </h3>
              
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={editHotspot ? "e.g., 'remove this blemish', 'change shirt color'" : "First tap a point on the image"}
                  className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm sm:text-base min-h-[48px]"
                  disabled={isLoading || !editHotspot}
                />
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim() || !editHotspot}
                  className="bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold py-4 px-6 sm:px-8 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-sm sm:text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none touch-manipulation min-h-[48px] whitespace-nowrap"
                >
                  Generate
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'adjust' && (
            <AdjustmentPanel
              onApplyAdjustment={handleApplyAdjustment}
              isLoading={isLoading}
            />
          )}
          
          {activeTab === 'filters' && (
            <FilterPanel
              onApplyFilter={handleApplyFilter}
              isLoading={isLoading}
            />
          )}
          
          {activeTab === 'crop' && (
            <CropPanel
              onApplyCrop={handleApplyCrop}
              onSetAspect={setAspect}
              isLoading={isLoading}
              isCropping={!!completedCrop?.width && completedCrop.width > 0}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-100" style={{
      backgroundColor: '#090A0F',
      background: `
        radial-gradient(ellipse at 20% 80%, rgba(150,50,100,0.25) 0%, rgba(150,50,100,0) 60%),
        radial-gradient(ellipse at 80% 30%, rgba(80,150,120,0.2) 0%, rgba(80,150,120,0) 50%),
        radial-gradient(ellipse at 50% 50%, rgba(50,80,150,0.3) 0%, rgba(50,80,150,0) 70%),
        radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)
      `,
      backgroundSize: '250% 250%'
    }}>
      <Header />
      
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center gap-8">
          {/* Toolbar */}
          {currentImage && (
            <div className="flex items-center justify-center gap-2 sm:gap-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg px-3 sm:px-4 py-3">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-3 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center active:scale-95"
                title="Undo"
              >
                <UndoIcon className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-3 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center active:scale-95"
                title="Redo"
              >
                <RedoIcon className="w-5 h-5" />
              </button>
              
              <div className="h-6 w-px bg-gray-600"></div>
              
              {historyIndex > 0 && (
                <button
                  onClick={() => setIsComparing(!isComparing)}
                  className="p-3 sm:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center active:scale-95"
                  title="Compare with original"
                >
                  <EyeIcon className="w-5 h-5" />
                </button>
              )}
              
              <div className="h-6 w-px bg-gray-600"></div>
              
              <button
                onClick={handleReset}
                className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors touch-manipulation min-h-[48px] active:scale-95"
              >
                Reset
              </button>
              
              <button
                onClick={handleUploadNew}
                className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors touch-manipulation min-h-[48px] active:scale-95"
              >
                New Image
              </button>
              
              <button
                onClick={handleDownload}
                className="px-4 py-3 text-sm font-medium bg-gradient-to-r from-green-600 to-green-500 text-white rounded-md hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 touch-manipulation min-h-[48px] active:scale-95"
              >
                Download
              </button>
            </div>
          )}
          
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
