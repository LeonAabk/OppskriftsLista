// -----------------------------------------------------
// App Initialization & State
// -----------------------------------------------------
const state = {
    recipes: [],
    currentView: 'view-dashboard', // views: view-dashboard, view-recipe-form, view-recipe-detail
    currentRecipeId: null
};

// -----------------------------------------------------
// DOM Elements
// -----------------------------------------------------
const el = {
    // Views
    viewDashboard: document.getElementById('view-dashboard'),
    viewRecipeForm: document.getElementById('view-recipe-form'),
    viewRecipeDetail: document.getElementById('view-recipe-detail'),

    // Navigation
    themeToggle: document.getElementById('theme-toggle'),
    navDashboard: document.getElementById('nav-dashboard'),
    navAddRecipe: document.getElementById('nav-add-recipe'),
    btnBackFromForm: document.getElementById('btn-back-from-form'),
    btnBackFromDetail: document.getElementById('btn-back-from-detail'),

    // Dashboard
    recipeGrid: document.getElementById('recipe-grid'),
    searchInput: document.getElementById('search-input'),
    filterCategory: document.getElementById('filter-category'),
    filterTime: document.getElementById('filter-time'),
    dashboardLoading: document.getElementById('dashboard-loading'),
    dashboardEmpty: document.getElementById('dashboard-empty'),

    // Form
    recipeForm: document.getElementById('recipe-form'),
    recipeIdInput: document.getElementById('recipe-id-input'),
    formViewTitle: document.getElementById('form-view-title'),
    btnAddIngredient: document.getElementById('btn-add-ingredient'),
    ingredientsContainer: document.getElementById('ingredients-container'),
    btnAddInstruction: document.getElementById('btn-add-instruction'),
    instructionsContainer: document.getElementById('instructions-container'),
    btnCancelForm: document.getElementById('btn-cancel-form'),

    // Form Inputs
    fTitle: document.getElementById('recipe-title'),
    fDiff: document.getElementById('recipe-difficulty'),
    fDesc: document.getElementById('recipe-description'),
    fPrep: document.getElementById('recipe-prep-time'),
    fCook: document.getElementById('recipe-cook-time'),
    fServings: document.getElementById('recipe-servings'),
    fImage: document.getElementById('recipe-image'),
    fImageUpload: document.getElementById('recipe-image-upload'),
    fTags: document.getElementById('recipe-tags'),

    // Detail
    dImage: document.getElementById('detail-image'),
    dTitle: document.getElementById('detail-title'),
    dDesc: document.getElementById('detail-description'),
    dTags: document.getElementById('detail-tags'),
    dPrep: document.getElementById('detail-prep'),
    dCook: document.getElementById('detail-cook'),
    dServings: document.getElementById('detail-servings'),
    dDiff: document.getElementById('detail-difficulty'),
    dIngredients: document.getElementById('detail-ingredients-list'),
    dInstructions: document.getElementById('detail-instructions-list'),
    btnEditRecipe: document.getElementById('btn-edit-recipe'),
    btnDeleteRecipe: document.getElementById('btn-delete-recipe'),
};


// -----------------------------------------------------
// Event Listeners Initialization
// -----------------------------------------------------
function initEvents() {
    // Navigation
    el.navDashboard.addEventListener('click', () => switchView('view-dashboard'));
    el.navAddRecipe.addEventListener('click', openAddRecipeForm);
    el.btnBackFromForm.addEventListener('click', () => switchView('view-dashboard'));
    el.btnCancelForm.addEventListener('click', () => switchView('view-dashboard'));
    el.btnBackFromDetail.addEventListener('click', () => switchView('view-dashboard'));

    // Theme
    el.themeToggle.addEventListener('click', toggleTheme);

    // Search & Filter
    el.searchInput.addEventListener('input', filterRecipes);
    el.filterCategory.addEventListener('change', filterRecipes);
    el.filterTime.addEventListener('change', filterRecipes);

    // Form Dynamics
    el.btnAddIngredient.addEventListener('click', () => addDynamicRow('ingredient'));
    el.btnAddInstruction.addEventListener('click', () => addDynamicRow('instruction'));
    el.recipeForm.addEventListener('submit', handleSaveRecipe);

    // Image Upload Handling (converting to base64 for simplicity in this template without Storage bucket setup)
    el.fImageUpload.addEventListener('change', handleImageUpload);

    // Detail Actions
    el.btnEditRecipe.addEventListener('click', openEditRecipeForm);
    el.btnDeleteRecipe.addEventListener('click', handleDeleteRecipe);
}

// -----------------------------------------------------
// Theming (Light/Dark Mode)
// -----------------------------------------------------
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    el.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    el.themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// -----------------------------------------------------
// Navigation & Views
// -----------------------------------------------------
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    state.currentView = viewId;

    if(viewId === 'view-dashboard') {
        fetchRecipes();
    }
}


