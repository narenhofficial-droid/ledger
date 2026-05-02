import { Plus } from 'lucide-react';

export function Fab({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Add expense"
      className="fixed bottom-20 right-5 z-30 w-14 h-14 rounded-full bg-gold-500 text-ink-950 shadow-lg shadow-gold-500/20 flex items-center justify-center active:scale-95 transition hover:bg-gold-400"
    >
      <Plus size={26} strokeWidth={2.5} />
    </button>
  );
}
