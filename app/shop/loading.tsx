export default function ShopLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="h-10 w-24 bg-gray-200 rounded mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </aside>
        <div className="flex-1">
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-5 w-32 bg-gray-200 rounded" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg overflow-hidden h-[350px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}