import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateAdjustedImage } from '@/services/geminiService';
import { AdjustmentPreset } from '@/types';

interface AdjustPanelProps {
  currentImage: File;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addImageToHistory: (file: File) => void;
}

const ADJUSTMENT_PRESETS: AdjustmentPreset[] = [
  { id: 'brightness', name: 'Brightness', description: 'Make it brighter', prompt: 'increase the brightness of the image' },
  { id: 'contrast', name: 'Contrast', description: 'Enhance contrast', prompt: 'increase the contrast to make the image more dramatic' },
  { id: 'saturation', name: 'Saturation', description: 'More vivid colors', prompt: 'increase the saturation to make colors more vivid' },
  { id: 'warmth', name: 'Warmth', description: 'Warmer tone', prompt: 'make the image warmer with more yellow and orange tones' },
  { id: 'exposure', name: 'Exposure', description: 'Fix exposure', prompt: 'correct the exposure for better lighting' },
  { id: 'shadows', name: 'Shadows', description: 'Lift shadows', prompt: 'brighten the shadow areas while preserving highlights' },
];

export default function AdjustPanel({
  currentImage,
  isLoading,
  setIsLoading,
  setError,
  addImageToHistory
}: AdjustPanelProps) {
  const [prompt, setPrompt] = useState<string>('');

  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError('No image loaded to apply an adjustment to.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const adjustedImageFile = await generateAdjustedImage(currentImage, adjustmentPrompt);
      addImageToHistory(adjustedImageFile);
      setPrompt('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to apply the adjustment. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, setIsLoading, setError, addImageToHistory]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      await handleApplyAdjustment(prompt.trim());
    }
  }, [prompt, handleApplyAdjustment]);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Global Adjustments</h3>
        <p className="text-muted-foreground">Describe the overall changes you want to make to your image</p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'make it brighter', 'increase contrast', 'warmer colors'"
            className="w-full bg-input border border-border text-foreground text-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 placeholder:text-muted-foreground"
            disabled={isLoading}
            data-testid="input-adjustment-prompt"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="bg-gradient-to-r from-primary to-purple-500 text-white font-semibold py-3 px-8 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:from-primary/50 disabled:to-purple-500/50 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
          data-testid="button-apply-adjustment"
        >
          Apply
        </Button>
      </form>

      {/* Adjustment Presets */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ADJUSTMENT_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="secondary"
            onClick={() => handleApplyAdjustment(preset.prompt)}
            disabled={isLoading}
            className="p-4 bg-accent hover:bg-accent/80 text-left transition-all duration-200 hover:scale-105 h-auto flex flex-col items-start"
            data-testid={`button-preset-${preset.id}`}
          >
            <div className="text-sm font-medium">{preset.name}</div>
            <div className="text-xs text-muted-foreground">{preset.description}</div>
          </Button>
        ))}
      </div>
    </div>
  );
}
