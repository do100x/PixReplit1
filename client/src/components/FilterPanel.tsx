import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FilterPanelProps {
  onApplyFilter: (filterPrompt: string) => Promise<void>;
  isLoading: boolean;
}

interface FilterPreset {
  id: string;
  name: string;
  prompt: string;
  gradient: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  { id: 'vintage', name: 'Vintage', prompt: 'apply a warm vintage film look with sepia tones', gradient: 'from-amber-400 to-orange-500' },
  { id: 'cinematic', name: 'Cinematic', prompt: 'apply a cinematic blue and orange color grading', gradient: 'from-blue-900 to-purple-900' },
  { id: 'bw', name: 'B&W', prompt: 'convert to black and white with high contrast', gradient: 'from-gray-700 to-gray-900' },
  { id: 'neon', name: 'Neon', prompt: 'apply a cyberpunk neon glow effect with vibrant colors', gradient: 'from-pink-500 to-violet-500' },
  { id: 'soft', name: 'Soft Focus', prompt: 'apply a soft dreamy filter with gentle lighting', gradient: 'from-rose-300 to-pink-300' },
  { id: 'dramatic', name: 'Dramatic', prompt: 'enhance drama with deep shadows and rich colors', gradient: 'from-red-600 to-black' },
  { id: 'pastel', name: 'Pastel', prompt: 'apply soft pastel colors with light airy feeling', gradient: 'from-cyan-200 to-blue-200' },
  { id: 'noir', name: 'Film Noir', prompt: 'apply classic film noir style with dramatic lighting', gradient: 'from-gray-900 to-black' },
];

export default function FilterPanel({
  onApplyFilter,
  isLoading
}: FilterPanelProps) {
  const [prompt, setPrompt] = useState<string>('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      await onApplyFilter(prompt.trim());
      setPrompt('');
    }
  }, [prompt, onApplyFilter]);

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <div className="text-center mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-2">Creative Filters</h3>
        <p className="text-muted-foreground text-sm sm:text-base">Apply artistic styles and effects to your image</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="flex-1">
          <Input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'vintage film look', 'cyberpunk style'"
            className="w-full bg-input border border-border text-foreground text-base sm:text-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 placeholder:text-muted-foreground min-h-[48px]"
            disabled={isLoading}
            data-testid="input-filter-prompt"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="bg-gradient-to-r from-primary to-purple-500 text-white font-semibold py-3 px-6 sm:px-8 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:from-primary/50 disabled:to-purple-500/50 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none touch-manipulation min-h-[48px]"
          data-testid="button-apply-filter"
        >
          Apply
        </Button>
      </form>

      {/* Filter Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {FILTER_PRESETS.map((filter) => (
          <div
            key={filter.id}
            className="group cursor-pointer touch-manipulation"
            onClick={() => !isLoading && onApplyFilter(filter.prompt)}
            data-testid={`filter-preset-${filter.id}`}
          >
            <div 
              className={`aspect-square bg-gradient-to-br ${filter.gradient} rounded-lg mb-2 transition-transform duration-200 group-hover:scale-105 active:scale-95 min-h-[80px] sm:min-h-[100px] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            ></div>
            <p className="text-xs sm:text-sm font-medium text-center">{filter.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}