export function ShopPageDataSkeleton() {
  return (
    <div aria-hidden className="space-y-24 py-24">
      <div className="container mx-auto px-4">
        <div className="bg-muted mx-auto h-8 w-64 animate-pulse rounded" />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted aspect-[4/3] animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
      <div className="container mx-auto px-4">
        <div className="bg-muted mx-auto h-8 w-48 animate-pulse rounded" />
        <div className="mt-10 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-muted h-24 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
