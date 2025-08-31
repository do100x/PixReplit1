export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-foreground font-medium">AI is working its magic...</p>
      <p className="text-sm text-muted-foreground">This may take a few seconds</p>
    </div>
  );
}
