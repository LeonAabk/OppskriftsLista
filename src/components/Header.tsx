import React from 'react';
import { ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  shoppingItemCount: number;
  onNavigate: (view: ViewMode) => void;
  onAddRecipe: () => void;
  onOpenImporterModal: () => void;
  onOpenTimer: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  shoppingItemCount,
  onNavigate,
  onAddRecipe,
  onOpenImporterModal,
  onOpenTimer,
  theme,
  onToggleTheme,
}) => {
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
          id="nav-explore"
          className={`nav-btn ${currentView === 'view-explore' ? 'active-link' : ''}`}
          onClick={() => onNavigate('view-explore')}
        >
          Utforsk
        </button>

        <button
          id="nav-meal-planner"
          className={`nav-btn ${currentView === 'view-meal-planner' ? 'active-link' : ''}`}
          onClick={() => onNavigate('view-meal-planner')}
        >
          Ukemeny
        </button>

        <button
          id="nav-shopping-list"
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
          className="nav-btn nav-btn-timer"
          onClick={onOpenTimer}
        >
          Timer ⏱
        </button>

        <button
          id="nav-import-recipe"
          type="button"
          className="nav-btn"
          onClick={onOpenImporterModal}
          title="Importer fra nettside, tekst eller JSON"
        >
          Importer 🌐
        </button>
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
