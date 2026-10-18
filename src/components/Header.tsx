import React, { useRef } from 'react';
import { ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  shoppingItemCount: number;
  onNavigate: (view: ViewMode) => void;
  onAddRecipe: () => void;
  onImportRecipe: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenTimer: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  shoppingItemCount,
  onNavigate,
  onAddRecipe,
  onImportRecipe,
  onOpenTimer,
  theme,
  onToggleTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <header className="app-header">
      <div
        className="logo"
        onClick={() => onNavigate('view-dashboard')}
        role="button"
        tabIndex={0}
      >
        <h1>Oppskriftslista</h1>
      </div>

      <nav className="nav-links">
        <button
          id="nav-dashboard"
          className={`nav-btn ${currentView === 'view-dashboard' ? 'active-link' : ''}`}
          onClick={() => onNavigate('view-dashboard')}
        >
          Oppskrifter
        </button>

        <button
          className={`nav-btn ${currentView === 'view-shopping-list' ? 'active-link' : ''}`}
          onClick={() => onNavigate('view-shopping-list')}
        >
          Handleliste
          {shoppingItemCount > 0 && (
            <span className="nav-count-badge">{shoppingItemCount}</span>
          )}
        </button>

        <button
          type="button"
          className="nav-btn"
          onClick={onOpenTimer}
        >
          Timer ⏱
        </button>

        <button
          id="nav-import-recipe"
          className="nav-btn"
          onClick={handleImportClick}
        >
          Importer
        </button>
        <input
          type="file"
          id="import-recipe-input"
          ref={fileInputRef}
          accept=".json"
          style={{ display: 'none' }}
          onChange={onImportRecipe}
        />
      </nav>

      <div className="header-actions-right">
        <button
          id="theme-toggle"
          className="btn-icon"
          aria-label="Toggle Dark Mode"
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <button
          id="nav-add-recipe"
          className="btn-primary"
          onClick={onAddRecipe}
        >
          + Ny oppskrift
        </button>
      </div>
    </header>
  );
};
