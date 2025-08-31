import { useState, useCallback, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import StartScreen from '@/components/StartScreen';
import ImageEditor from '@/components/ImageEditor';
import { ImageHistoryItem, Tab } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [history, setHistory] = useState<ImageHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const { toast } = useToast();

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    const url = URL.createObjectURL(newImageFile);
    const newItem: ImageHistoryItem = { file: newImageFile, url };
    newHistory.push(newItem);
    
    // Clean up old URLs
    if (historyIndex >= 0 && historyIndex < history.length - 1) {
      for (let i = historyIndex + 1; i < history.length; i++) {
        URL.revokeObjectURL(history[i].url);
      }
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    // Clean up existing URLs
    history.forEach(item => URL.revokeObjectURL(item.url));
    
    const url = URL.createObjectURL(file);
    const newItem: ImageHistoryItem = { file, url };
    
    setError(null);
    setHistory([newItem]);
    setHistoryIndex(0);
    setActiveTab('retouch');
    setIsComparing(false);
  }, [history]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
    }
  }, [canUndo, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
    }
  }, [canRedo, historyIndex]);

  const handleReset = useCallback(() => {
    if (history.length > 0) {
      setHistoryIndex(0);
      setError(null);
      setIsComparing(false);
    }
  }, [history.length]);

  const handleUploadNew = useCallback(() => {
    // Clean up URLs
    history.forEach(item => URL.revokeObjectURL(item.url));
    
    setHistory([]);
    setHistoryIndex(-1);
    setError(null);
    setActiveTab('retouch');
    setIsComparing(false);
  }, [history]);

  const handleDownload = useCallback(() => {
    if (currentImage) {
      const link = document.createElement('a');
      link.href = currentImage.url;
      link.download = `edited-${currentImage.file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your edited image is being downloaded.",
      });
    }
  }, [currentImage, toast]);

  const toggleComparison = useCallback(() => {
    if (originalImage && currentImage && historyIndex > 0) {
      setIsComparing(!isComparing);
    }
  }, [originalImage, currentImage, historyIndex, isComparing]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      history.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-[hsl(234,30%,6%)]">
        <Header
          canUndo={false}
          canRedo={false}
          onUndo={() => {}}
          onRedo={() => {}}
          onReset={() => {}}
          onDownload={() => {}}
          onToggleComparison={() => {}}
          onUploadNew={() => {}}
          isComparing={false}
          hasImage={false}
        />
        <main className="container mx-auto px-4 py-8">
          <div className="w-full max-w-2xl mx-auto text-center animate-fade-in">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-destructive">An Error Occurred</h2>
                <p className="text-destructive/80">{error}</p>
                <button 
                  className="bg-destructive hover:bg-destructive/80 text-destructive-foreground font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                  onClick={() => setError(null)}
                  data-testid="button-retry"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-[hsl(234,30%,6%)]">
      <Header
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleReset}
        onDownload={handleDownload}
        onToggleComparison={toggleComparison}
        onUploadNew={handleUploadNew}
        isComparing={isComparing}
        hasImage={!!currentImage}
      />
      
      <main className="container mx-auto px-4 py-8">
        {!currentImage ? (
          <StartScreen onImageUpload={handleImageUpload} />
        ) : (
          <ImageEditor
            currentImage={currentImage}
            originalImage={originalImage}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setError={setError}
            addImageToHistory={addImageToHistory}
            isComparing={isComparing}
          />
        )}
      </main>
    </div>
  );
}
