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
  isCollapsed?: boolean;
}

export const CollapsibleMenuItem: React.FC<CollapsibleMenuItemProps> = ({
  item,
  currentView,
  hasAccess,
  onNavigate,
  level = 0,
  isCollapsed = false
}) => {
  // Auto-expand if current view is one of the children
  const shouldAutoExpand = item.children?.some(child =>
    child.id === currentView || child.children?.some(grandchild => grandchild.id === currentView)
  );

  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand || false);

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
          ${level > 0 && !isCollapsed ? 'ml-4' : ''}
          ${isActive
            ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-200 backdrop-blur-sm'
            : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600'}
          ${isCollapsed ? 'justify-center' : ''}
        `}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon size={24} />
        {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
        {!isCollapsed && hasChildren && (
          <div className="transition-transform duration-200">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        )}
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className={`mt-1 ml-4 space-y-1 border-l-2 border-slate-200 pl-2 animate-in slide-in-from-top-2 duration-200 ${isCollapsed ? 'hidden' : ''}`}>
          {item.children!.map((child) => (
            <CollapsibleMenuItem
              key={child.id}
              item={child}
              currentView={currentView}
              hasAccess={hasAccess}
              onNavigate={onNavigate}
              level={level + 1}
              isCollapsed={isCollapsed}
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
  isCollapsed?: boolean;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  menuItems,
  currentView,
  hasAccess,
  onNavigate,
  isCollapsed = false
}) => {
  return (
    <nav className="space-y-2 h-full overflow-y-auto pr-1 custom-scrollbar pb-20">
      {menuItems.map((item) => (
        <CollapsibleMenuItem
          key={item.id}
          item={item}
          currentView={currentView}
          hasAccess={hasAccess}
          onNavigate={onNavigate}
          isCollapsed={isCollapsed}
        />
      ))}
    </nav>
  );
};

export default CollapsibleSidebar;