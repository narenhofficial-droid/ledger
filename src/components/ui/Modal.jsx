import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-ink-900 border-t sm:border border-ink-700 rounded-t-3xl sm:rounded-3xl pt-2 pb-safe animate-slide-up">
        {/* drag handle */}
        <div className="flex justify-center sm:hidden">
          <div className="w-10 h-1 rounded-full bg-ink-700 my-2" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <h2 className="font-display text-lg font-medium text-ink-50">{title}</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-ink-400 hover:text-ink-50">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
