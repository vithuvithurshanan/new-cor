import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastType } from './ToastContext';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
    return (
        <div
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-full duration-300
              ${type === 'success' ? 'bg-white border-emerald-100 text-emerald-800' : ''}
              ${type === 'error' ? 'bg-white border-red-100 text-red-800' : ''}
              ${type === 'info' ? 'bg-white border-blue-100 text-blue-800' : ''}
              ${type === 'warning' ? 'bg-white border-amber-100 text-amber-800' : ''}
            `}
        >
            <div className={`
              p-1 rounded-full
              ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : ''}
              ${type === 'error' ? 'bg-red-100 text-red-600' : ''}
              ${type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
              ${type === 'warning' ? 'bg-amber-100 text-amber-600' : ''}
            `}>
                {type === 'success' && <CheckCircle size={18} />}
                {type === 'error' && <XCircle size={18} />}
                {type === 'info' && <Info size={18} />}
                {type === 'warning' && <AlertTriangle size={18} />}
            </div>

            <p className="font-medium text-sm">{message}</p>

            <button
                onClick={() => onClose(id)}
                className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
                <X size={14} />
            </button>
        </div>
    );
};
