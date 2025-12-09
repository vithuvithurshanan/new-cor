import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ViewState, UserRole } from '../types';

interface MenuItem {
  id: ViewState;
  icon: React.ComponentType<any>;
  label: string;
  roles: UserRole[];
  strict?: boolean;
  children?: MenuItem[];
}

interface CollapsibleMenuItemProps {
  item: MenuItem;
  currentView: ViewState;
  hasAccess: (roles: UserRole[], strict?: boolean) => boolean;
  onNavigate: (view: ViewState) => void;
  level?: number;
}

export const CollapsibleMenuItem: React.FC<CollapsibleMenuItemProps> = ({
  item,
  currentView,
  hasAccess,
  onNavigate,
  level = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!hasAccess(item.roles, item.strict)) return null;

  const hasChildren = item.children && item.children.length > 0;
  const isActive = currentView === item.id;
  const Icon = item.icon;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else {
      onNavigate(item.id);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium duration-200
          ${level > 0 ? 'ml-4' : ''}
          ${isActive
            ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-200 backdrop-blur-sm'
            : 'text-slate-500 hover:bg-white/50 hover:text-indigo-600'}
        `}
      >
        <Icon size={20} />
        <span className="flex-1 text-left">{item.label}</span>
        {hasChildren && (
          <div className="transition-transform duration-200">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {item.children!.map((child) => (
            <CollapsibleMenuItem
              key={child.id}
              item={child}
              currentView={currentView}
              hasAccess={hasAccess}
              onNavigate={onNavigate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CollapsibleSidebarProps {
  menuItems: MenuItem[];
  currentView: ViewState;
  hasAccess: (roles: UserRole[], strict?: boolean) => boolean;
  onNavigate: (view: ViewState) => void;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  menuItems,
  currentView,
  hasAccess,
  onNavigate
}) => {
  return (
    <nav className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
      {menuItems.map((item) => (
        <CollapsibleMenuItem
          key={item.id}
          item={item}
          currentView={currentView}
          hasAccess={hasAccess}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
};

export default CollapsibleSidebar;