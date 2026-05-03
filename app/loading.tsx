export default function HomeLoading() {
  return (
    <div className="flex flex-col w-full animate-pulse">
      <div className="w-full h-[250px] sm:h-[400px] md:h-[600px] lg:h-[750px] bg-gray-200 skeleton" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <div className="h-10 w-64 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg aspect-square" />
            ))}
          </div>
        </div>
      </div>
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="h-12 w-64 bg-gray-200 rounded mx-auto mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-lg h-64" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}