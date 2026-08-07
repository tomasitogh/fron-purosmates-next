export default function ProductPageLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-xl bg-gray-200" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 rounded bg-gray-200" />
          <div className="h-6 w-32 rounded bg-gray-200" />
          <div className="h-32 w-full rounded bg-gray-200" />
          <div className="mt-8 h-20 w-48 rounded bg-gray-200" />
          <div className="h-14 w-full rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
