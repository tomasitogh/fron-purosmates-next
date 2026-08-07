export default function HomeLoading() {
  return (
    <div className="flex w-full animate-pulse flex-col">
      <div className="skeleton h-[250px] w-full bg-gray-200 sm:h-[400px] md:h-[600px] lg:h-[750px]" />
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-8">
          <div className="mb-4 h-10 w-64 rounded bg-gray-200" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
      <div className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mx-auto mb-8 h-12 w-64 rounded bg-gray-200" />
          <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-white p-8 shadow-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
