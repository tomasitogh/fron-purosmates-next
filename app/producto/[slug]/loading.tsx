export default function ProductPageLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 bg-gray-200 rounded" />
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-32 w-full bg-gray-200 rounded" />
          <div className="h-20 w-48 bg-gray-200 rounded mt-8" />
          <div className="h-14 w-full bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}