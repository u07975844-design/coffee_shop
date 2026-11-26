import { AlertTriangle, Coffee, RefreshCw } from 'lucide-react';

export function LoadingGrid({ count = 6, columns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' }) {
  return (
    <div className={`grid gap-6 ${columns}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse border border-[#E5D9C8] bg-[#FDFBF7]"
        >
          <div className="aspect-[4/3] w-full bg-[#EFE6D8]" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-28 rounded bg-[#EFE6D8]" />
            <div className="h-5 w-3/4 rounded bg-[#EFE6D8]" />
            <div className="h-4 w-full rounded bg-[#EFE6D8]" />
            <div className="flex justify-between pt-3">
              <div className="h-4 w-20 rounded bg-[#EFE6D8]" />
              <div className="h-8 w-24 rounded bg-[#EFE6D8]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorNotice({ message, onRetry }) {
  return (
    <div className="border border-[#991B1B]/25 bg-[#FDFBF7] p-6 text-center">
      <AlertTriangle className="mx-auto h-7 w-7 text-[#991B1B]" />
      <h3 className="mt-3 font-editorial text-lg font-semibold text-[#2A1B12]">
        Unable to Load Live Data
      </h3>
      <p className="mx-auto mt-1.5 max-w-lg text-sm leading-relaxed text-[#6E5A4F]">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#2A1B12] px-4 py-2 text-xs font-medium text-[#2A1B12] transition-colors hover:bg-[#2A1B12] hover:text-[#FAF6F0]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="border border-[#E5D9C8] bg-[#FDFBF7] px-6 py-12 text-center">
      <Coffee className="mx-auto h-8 w-8 text-[#B86B2B]" />
      <h3 className="mt-3 font-editorial text-xl font-semibold text-[#2A1B12]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#6E5A4F]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
