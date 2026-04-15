export function KPICardSkeleton() {
    return (
        <div className="rounded-lg p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-md animate-pulse" style={{ background: 'var(--color-border)' }} />
                <div className="h-4 w-24 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
            </div>
            <div className="h-8 w-16 rounded animate-pulse mb-1" style={{ background: 'var(--color-border)' }} />
            <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
        </div>
    );
}

export function KPICardsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <KPICardSkeleton key={i} />
            ))}
        </div>
    );
}

export function LaudoItemSkeleton() {
    return (
        <div className="rounded-lg p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
                <div className="h-5 w-24 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                <div className="h-4 flex-1 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
                <div className="h-4 w-20 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
            </div>
        </div>
    );
}

export function LaudoListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <LaudoItemSkeleton key={i} />
            ))}
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="rounded-lg p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="h-5 w-32 rounded animate-pulse mb-4" style={{ background: 'var(--color-border)' }} />
            <div className="h-48 rounded animate-pulse" style={{ background: 'var(--color-border)' }} />
        </div>
    );
}
