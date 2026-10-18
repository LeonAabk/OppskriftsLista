import React, { useState, useEffect } from 'react';
import { Recipe, RecipeDifficulty } from '../types';

interface RecipeFormViewProps {
  recipeToEdit: Recipe | null;
  onSave: (recipeData: Omit<Recipe, 'id' | 'created_at'> & { id?: string }) => void;
  onCancel: () => void;
}

export const RecipeFormView: React.FC<RecipeFormViewProps> = ({
  recipeToEdit,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>('Medium');
  const [category, setCategory] = useState<string>('Dinner');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState<number | ''>('');
  const [cookTime, setCookTime] = useState<number | ''>('');
  const [servings, setServings] = useState<number | ''>('');
  const [coverImage, setCoverImage] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);

  useEffect(() => {
    if (recipeToEdit) {
      setTitle(recipeToEdit.title || '');
      setDifficulty(recipeToEdit.difficulty || 'Medium');
      setCategory(recipeToEdit.category || 'Dinner');
      setDescription(recipeToEdit.description || '');
      setPrepTime(
        recipeToEdit.prep_time_minutes !== undefined
          ? recipeToEdit.prep_time_minutes
          : ''
      );
      setCookTime(
        recipeToEdit.cook_time_minutes !== undefined
          ? recipeToEdit.cook_time_minutes
          : ''
      );
      setServings(
        recipeToEdit.servings !== undefined ? recipeToEdit.servings : ''
      );
      setCoverImage(recipeToEdit.cover_image || '');
      setTagsStr((recipeToEdit.tags || []).join(', '));
      setNotes(recipeToEdit.notes || '');
      setIngredients(
        recipeToEdit.ingredients && recipeToEdit.ingredients.length > 0
          ? recipeToEdit.ingredients.map((ing) => ing.name)
          : ['']
      );
      setInstructions(
        recipeToEdit.instructions && recipeToEdit.instructions.length > 0
          ? [...recipeToEdit.instructions]
          : ['']
      );
    } else {
      setTitle('');
      setDifficulty('Medium');
      setCategory('Dinner');
      setDescription('');
      setPrepTime('');
      setCookTime('');
      setServings(4);
      setCoverImage('');
      setTagsStr('');
      setNotes('');
      setIngredients(['']);
      setInstructions(['']);
    }
  }, [recipeToEdit]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addIngredientRow = () => {
    setIngredients((prev) => [...prev, '']);
  };

  const removeIngredientRow = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, val: string) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const addInstructionRow = () => {
    setInstructions((prev) => [...prev, '']);
  };

  const removeInstructionRow = (index: number) => {
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, val: string) => {
    setInstructions((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanInstructions = instructions
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const cleanIngredients = ingredients
      .map((i) => i.trim())
      .filter((i) => i.length > 0)
      .map((name) => ({ name }));

    const cleanTags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // If tag doesn't contain category yet, add it
    if (category && !cleanTags.includes(category)) {
      cleanTags.unshift(category);
    }

    onSave({
      id: recipeToEdit ? recipeToEdit.id : undefined,
      title: title.trim(),
      description: description.trim(),
      difficulty,
      category: category as Recipe['category'],
      prep_time_minutes: prepTime === '' ? 0 : Number(prepTime),
      cook_time_minutes: cookTime === '' ? 0 : Number(cookTime),
      servings: servings === '' ? 1 : Number(servings),
      cover_image: coverImage,
      tags: cleanTags,
      instructions: cleanInstructions,
      ingredients: cleanIngredients,
      notes: notes.trim(),
      is_favorite: recipeToEdit?.is_favorite ?? false,
    });
  };

  return (
    <section id="view-recipe-form" className="view-section active">
      <div className="form-header">
        <button
          type="button"
          id="btn-back-from-form"
          className="btn-icon"
          onClick={onCancel}
        >
          ← Tilbake
        </button>
        <h2 id="form-view-title">
          {recipeToEdit ? 'Rediger oppskrift' : 'Legg til ny oppskrift'}
        </h2>
      </div>

      <form id="recipe-form" className="recipe-form-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group flex-2">
            <label htmlFor="recipe-title">Tittel *</label>
            <input
              type="text"
              id="recipe-title"
              required
              placeholder="F.eks. Saftig Lasagne med hjemmelaget bechamel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group flex-1">
            <label htmlFor="recipe-category">Hovedkategori</label>
            <select
              id="recipe-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Dinner">Middag</option>
              <option value="Breakfast">Frokost</option>
              <option value="Lunch">Lunsj</option>
              <option value="Dessert">Dessert</option>
              <option value="Vegan">Vegansk</option>
              <option value="Vegetarian">Vegetar</option>
              <option value="Baking">Bakst</option>
            </select>
          </div>

          <div className="form-group flex-1">
            <label htmlFor="recipe-difficulty">Vanskelighetsgrad</label>
            <select
              id="recipe-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as RecipeDifficulty)}
            >
              <option value="Easy">Lett</option>
              <option value="Medium">Middels</option>
              <option value="Hard">Vanskelig</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="recipe-description">Kort beskrivelse</label>
          <textarea
            id="recipe-description"
            rows={2}
            placeholder="En kort innledning om retten, serveringstips eller hvem den passer for..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="recipe-prep-time">Forberedelsestid (min)</label>
            <input
              type="number"
              id="recipe-prep-time"
              min="0"
              placeholder="15"
              value={prepTime}
              onChange={(e) =>
                setPrepTime(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
            />
          </div>

          <div className="form-group flex-1">
            <label htmlFor="recipe-cook-time">Tilberedningstid (min)</label>
            <input
              type="number"
              id="recipe-cook-time"
              min="0"
              placeholder="30"
              value={cookTime}
              onChange={(e) =>
                setCookTime(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
            />
          </div>

          <div className="form-group flex-1">
            <label htmlFor="recipe-servings">Porsjoner</label>
            <input
              type="number"
              id="recipe-servings"
              min="1"
              placeholder="4"
              value={servings}
              onChange={(e) =>
                setServings(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group flex-2">
            <label htmlFor="recipe-image">Forsidebilde (URL eller opplasting)</label>
            <input
              type="text"
              id="recipe-image"
              placeholder="https://images.example.com/matbilde.jpg"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
            />
            <input
              type="file"
              id="recipe-image-upload"
              accept="image/*"
              style={{ marginTop: '6px' }}
              onChange={handleImageUpload}
            />
          </div>

          <div className="form-group flex-1">
            <label htmlFor="recipe-tags">Tagger (kommaseparert)</label>
            <input
              type="text"
              id="recipe-tags"
              placeholder="Pasta, Rask, Italiensk, Helg"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="recipe-notes">Kokkens tips & råd (valgfritt)</label>
          <textarea
            id="recipe-notes"
            rows={2}
            placeholder="F.eks. Tips for sprøere skorpe, erstatninger for allergikere eller drikkeforslag..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <hr className="divider" />

        {/* Dynamic Ingredients */}
        <div className="dynamic-section">
          <div className="section-header">
            <div>
              <h3>Ingredienser</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Tips: Skriv gjerne antall og enhet først (f.eks. «400 g kjøttdeig», «2 dl melk»), slik at porsjonskalkulatoren kan justere mengden automatisk.
              </p>
            </div>
            <button
              type="button"
              id="btn-add-ingredient"
              className="btn-secondary small"
              onClick={addIngredientRow}
            >
              + Legg til ingrediens
            </button>
          </div>
          <div id="ingredients-container" className="dynamic-list">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="dynamic-row">
                <input
                  type="text"
                  placeholder="F.eks. 400 g spaghetti eller 2 ss smør"
                  className="ingredient-input"
                  value={ing}
                  required={idx === 0 && ingredients.length === 1}
                  onChange={(e) => updateIngredient(idx, e.target.value)}
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeIngredientRow(idx)}
                    aria-label="Fjern ingrediens"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <hr className="divider" />

        {/* Dynamic Instructions */}
        <div className="dynamic-section">
          <div className="section-header">
            <div>
              <h3>Fremgangsmåte steg for steg</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                Del oppskriften inn i logiske steg for kokemodus.
              </p>
            </div>
            <button
              type="button"
              id="btn-add-instruction"
              className="btn-secondary small"
              onClick={addInstructionRow}
            >
              + Legg til steg
            </button>
          </div>
          <div id="instructions-container" className="dynamic-list">
            {instructions.map((inst, idx) => (
              <div key={idx} className="dynamic-row">
                <span className="step-num-badge">{idx + 1}</span>
                <textarea
                  rows={2}
                  placeholder={`Beskriv steg ${idx + 1}...`}
                  className="instruction-input"
                  value={inst}
                  required={idx === 0 && instructions.length === 1}
                  onChange={(e) => updateInstruction(idx, e.target.value)}
                />
                {instructions.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeInstructionRow(idx)}
                    aria-label="Fjern instruksjon"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            id="btn-cancel-form"
            className="btn-outline"
            onClick={onCancel}
          >
            Avbryt
          </button>
          <button type="submit" id="btn-save-recipe" className="btn-primary">
            Lagre oppskrift
          </button>
        </div>
      </form>
    </section>
  );
};
