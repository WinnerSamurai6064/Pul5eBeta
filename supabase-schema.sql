-- Pul5e Supabase Schema Setup

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  username text UNIQUE NOT NULL,
  "displayName" text NOT NULL,
  avatar text,
  bio text,
  "isVerified" boolean DEFAULT false,
  "isPrivate" boolean DEFAULT false,
  "followersCount" integer DEFAULT 0,
  "followingCount" integer DEFAULT 0,
  "postsCount" integer DEFAULT 0,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id text PRIMARY KEY,
  "userId" text REFERENCES public.users(id) ON DELETE CASCADE,
  "imageUrl" text NOT NULL,
  "publicId" text,
  caption text,
  likes integer DEFAULT 0,
  hashtags text[] DEFAULT '{}',
  comments jsonb DEFAULT '[]'::jsonb,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Stories Table
CREATE TABLE IF NOT EXISTS public.stories (
  id text PRIMARY KEY,
  "userId" text REFERENCES public.users(id) ON DELETE CASCADE,
  "imageUrl" text NOT NULL,
  "publicId" text,
  "createdAt" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "expiresAt" timestamp with time zone NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies (Allow all for public beta)
-- Users
CREATE POLICY "Allow public read access on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on users" ON public.users FOR DELETE USING (true);

-- Posts
CREATE POLICY "Allow public read access on posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Allow public insert on posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on posts" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on posts" ON public.posts FOR DELETE USING (true);

-- Stories
CREATE POLICY "Allow public read access on stories" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Allow public insert on stories" ON public.stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on stories" ON public.stories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on stories" ON public.stories FOR DELETE USING (true);

-- 6. Insert Initial Admin User
INSERT INTO public.users (id, username, "displayName", avatar, bio, "isVerified", "isPrivate", "followersCount", "followingCount", "postsCount")
VALUES (
  'admin-1',
  'PUL5E',
  'Pul5e Official',
  'data:image/svg+xml,%3Csvg xmlns=''http://www.w3.org/2000/svg'' viewBox=''0 0 24 24'' fill=''%239ca3af''%3E%3Cpath d=''M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z''/%3E%3C/svg%3E',
  'Connecting the world through visual pulse.',
  true,
  false,
  12500,
  42,
  0
) ON CONFLICT (id) DO NOTHING;
