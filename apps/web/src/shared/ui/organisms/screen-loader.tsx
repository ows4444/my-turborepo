export function ScreenLoader({ isLoading }: { readonly isLoading: boolean }) {
  if (!isLoading) return null;

  return (
    <div className="pointer-events-none fixed top-0 right-0 left-0 z-[9999] h-1">
      <div className="h-full w-full animate-pulse bg-blue-500" />
    </div>
  );
}
