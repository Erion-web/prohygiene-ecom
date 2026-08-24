export function AdminPageSkeleton() {
  return (
    <div>
      <div className="bg-white border-b border-surface-border px-4 py-2.5 flex items-center gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="skeleton h-5 w-36" />
          <div className="skeleton h-3 w-52 hidden sm:block" />
        </div>
        <div className="skeleton h-8 w-20 rounded-lg" />
      </div>
      <div className="admin-page">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="admin-card">
              <div className="flex items-center gap-3">
                <div className="skeleton h-9 w-9 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-16" />
                  <div className="skeleton h-5 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="admin-card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border">
            <div className="skeleton h-4 w-28" />
          </div>
          <div className="divide-y divide-surface-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="skeleton h-8 w-8 rounded-md flex-shrink-0" />
                <div className="skeleton h-3.5 flex-1" />
                <div className="skeleton h-3.5 w-16 hidden sm:block" />
                <div className="skeleton h-3.5 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
