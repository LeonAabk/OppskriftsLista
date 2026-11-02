import React, { useState } from 'react';
import { Recipe } from '../types';
import { scrapeRecipeFromUrl, parseRecipeFromRawText } from '../utils/recipeScraper';

interface RecipeImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecipe: (recipe: Recipe) => void;
  onOpenInForm: (partial: Partial<Recipe>) => void;
}

export const RecipeImporterModal: React.FC<RecipeImporterModalProps> = ({
  isOpen,
  onClose,
  onSaveRecipe,
  onOpenInForm,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'file'>('url');

  // URL state
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Text state
  const [rawTextInput, setRawTextInput] = useState('');

  // Parsed preview state
  const [parsedPreview, setParsedPreview] = useState<Partial<Recipe> | null>(null);

  if (!isOpen) return null;

  const handleScrapeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setParsedPreview(null);
    if (!urlInput.trim()) {
      setErrorMsg('Vennligst oppgi en gyldig nettadresse (URL).');
      return;
    }

    setIsLoading(true);
    try {
      const result = await scrapeRecipeFromUrl(urlInput.trim());
      setParsedPreview(result);
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Kunne ikke hente oppskriften automatisk. Prøv å lime inn teksten direkte i tekst-fanen.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseText = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setParsedPreview(null);
    if (!rawTextInput.trim()) {
      setErrorMsg('Vennligst lim inn oppskriftstekst.');
      return;
    }

    try {
      const result = parseRecipeFromRawText(rawTextInput);
      setParsedPreview(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Kunne ikke tolke teksten.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.title) {
          setParsedPreview(json);
        } else {
          setErrorMsg('JSON-filen mangler et gyldig oppskrift-format.');
        }
      } catch {
        setErrorMsg('Ugyldig JSON-fil.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveDirectly = () => {
    if (!parsedPreview) return;
    const newRecipe: Recipe = {
      id: `imported-${Date.now()}`,
      title: parsedPreview.title || 'Uten navn',
      description: parsedPreview.description || '',
      difficulty: parsedPreview.difficulty || 'Medium',
      category: parsedPreview.category || 'Dinner',
      prep_time_minutes: parsedPreview.prep_time_minutes || 15,
      cook_time_minutes: parsedPreview.cook_time_minutes || 20,
      servings: parsedPreview.servings || 4,
      cover_image: parsedPreview.cover_image,
      tags: parsedPreview.tags || ['Importert'],
      instructions: parsedPreview.instructions || ['Følg trinnene.'],
      ingredients: parsedPreview.ingredients || [{ name: 'Ingredienser' }],
      created_at: new Date().toISOString(),
      source_url: parsedPreview.source_url
    };
    onSaveRecipe(newRecipe);
    onClose();
  };

  const handleOpenEditor = () => {
    if (!parsedPreview) return;
    onOpenInForm(parsedPreview);
    onClose();
  };

  const resetState = () => {
    setParsedPreview(null);
    setErrorMsg(null);
    setUrlInput('');
    setRawTextInput('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container importer-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3>Importer oppskrift</h3>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Lukk"
          >
            ✕
          </button>
        </div>

        {/* Importer tabs */}
        <div className="importer-tabs">
          <button
            type="button"
            className={`importer-tab-btn ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('url');
              resetState();
            }}
          >
            🌐 Fra nettside (URL)
          </button>
          <button
            type="button"
            className={`importer-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('text');
              resetState();
            }}
          >
            📝 Lim inn tekst
          </button>
          <button
            type="button"
            className={`importer-tab-btn ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('file');
              resetState();
            }}
          >
            📁 JSON-fil
          </button>
        </div>

        <div className="modal-body">
          {errorMsg && <div className="alert-banner alert-error">{errorMsg}</div>}

          {/* TAB 1: URL */}
          {activeTab === 'url' && (
            <form onSubmit={handleScrapeUrl} className="importer-form">
              <p className="importer-hint">
                Lim inn en lenke fra en oppskriftsnettside (f.eks. Matprat, Meny, NRK Mat, Trines Matblogg, BBC Good Food eller Allrecipes).
              </p>
              <div className="url-input-group">
                <input
                  type="url"
                  placeholder="https://www.matprat.no/oppskrifter/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="form-input"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Henter...' : 'Hent oppskrift'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Free Text */}
          {activeTab === 'text' && (
            <form onSubmit={handleParseText} className="importer-form">
              <p className="importer-hint">
                Lim inn tekst fra en oppskrift (fra en blogg, PDF eller melding). Appen gjenkjenner automatisk tittel, ingredienser og trinn.
              </p>
              <textarea
                rows={8}
                placeholder="F.eks.:&#10;Kremet pasta&#10;&#10;Ingredienser:&#10;400 g pasta&#10;3 dl fløte&#10;1 ts salt&#10;&#10;Fremgangsmåte:&#10;1. Kok pastaen al dente.&#10;2. Varm fløten og bland alt sammen."
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                className="form-textarea"
              />
              <div className="form-actions-right">
                <button type="submit" className="btn-primary">
                  Tolke oppskrift
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: File */}
          {activeTab === 'file' && (
            <div className="importer-file-drop">
              <p className="importer-hint">
                Last opp en tidligere eksportert <code>.json</code>-oppskriftsfil.
              </p>
              <label className="file-upload-box">
                <span className="file-upload-icon">📂</span>
                <span>Klikk her for å velge JSON-fil</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          {/* PREVIEW CARD */}
          {parsedPreview && (
            <div className="parsed-preview-box">
              <div className="parsed-preview-header">
                {parsedPreview.cover_image && (
                  <img
                    src={parsedPreview.cover_image}
                    alt={parsedPreview.title}
                    className="parsed-preview-thumb"
                  />
                )}
                <div>
                  <h4>{parsedPreview.title}</h4>
                  <p className="parsed-preview-meta">
                    ⏱ {parsedPreview.prep_time_minutes || 0} + {parsedPreview.cook_time_minutes || 0} min · 👥 {parsedPreview.servings || 4} porsjoner
                  </p>
                  {parsedPreview.source_url && (
                    <a
                      href={parsedPreview.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="parsed-preview-link"
                    >
                      Kilde: {new URL(parsedPreview.source_url).hostname} ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="parsed-preview-details">
                <div className="parsed-preview-col">
                  <strong>Ingredienser ({parsedPreview.ingredients?.length || 0}):</strong>
                  <ul>
                    {parsedPreview.ingredients?.slice(0, 5).map((ing, idx) => (
                      <li key={idx}>{ing.name}</li>
                    ))}
                    {(parsedPreview.ingredients?.length || 0) > 5 && (
                      <li className="text-muted">+ {(parsedPreview.ingredients?.length || 0) - 5} til...</li>
                    )}
                  </ul>
                </div>

                <div className="parsed-preview-col">
                  <strong>Trinn ({parsedPreview.instructions?.length || 0}):</strong>
                  <ol>
                    {parsedPreview.instructions?.slice(0, 3).map((st, idx) => (
                      <li key={idx}>{st.length > 70 ? `${st.substring(0, 70)}...` : st}</li>
                    ))}
                    {(parsedPreview.instructions?.length || 0) > 3 && (
                      <li className="text-muted">+ {(parsedPreview.instructions?.length || 0) - 3} til...</li>
                    )}
                  </ol>
                </div>
              </div>

              <div className="parsed-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleOpenEditor}
                >
                  ✏️ Åpne i redigeringsskjema
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveDirectly}
                >
                  ✓ Lagre direkte i kokeboken
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