// -----------------------------------------------------
// Local Storage Layer
// -----------------------------------------------------
const STORAGE_KEY = 'recipebox_recipes';

function getRecipesFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveRecipesToStorage(recipes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

// -----------------------------------------------------
// Dashboard & Recipes
// -----------------------------------------------------
function fetchRecipes() {
    el.dashboardLoading.style.display = 'block';
    el.recipeGrid.innerHTML = '';
    el.dashboardEmpty.style.display = 'none';

    try {
        const data = getRecipesFromStorage();
        // Sort by created_at descending
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        state.recipes = data;
        renderRecipes(data);
    } catch (err) {
        console.error("Error fetching recipes:", err);
    } finally {
        el.dashboardLoading.style.display = 'none';
    }
}


function renderRecipes(recipes) {
    el.recipeGrid.innerHTML = '';

    const allRecipes = getRecipesFromStorage();

    if (allRecipes.length === 0) {
        el.dashboardEmpty.style.display = 'flex';
    } else {
        el.dashboardEmpty.style.display = 'none';
    }

    if (recipes.length === 0) {
        return;
    }

    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.onclick = () => openRecipeDetail(recipe.id);

        const tagsHtml = recipe.tags && recipe.tags.length > 0
            ? recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '';

        const imgUrl = recipe.cover_image || 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%25%22%20height%3D%22180%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22180%22%20fill%3D%22%23e2e8f0%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%2364748b%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';

        card.innerHTML = `
            <img src="${imgUrl}" alt="${recipe.title}" class="card-image">
            <div class="card-content">
                <h3 class="card-title">${recipe.title}</h3>
                <div class="card-meta">
                    <span>⏱ ${recipe.prep_time_minutes + recipe.cook_time_minutes} min</span>
                    <span>• ${recipe.difficulty}</span>
                </div>
                <div class="card-tags">${tagsHtml}</div>
            </div>
        `;
        el.recipeGrid.appendChild(card);
    });
}

function filterRecipes() {
    const searchTerm = el.searchInput.value.toLowerCase();
    const category = el.filterCategory.value;
    const maxTimeStr = el.filterTime.value;
    const maxTime = maxTimeStr ? parseInt(maxTimeStr) : Infinity;

    const filtered = state.recipes.filter(r => {
        // Match title, tags, or ingredients
        const matchTitle = r.title.toLowerCase().includes(searchTerm);
        const matchTags = r.tags && r.tags.join(' ').toLowerCase().includes(searchTerm);
        const matchIngredients = r.ingredients && r.ingredients.some(ing => ing.name.toLowerCase().includes(searchTerm));

        const matchSearch = matchTitle || matchTags || matchIngredients;

        // Match category (using tags for category)
        const matchCategory = category === "" || (r.tags && r.tags.includes(category));

        // Match max cooking time
        const totalTime = (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0);
        const matchTime = totalTime <= maxTime;

        return matchSearch && matchCategory && matchTime;
    });

    renderRecipes(filtered);
}


// -----------------------------------------------------
// Add / Edit Recipe Form
// -----------------------------------------------------
function openAddRecipeForm() {
    el.formViewTitle.textContent = "Add New Recipe";
    el.recipeForm.reset();
    el.recipeIdInput.value = '';
    el.ingredientsContainer.innerHTML = '';
    el.instructionsContainer.innerHTML = '';
    // Add initial blank rows
    addDynamicRow('ingredient');
    addDynamicRow('instruction');
    switchView('view-recipe-form');
}

function openEditRecipeForm() {
    const recipe = state.recipes.find(r => r.id === state.currentRecipeId);
    if(!recipe) return;

    el.formViewTitle.textContent = "Edit Recipe";
    el.recipeIdInput.value = recipe.id;

    // Fill basic fields
    el.fTitle.value = recipe.title;
    el.fDiff.value = recipe.difficulty;
    el.fDesc.value = recipe.description || '';
    el.fPrep.value = recipe.prep_time_minutes || '';
    el.fCook.value = recipe.cook_time_minutes || '';
    el.fServings.value = recipe.servings || '';
    el.fImage.value = recipe.cover_image || '';
    el.fTags.value = (recipe.tags || []).join(', ');

    // Reset dynamic containers
    el.ingredientsContainer.innerHTML = '';
    el.instructionsContainer.innerHTML = '';

    // Load Ingredients locally from recipe object
    loadIngredientsForEditLocal(recipe);

    // Load Instructions
    if(recipe.instructions && recipe.instructions.length > 0) {
        recipe.instructions.forEach(inst => addDynamicRow('instruction', inst));
    } else {
        addDynamicRow('instruction');
    }

    switchView('view-recipe-form');
}

function loadIngredientsForEditLocal(recipe) {
    if(recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ing => addDynamicRow('ingredient', ing.name));
    } else {
        addDynamicRow('ingredient');
    }
}

