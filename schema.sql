-- Supabase Schema for Recipe Management Web Application

-- 1. Create custom types if needed (Optional, but good for difficulty)
CREATE TYPE recipe_difficulty AS ENUM ('Easy', 'Medium', 'Hard');

-- 2. Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create a profile for a new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Create recipes table
CREATE TABLE public.recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT, -- Can be a Supabase Storage URL or base64 string
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    servings INTEGER,
    difficulty recipe_difficulty DEFAULT 'Medium',
    tags TEXT[], -- Array of strings for categories like 'Vegan', 'Dinner'
    instructions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of step-by-step instructions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on recipes
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Recipes RLS Policies (Private collections: Users can only see/modify their own recipes)
CREATE POLICY "Users can view their own recipes"
    ON public.recipes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
    ON public.recipes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
    ON public.recipes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
    ON public.recipes FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Create ingredients table
CREATE TABLE public.ingredients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount TEXT,
    unit TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on ingredients
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

-- Ingredients RLS Policies (Derived from recipes table)
CREATE POLICY "Users can view ingredients of their recipes"
    ON public.ingredients FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = ingredients.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert ingredients for their recipes"
    ON public.ingredients FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = ingredients.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update ingredients of their recipes"
    ON public.ingredients FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = ingredients.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete ingredients of their recipes"
    ON public.ingredients FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = ingredients.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

-- 5. Storage (Optional but recommended to show setup for cover images if using Storage)
-- Assuming a bucket named 'recipe-images'
-- insert storage.buckets (id, name, public) values ('recipe-images', 'recipe-images', true);
-- create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'recipe-images' );
-- create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'recipe-images' );
