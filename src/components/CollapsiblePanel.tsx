import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsiblePanelProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function CollapsiblePanel({
  title,
  subtitle,
  children,
  defaultExpanded = true,
  icon,
  className = ''
}: CollapsiblePanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden flex flex-col ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left border-b border-slate-200 flex-shrink-0"
      >
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
            {subtitle && <p className="text-xs text-slate-600">{subtitle}</p>}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={18} className="text-slate-500" />
        ) : (
          <ChevronDown size={18} className="text-slate-500" />
        )}
      </button>
      {isExpanded && (
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>
      )}
    </div>
  );
}

