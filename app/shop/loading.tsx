export default function ShopLoading() {
  return (
    <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="flex-shrink-0 lg:w-64">
          <div className="sticky top-24 space-y-6">
            <div className="mb-4 h-10 w-24 rounded bg-gray-200" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-gray-200" />
              ))}
            </div>
          </div>
        </aside>
        <div className="flex-1">
          <div className="mb-6">
            <div className="mb-2 h-8 w-48 rounded bg-gray-200" />
            <div className="h-5 w-32 rounded bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[350px] overflow-hidden rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
