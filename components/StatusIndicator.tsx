import React from 'react';
import { Wifi, WifiOff, Database, AlertCircle } from 'lucide-react';

interface StatusIndicatorProps {
  isOnline?: boolean;
  databaseConnected?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  isOnline = true, 
  databaseConnected = true 
}) => {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100/50 rounded-lg">
      {/* Network Status */}
      <div className="flex items-center gap-1">
        {isOnline ? (
          <Wifi size={12} className="text-emerald-500" />
        ) : (
          <WifiOff size={12} className="text-red-500" />
        )}
        <span className="text-xs text-slate-600">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Database Status */}
      <div className="flex items-center gap-1">
        {databaseConnected ? (
          <Database size={12} className="text-emerald-500" />
        ) : (
          <AlertCircle size={12} className="text-red-500" />
        )}
        <span className="text-xs text-slate-600">
          {databaseConnected ? 'DB' : 'No DB'}
        </span>
      </div>
    </div>
  );
};

export default StatusIndicator;