// -----------------------------------------------------
// App Initialization & State
// -----------------------------------------------------
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE'; // Requires user replacement for prod
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE'; // Requires user replacement for prod

// Initialize Supabase (Checking if library loaded)
let supabase;
if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("Supabase JS not loaded.");
}


const state = {
    user: null,
    recipes: [],
    currentView: 'view-auth', // views: view-auth, view-dashboard, view-recipe-form, view-recipe-detail
    currentRecipeId: null
};

// -----------------------------------------------------
// DOM Elements
// -----------------------------------------------------
const el = {
    // Views
    viewAuth: document.getElementById('view-auth'),
    viewDashboard: document.getElementById('view-dashboard'),
    viewRecipeForm: document.getElementById('view-recipe-form'),
    viewRecipeDetail: document.getElementById('view-recipe-detail'),

    // Auth
    authForm: document.getElementById('auth-form'),
    authEmail: document.getElementById('auth-email'),
    authPassword: document.getElementById('auth-password'),
    authSubmit: document.getElementById('auth-submit'),
    authSwitchBtn: document.getElementById('auth-switch-btn'),
    authSwitchText: document.getElementById('auth-switch-text'),
    authTitle: document.getElementById('auth-title'),
    authError: document.getElementById('auth-error'),
    authNavItems: document.getElementById('auth-nav-items'),

    // Navigation
    themeToggle: document.getElementById('theme-toggle'),
    navDashboard: document.getElementById('nav-dashboard'),
    navAddRecipe: document.getElementById('nav-add-recipe'),
    btnLogout: document.getElementById('btn-logout'),
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
    // Auth
    el.authForm.addEventListener('submit', handleAuthSubmit);
    el.authSwitchBtn.addEventListener('click', toggleAuthMode);
    el.btnLogout.addEventListener('click', handleLogout);

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
// Authentication
// -----------------------------------------------------
let isLoginMode = true;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    el.authTitle.textContent = isLoginMode ? 'Welcome Back' : 'Create Account';
    el.authSubmit.textContent = isLoginMode ? 'Login' : 'Sign Up';
    el.authSwitchText.textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";
    el.authSwitchBtn.textContent = isLoginMode ? "Sign Up" : "Login";
    el.authError.textContent = '';
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = el.authEmail.value;
    const password = el.authPassword.value;
    el.authError.textContent = 'Loading...';

    try {
        let error;
        if (isLoginMode) {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            error = signInError;
        } else {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { username: email.split('@')[0] } }
            });
            error = signUpError;
            if(!error) el.authError.textContent = 'Check your email to confirm your account (if email confirmation is enabled), otherwise you can login.';
        }

        if (error) throw error;

    } catch (err) {
        el.authError.textContent = err.message;
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
}

function checkAuthStatus() {
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            state.user = session.user;
            el.authNavItems.style.display = 'flex';
            if(state.currentView === 'view-auth') switchView('view-dashboard');
        } else {
            state.user = null;
            el.authNavItems.style.display = 'none';
            switchView('view-auth');
        }
    });
}

// -----------------------------------------------------
// Dashboard & Recipes
// -----------------------------------------------------
async function fetchRecipes() {
    if(!state.user) return;

    el.dashboardLoading.style.display = 'block';
    el.recipeGrid.innerHTML = '';
    el.dashboardEmpty.style.display = 'none';

    try {
        // Fetch recipes along with their ingredients to allow searching by ingredients
        const { data, error } = await supabase
            .from('recipes')
            .select('*, ingredients(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;

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

    if (recipes.length === 0) {
        el.dashboardEmpty.style.display = 'block';
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

    // We will fetch actual ingredients from the ingredients table below
    loadIngredientsForEdit(recipe.id);

    // Load Instructions (JSONB)
    if(recipe.instructions && recipe.instructions.length > 0) {
        recipe.instructions.forEach(inst => addDynamicRow('instruction', inst));
    } else {
        addDynamicRow('instruction');
    }

    switchView('view-recipe-form');
}

async function loadIngredientsForEdit(recipeId) {
    try {
        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .eq('recipe_id', recipeId)
            .order('sort_order', { ascending: true });

        if(error) throw error;

        if(data && data.length > 0) {
            data.forEach(ing => addDynamicRow('ingredient', ing.name));
        } else {
            addDynamicRow('ingredient');
        }
    } catch(err) {
        console.error("Error loading ingredients", err);
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

    // Gather Ingredients (To be inserted in separate table)
    const ingredientInputs = document.querySelectorAll('.ingredient-input');
    const ingredients = Array.from(ingredientInputs).map(inp => inp.value).filter(val => val.trim() !== '');

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
        user_id: state.user.id
    };

    try {
        let savedRecipeId;

        if (id) {
            // Update
            const { data, error } = await supabase.from('recipes').update(recipeData).eq('id', id).select().single();
            if(error) throw error;
            savedRecipeId = data.id;

            // Delete old ingredients
            await supabase.from('ingredients').delete().eq('recipe_id', savedRecipeId);

        } else {
            // Insert
            const { data, error } = await supabase.from('recipes').insert([recipeData]).select().single();
            if(error) throw error;
            savedRecipeId = data.id;
        }

        // Insert ingredients
        if(ingredients.length > 0) {
            const ingData = ingredients.map((name, idx) => ({
                recipe_id: savedRecipeId,
                name: name,
                sort_order: idx
            }));
            const { error: ingError } = await supabase.from('ingredients').insert(ingData);
            if(ingError) throw ingError;
        }

        switchView('view-dashboard');

    } catch(err) {
        alert("Error saving recipe: " + err.message);
    }
}


// -----------------------------------------------------
// Detail View
// -----------------------------------------------------
async function openRecipeDetail(id) {
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

    // Fetch Ingredients
    el.dIngredients.innerHTML = '<li>Loading ingredients...</li>';
    try {
        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .eq('recipe_id', id)
            .order('sort_order', { ascending: true });

        if(error) throw error;

        el.dIngredients.innerHTML = '';
        data.forEach(ing => {
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
    } catch(err) {
        el.dIngredients.innerHTML = '<li>Error loading ingredients</li>';
    }

    switchView('view-recipe-detail');
}

async function handleDeleteRecipe() {
    if(!confirm("Are you sure you want to delete this recipe?")) return;

    try {
        const { error } = await supabase.from('recipes').delete().eq('id', state.currentRecipeId);
        if(error) throw error;
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
    if(window.supabase) checkAuthStatus();
});window.renderRecipes = renderRecipes;
