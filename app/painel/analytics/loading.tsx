export default function AnalyticsLoading() {
  return (
    <div className="p-6">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
      <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="mb-2 h-4 w-40 animate-pulse rounded bg-gray-200" />
      <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
    </div>
  )
}
