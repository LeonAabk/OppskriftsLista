import React, { useState } from 'react';
import { ShoppingItem } from '../types';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: (text: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  onBackToDashboard: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  onToggleItem,
  onDeleteItem,
  onAddItem,
  onClearCompleted,
  onClearAll,
  onBackToDashboard,
}) => {
  const [newText, setNewText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddItem(newText.trim());
    setNewText('');
  };

  const handleCopyClipboard = () => {
    if (items.length === 0) return;
    const text = items
      .map((item) => `${item.checked ? '✓' : '☐'} ${item.text}`)
      .join('\n');

    navigator.clipboard.writeText(`Handleliste fra Oppskriftslista:\n\n${text}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const uncheckedCount = items.filter((i) => !i.checked).length;

  return (
    <section className="view-section active shopping-list-section">
      <div className="detail-header">
        <button
          type="button"
          className="btn-icon"
          onClick={onBackToDashboard}
        >
          ← Tilbake til oppskrifter
        </button>
        <div className="detail-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={handleCopyClipboard}
            disabled={items.length === 0}
          >
            {copied ? 'Kopiert! ✓' : 'Kopier liste'}
          </button>
          {items.some((i) => i.checked) && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onClearCompleted}
            >
              Fjern avkrysset
            </button>
          )}
          {items.length > 0 && (
            <button
              type="button"
              className="btn-danger"
              onClick={() => {
                if (window.confirm('Vil du tømme hele handlelisten?')) {
                  onClearAll();
                }
              }}
            >
              Tøm liste
            </button>
          )}
        </div>
      </div>

      <div className="shopping-card">
        <div className="shopping-header">
          <h2>Handleliste</h2>
          <span className="shopping-count">
            {uncheckedCount} {uncheckedCount === 1 ? 'vare igjen' : 'varer igjen'}
          </span>
        </div>

        {/* Add custom item form */}
        <form className="shopping-add-form" onSubmit={handleAdd}>
          <input
            type="text"
            placeholder="Legg til en vare (f.eks. Kaffe, Melk, Bananer)..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            + Legg til
          </button>
        </form>

        {/* Items list */}
        {items.length === 0 ? (
          <div className="empty-state">
            <p>Handlelisten din er tom. Legg til ingredienser fra en oppskrift eller skriv inn over!</p>
          </div>
        ) : (
          <ul className="shopping-items-list">
            {items.map((item) => (
              <li
                key={item.id}
                className={`shopping-item-row ${item.checked ? 'completed' : ''}`}
              >
                <label className="shopping-item-label">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => onToggleItem(item.id)}
                  />
                  <span className="shopping-item-text">{item.text}</span>
                  {item.recipeTitle && (
                    <span className="shopping-item-source">
                      ({item.recipeTitle})
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  className="btn-icon small text-muted"
                  onClick={() => onDeleteItem(item.id)}
                  aria-label="Slett vare"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
