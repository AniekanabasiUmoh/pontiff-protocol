'use client';

interface GameFiltersProps {
    currentFilter: 'all' | 'rps' | 'poker' | 'confession';
    onFilterChange: (filter: 'all' | 'rps' | 'poker' | 'confession') => void;
}

export function GameFilters({ currentFilter, onFilterChange }: GameFiltersProps) {
    const filters = [
        { id: 'all', label: 'All Activity', icon: '🌐' },
        { id: 'rps', label: 'RPS Battles', icon: '✌️' },
        { id: 'poker', label: 'Poker Hands', icon: '♠️' },
        { id: 'confession', label: 'Confessions', icon: '🙏' },
    ] as const;

    return (
        <div className="flex flex-wrap gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1.5">
            {filters.map((filter) => (
                <button
                    key={filter.id}
                    onClick={() => onFilterChange(filter.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2
                        ${currentFilter === filter.id
                            ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
                >
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                </button>
            ))}
        </div>
    );
}