function addDynamicRow(type, val = '') {
    const row = document.createElement('div');
    row.className = 'dynamic-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = type === 'ingredient' ? 'E.g., 2 cups flour' : 'E.g., Preheat oven to 350F';
    input.value = val;
    input.className = type === 'ingredient' ? 'ingredient-input' : 'instruction-input';
    input.required = true;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-remove';
    btn.innerHTML = '✕';
    btn.onclick = () => row.remove();

    row.appendChild(input);
    row.appendChild(btn);

    if(type === 'ingredient') el.ingredientsContainer.appendChild(row);
    else el.instructionsContainer.appendChild(row);
}

// Convert uploaded image to Base64 (simplification to avoid complex storage setup for this template)
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            el.fImage.value = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

async function handleSaveRecipe(e) {
    e.preventDefault();
    const id = el.recipeIdInput.value;

    // Gather Instructions
    const instructionInputs = document.querySelectorAll('.instruction-input');
    const instructions = Array.from(instructionInputs).map(inp => inp.value).filter(val => val.trim() !== '');

    // Gather Ingredients (Saved directly in the recipe object)
    const ingredientInputs = document.querySelectorAll('.ingredient-input');
    const ingredients = Array.from(ingredientInputs).map(inp => ({name: inp.value})).filter(val => val.name.trim() !== '');

    const recipeData = {
        title: el.fTitle.value,
        description: el.fDesc.value,
        difficulty: el.fDiff.value,
        prep_time_minutes: parseInt(el.fPrep.value) || 0,
        cook_time_minutes: parseInt(el.fCook.value) || 0,
        servings: parseInt(el.fServings.value) || 1,
        cover_image: el.fImage.value,
        tags: el.fTags.value.split(',').map(t => t.trim()).filter(t => t),
        instructions: instructions,
        ingredients: ingredients
    };

    try {
        let recipes = getRecipesFromStorage();

        if (id) {
            // Update
            recipeData.id = id;
            const index = recipes.findIndex(r => r.id === id);
            if (index !== -1) {
                // Preserve original creation date
                recipeData.created_at = recipes[index].created_at;
                recipes[index] = { ...recipes[index], ...recipeData };
            }
        } else {
            // Insert
            recipeData.id = Date.now().toString();
            recipeData.created_at = new Date().toISOString();
            recipes.push(recipeData);
        }

        saveRecipesToStorage(recipes);
        state.recipes = recipes;
        switchView('view-dashboard');

    } catch(err) {
        alert("Error saving recipe: " + err.message);
    }
}


// -----------------------------------------------------
// Detail View
// -----------------------------------------------------
function openRecipeDetail(id) {
    state.currentRecipeId = id;
    const recipe = state.recipes.find(r => r.id === id);
    if(!recipe) return;

    el.dTitle.textContent = recipe.title;
    el.dDesc.textContent = recipe.description || 'No description provided.';
    el.dPrep.textContent = recipe.prep_time_minutes ? `${recipe.prep_time_minutes}m` : '--';
    el.dCook.textContent = recipe.cook_time_minutes ? `${recipe.cook_time_minutes}m` : '--';
    el.dServings.textContent = recipe.servings || '--';
    el.dDiff.textContent = recipe.difficulty;

    if(recipe.cover_image) {
        el.dImage.src = recipe.cover_image;
        el.dImage.style.display = 'block';
    } else {
        el.dImage.style.display = 'none';
    }

    el.dTags.innerHTML = recipe.tags ? recipe.tags.map(t => `<span class="tag">${t}</span>`).join('') : '';

    // Load Instructions
    el.dInstructions.innerHTML = '';
    if(recipe.instructions) {
        recipe.instructions.forEach(inst => {
            const li = document.createElement('li');
            li.textContent = inst;
            el.dInstructions.appendChild(li);
        });
    }

    // Load Ingredients locally
    el.dIngredients.innerHTML = '';
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ing => {
            const li = document.createElement('li');
            const label = document.createElement('label');
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            const span = document.createElement('span');
            span.textContent = ing.name;

            label.appendChild(chk);
            label.appendChild(span);
            li.appendChild(label);
            el.dIngredients.appendChild(li);
        });
    } else {
         el.dIngredients.innerHTML = '<li>No ingredients listed.</li>';
    }

    switchView('view-recipe-detail');
}

function handleDeleteRecipe() {
    if(!confirm("Are you sure you want to delete this recipe?")) return;

    try {
        let recipes = getRecipesFromStorage();
        recipes = recipes.filter(r => r.id !== state.currentRecipeId);
        saveRecipesToStorage(recipes);
        state.recipes = recipes;
        switchView('view-dashboard');
    } catch(err) {
        alert("Error deleting recipe: " + err.message);
    }
}


// -----------------------------------------------------
// Run Initialization
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    initEvents();
    switchView('view-dashboard');
});window.renderRecipes = renderRecipes;
