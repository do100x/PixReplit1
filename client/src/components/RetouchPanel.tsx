import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateEditedImage } from '@/services/geminiService';
import { Hotspot } from '@/types';

interface RetouchPanelProps {
  currentImage: File;
  hotspot: Hotspot | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addImageToHistory: (file: File) => void;
  onHotspotClear: () => void;
}

const QUICK_ACTIONS = [
  { label: 'Remove background', prompt: 'remove the background completely' },
  { label: 'Enhance eyes', prompt: 'enhance and brighten the eyes' },
  { label: 'Smooth skin', prompt: 'smooth and enhance the skin texture' },
  { label: 'Whiten teeth', prompt: 'whiten and brighten the teeth' },
];

export default function RetouchPanel({
  currentImage,
  hotspot,
  isLoading,
  setIsLoading,
  setError,
  addImageToHistory,
  onHotspotClear
}: RetouchPanelProps) {
  const [prompt, setPrompt] = useState<string>('');

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentImage) {
      setError('No image loaded to edit.');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a description for your edit.');
      return;
    }

    if (!hotspot) {
      setError('Please click on the image to select an area to edit.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const editedImageFile = await generateEditedImage(currentImage, prompt, hotspot);
      addImageToHistory(editedImageFile);
      onHotspotClear();
      setPrompt('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate the image. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, prompt, hotspot, setIsLoading, setError, addImageToHistory, onHotspotClear]);

  const handleQuickAction = useCallback(async (actionPrompt: string) => {
    if (!hotspot) {
      setError('Please click on the image to select an area first.');
      return;
    }

    setPrompt(actionPrompt);
    
    setIsLoading(true);
    setError(null);

    try {
      const editedImageFile = await generateEditedImage(currentImage, actionPrompt, hotspot);
      addImageToHistory(editedImageFile);
      onHotspotClear();
      setPrompt('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to apply the action. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, hotspot, setIsLoading, setError, addImageToHistory, onHotspotClear]);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">AI-Powered Retouching</h3>
        <p className="text-muted-foreground" data-testid="text-retouch-instructions">
          {hotspot 
            ? 'Great! Now describe your localized edit below.' 
            : 'Click an area on the image to make a precise edit.'
          }
        </p>
      </div>

      <form onSubmit={handleGenerate} className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={hotspot ? "e.g., 'remove this blemish', 'change shirt color to blue', 'add sunglasses'" : "First click a point on the image"}
            className="w-full bg-input border border-border text-foreground text-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 placeholder:text-muted-foreground"
            disabled={isLoading || !hotspot}
            data-testid="input-retouch-prompt"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !prompt.trim() || !hotspot}
          className="bg-gradient-to-r from-primary to-purple-500 text-white font-semibold py-3 px-8 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:from-primary/50 disabled:to-purple-500/50 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          data-testid="button-generate-retouch"
        >
          Generate
        </Button>
      </form>

      {/* Quick Actions */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Quick Actions:</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.label}
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAction(action.prompt)}
              disabled={isLoading || !hotspot}
              className="px-3 py-1.5 text-sm bg-accent hover:bg-accent/80 text-foreground transition-all duration-200"
              data-testid={`button-quick-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
