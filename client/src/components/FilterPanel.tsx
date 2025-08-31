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
  previewImage: string;
  fallbackGradient: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  { 
    id: 'studio-ghibli', 
    name: 'Studio Ghibli', 
    prompt: 'Beautiful Studio Ghibli style artwork, soft watercolor textures, whimsical fantasy elements, rolling hills, magical creatures, detailed character design in Hayao Miyazaki animation style, cel-shaded rendering, warm lighting, enchanted forest background, dreamy atmosphere',
    previewImage: '/filter-previews/01_studio_ghibli.jpg',
    fallbackGradient: 'from-green-400 to-blue-500'
  },
  { 
    id: 'miyazaki-style', 
    name: 'Miyazaki Style', 
    prompt: 'Miyazaki animation style, hand-drawn 2D animation, traditional cel animation techniques, detailed character expressions, flowing hair and clothing, nature-inspired backgrounds, soft color palette, emotional storytelling through visual design, Japanese animation aesthetics',
    previewImage: '/filter-previews/02_miyazaki_style.jpg',
    fallbackGradient: 'from-emerald-400 to-teal-500'
  },
  { 
    id: 'cyberpunk', 
    name: 'Cyberpunk', 
    prompt: 'Cyberpunk futuristic style, neon lights, dark urban atmosphere, high-tech low-life aesthetic, glowing circuits, holographic displays, chrome and metal textures, rain-soaked streets, dramatic lighting, dystopian cityscape, digital punk fashion',
    previewImage: '/filter-previews/03_cyberpunk.jpg',
    fallbackGradient: 'from-cyan-500 to-purple-600'
  },
  { 
    id: 'y2k-aesthetic', 
    name: 'Y2K Aesthetic', 
    prompt: 'Y2K millennium aesthetic, chrome metallic surfaces, iridescent colors, translucent materials, futuristic optimism, digital glitch effects, holographic textures, space-age design elements, early 2000s nostalgia, technological utopian vibes',
    previewImage: '/filter-previews/04_y2k_aesthetic.jpg',
    fallbackGradient: 'from-silver-400 to-blue-500'
  },
  { 
    id: 'vaporwave', 
    name: 'Vaporwave', 
    prompt: 'Vaporwave aesthetic, synthwave retro style, pink and purple gradient backgrounds, geometric shapes, 80s nostalgia, neon grids, classical statues, Japanese text, glitch art effects, dreamy surreal atmosphere, vintage computer graphics',
    previewImage: '/filter-previews/05_vaporwave.jpg',
    fallbackGradient: 'from-pink-500 to-purple-500'
  },
  { 
    id: 'cottagecore', 
    name: 'Cottagecore', 
    prompt: 'Cottagecore aesthetic, rustic countryside charm, cozy cottage vibes, wildflower meadows, vintage floral patterns, handmade crafts, sustainable living, soft earth tones, pastoral scenes, romantic rural lifestyle, gentle natural lighting',
    previewImage: '/filter-previews/06_cottagecore.jpg',
    fallbackGradient: 'from-green-300 to-amber-400'
  },
  { 
    id: 'dark-academia', 
    name: 'Dark Academia', 
    prompt: 'Dark academia aesthetic, gothic architecture, vintage libraries, scholarly atmosphere, tweed and leather textures, candlelit study rooms, antique books, classical art, moody lighting, intellectual sophistication, autumn color palette',
    previewImage: '/filter-previews/07_dark_academia.jpg',
    fallbackGradient: 'from-amber-700 to-gray-800'
  },
  { 
    id: 'anime-manga', 
    name: 'Anime/Manga', 
    prompt: 'Anime manga style illustration, large expressive eyes, detailed hair rendering, dynamic poses, cell-shaded coloring, vibrant colors, Japanese comic book aesthetics, character-focused design, emotional expressions, clean line art',
    previewImage: '/filter-previews/08_anime_manga.jpg',
    fallbackGradient: 'from-orange-400 to-red-500'
  },
  { 
    id: 'pixar-3d', 
    name: 'Pixar 3D', 
    prompt: 'Pixar 3D animation style, high-quality computer graphics, stylized character design, warm emotional storytelling, detailed texture work, vibrant color schemes, family-friendly appeal, professional 3D rendering, cinematic lighting',
    previewImage: '/filter-previews/09_pixar_3d.jpg',
    fallbackGradient: 'from-yellow-400 to-orange-500'
  },
  { 
    id: 'art-nouveau', 
    name: 'Art Nouveau', 
    prompt: 'Art Nouveau style, flowing organic lines, floral motifs, elegant curved designs, decorative patterns, vintage poster aesthetics, natural forms inspiration, ornamental details, golden age illustration, sophisticated artistic movement',
    previewImage: '/filter-previews/10_art_nouveau.jpg',
    fallbackGradient: 'from-gold-400 to-amber-600'
  },
  { 
    id: 'minimalism', 
    name: 'Minimalism', 
    prompt: 'Minimalist design style, clean simple lines, negative space usage, monochromatic color schemes, geometric shapes, modern aesthetic, less-is-more philosophy, contemporary art approach, refined simplicity, sophisticated restraint',
    previewImage: '/filter-previews/11_minimalism.jpg',
    fallbackGradient: 'from-gray-200 to-gray-400'
  },
  { 
    id: 'maximalism', 
    name: 'Maximalism', 
    prompt: 'Maximalist style, bold vibrant colors, rich detailed patterns, eclectic mix of elements, layered textures, ornate decorations, more-is-more philosophy, expressive abundance, dynamic visual complexity, artistic exuberance',
    previewImage: '/filter-previews/12_maximalism.jpg',
    fallbackGradient: 'from-rainbow-400 to-pink-600'
  },
  { 
    id: 'steampunk', 
    name: 'Steampunk', 
    prompt: 'Steampunk aesthetic, Victorian era technology, brass and copper machinery, clockwork mechanisms, industrial design elements, retro-futuristic inventions, steam-powered devices, vintage scientific instruments, alternative history vibes',
    previewImage: '/filter-previews/13_steampunk.jpg',
    fallbackGradient: 'from-amber-600 to-red-700'
  },
  { 
    id: 'synthwave', 
    name: 'Synthwave', 
    prompt: 'Synthwave retrowave style, neon pink and blue colors, 80s nostalgia aesthetic, digital grid backgrounds, sunset gradients, retro futuristic elements, electronic music visuals, vintage computer graphics, cybernetic atmosphere',
    previewImage: '/filter-previews/14_synthwave_retrowave.jpg',
    fallbackGradient: 'from-pink-500 to-blue-600'
  },
  { 
    id: 'pop-art', 
    name: 'Pop Art', 
    prompt: 'Pop art style, bold primary colors, comic book aesthetics, halftone dot patterns, celebrity culture references, commercial art techniques, Andy Warhol inspired, mass media imagery, contemporary culture commentary, graphic design elements',
    previewImage: '/filter-previews/15_pop_art.jpg',
    fallbackGradient: 'from-red-500 to-yellow-500'
  },
  { 
    id: 'watercolor', 
    name: 'Watercolor', 
    prompt: 'Watercolor painting style, soft flowing pigments, transparent color washes, organic bleeding effects, artistic brush strokes, delicate color transitions, traditional medium techniques, gentle artistic expression, fluid natural beauty',
    previewImage: '/filter-previews/16_watercolor.jpg',
    fallbackGradient: 'from-blue-300 to-purple-300'
  },
  { 
    id: 'oil-painting', 
    name: 'Oil Painting', 
    prompt: 'Oil painting style, rich textured brushstrokes, classical fine art techniques, deep color saturation, traditional artistic medium, realistic rendering, masterful light and shadow, sophisticated artistic composition, timeless artistic quality',
    previewImage: '/filter-previews/17_oil_painting.jpg',
    fallbackGradient: 'from-amber-600 to-red-600'
  },
  { 
    id: 'pixel-art', 
    name: 'Pixel Art', 
    prompt: 'Pixel art style, 8-bit retro graphics, limited color palette, blocky digital aesthetics, video game nostalgia, crisp geometric forms, classic arcade game visuals, retro gaming culture, digital artistic precision',
    previewImage: '/filter-previews/18_pixel_art.jpg',
    fallbackGradient: 'from-green-500 to-blue-500'
  },
  { 
    id: 'surrealism', 
    name: 'Surrealism', 
    prompt: 'Surrealist art style, dreamlike imagery, impossible scenarios, subconscious exploration, bizarre juxtapositions, Salvador Dali inspired, psychedelic elements, abstract reality distortion, imaginative artistic expression, mysterious atmosphere',
    previewImage: '/filter-previews/19_surrealism.jpg',
    fallbackGradient: 'from-purple-600 to-indigo-700'
  },
  { 
    id: 'glassmorphism', 
    name: 'Glassmorphism', 
    prompt: 'Glassmorphism design style, translucent glass effects, frosted glass textures, modern UI design elements, subtle transparency layers, contemporary digital aesthetics, clean minimalist approach, sophisticated material design',
    previewImage: '/filter-previews/20_glassmorphism.jpg',
    fallbackGradient: 'from-blue-200 to-indigo-300'
  },
  { 
    id: 'coquette', 
    name: 'Coquette', 
    prompt: 'Coquette aesthetic style, feminine romantic elements, soft pink color palette, delicate lace textures, vintage boudoir inspiration, elegant flirtation themes, sophisticated feminine charm, romantic vintage fashion, dreamy gentle atmosphere',
    previewImage: '/filter-previews/21_coquette_aesthetic.jpg',
    fallbackGradient: 'from-pink-300 to-rose-400'
  },
];

function FilterPreviewImage({ filter, isLoading }: { filter: FilterPreset; isLoading: boolean }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      className={`aspect-square rounded-lg mb-2 transition-transform duration-200 group-hover:scale-105 active:scale-95 min-h-[80px] sm:min-h-[100px] overflow-hidden ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {!imageError ? (
        <img
          src={filter.previewImage}
          alt={filter.name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${filter.fallbackGradient}`}></div>
      )}
    </div>
  );
}

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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {FILTER_PRESETS.map((filter) => (
          <div
            key={filter.id}
            className="group cursor-pointer touch-manipulation"
            onClick={() => !isLoading && onApplyFilter(filter.prompt)}
            data-testid={`filter-preset-${filter.id}`}
          >
            <FilterPreviewImage filter={filter} isLoading={isLoading} />
            <p className="text-xs sm:text-sm font-medium text-center">{filter.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}