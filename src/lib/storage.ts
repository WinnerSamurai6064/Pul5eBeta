import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Post, User, AppConfig, Story } from '../types';

// Environment variables for production deployment (Supabase/Cloudinary)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

const DEFAULT_CONFIG: AppConfig = {
  theme: {
    primaryColor: '#FF6A00',
    glassBlur: 20,
    glassOpacity: 0.1,
    borderRadius: 40,
    fontFamily: 'Inter'
  },
  mechanics: {
    enableLogin: true,
    enableSignup: true,
    enableLikes: true,
    enableBookmarks: true,
    enableComments: true,
    enableSearch: true,
    enableProfileEditing: true
  }
};

class StorageService {
  private posts: Post[] = [];
  private users: User[] = [];
  private stories: Story[] = [];
  private config: AppConfig = DEFAULT_CONFIG;
  private supabase: SupabaseClient | null = null;
  private currentUser: User | null = null;

  constructor() {
    // Initialize Supabase if credentials exist
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Pul5e: Supabase initialized successfully.');
      } catch (e) {
        console.error('Pul5e: Failed to initialize Supabase.', e);
      }
    }

    const savedPosts = localStorage.getItem('pul5e_posts');
    const savedUsers = localStorage.getItem('pul5e_users');
    const savedStories = localStorage.getItem('pul5e_stories');
    const savedConfig = localStorage.getItem('pul5e_config');
    
    if (savedPosts) this.posts = JSON.parse(savedPosts);
    if (savedUsers) this.users = JSON.parse(savedUsers);
    if (savedStories) this.stories = JSON.parse(savedStories);
    if (savedConfig) this.config = JSON.parse(savedConfig);

    const savedCurrentUser = localStorage.getItem('pul5e_current_user');
    if (savedCurrentUser) this.currentUser = JSON.parse(savedCurrentUser);

    // Initial Admin User
    if (this.users.length === 0) {
      const admin: User = {
        id: 'admin-1',
        username: 'PUL5E',
        displayName: 'Pul5e Official',
        avatar: 'https://picsum.photos/seed/pul5e/200',
        bio: 'Connecting the world through visual pulse.',
        isVerified: true,
        isPrivate: false,
        followersCount: 12500,
        followingCount: 42,
        postsCount: 0
      };
      this.users.push(admin);
      this.saveUsers();
    }

    // Initial Posts
    if (this.posts.length === 0) {
      this.posts = [
        {
          id: 'post-1',
          userId: 'admin-1',
          imageUrl: 'https://huggingface.co/spaces/Shinhati2023/stohrage/resolve/main/IMG_0850.jpeg',
          caption: 'Welcome to Pul5e! Experience the visual rhythm.',
          createdAt: new Date().toISOString(),
          likes: 124,
          hashtags: ['Pul5e', 'Welcome', 'Visual']
        },
        {
          id: 'post-2',
          userId: 'admin-1',
          imageUrl: 'https://huggingface.co/spaces/Shinhati2023/stohrage/resolve/main/IMG_0849.jpeg',
          caption: 'Capturing moments that matter.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          likes: 89,
          hashtags: ['Moments', 'Photography']
        }
      ];
      this.savePosts();
    }
  }

  getConfig(): AppConfig {
    return this.config;
  }

  setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('pul5e_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pul5e_current_user');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  saveConfig(config: AppConfig) {
    this.config = config;
    localStorage.setItem('pul5e_config', JSON.stringify(config));
    this.applyTheme(config);
  }

  private applyTheme(config: AppConfig) {
    const root = document.documentElement;
    root.style.setProperty('--cta', config.theme.primaryColor);
    root.style.setProperty('--glass-blur', `${config.theme.glassBlur}px`);
    // We can add more dynamic styles here
  }

  getConnectionStatus() {
    return {
      supabase: !!this.supabase,
      cloudinary: !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET),
      localStorage: true,
      config: {
        hasSupabaseUrl: !!SUPABASE_URL,
        hasSupabaseKey: !!SUPABASE_ANON_KEY,
        hasCloudinaryName: !!CLOUDINARY_CLOUD_NAME,
        hasCloudinaryPreset: !!CLOUDINARY_UPLOAD_PRESET
      }
    };
  }

  private savePosts() {
    try {
      localStorage.setItem('pul5e_posts', JSON.stringify(this.posts));
    } catch (e) {
      console.error('Pul5e: LocalStorage full. Clearing old posts...', e);
      // If full, keep only the last 10 posts locally
      if (this.posts.length > 10) {
        this.posts = this.posts.slice(0, 10);
        localStorage.setItem('pul5e_posts', JSON.stringify(this.posts));
      }
    }
  }

  private saveStories() {
    try {
      localStorage.setItem('pul5e_stories', JSON.stringify(this.stories));
    } catch (e) {
      console.error('Failed to save stories to localStorage.', e);
    }
  }

  private saveUsers() {
    try {
      localStorage.setItem('pul5e_users', JSON.stringify(this.users));
    } catch (e) {
      console.error('Failed to save users to localStorage.', e);
    }
  }

  async getPosts(): Promise<Post[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('posts')
        .select('*')
        .order('createdAt', { ascending: false });
      if (!error && data) return data as Post[];
    }
    return [...this.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getStories(): Promise<Story[]> {
    // Filter out stories older than 24 hours
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    this.stories = this.stories.filter(s => (now - new Date(s.createdAt).getTime()) < oneDay);
    this.saveStories();
    return [...this.stories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createStory(story: Omit<Story, 'id' | 'createdAt'>): Promise<Story> {
    const newStory: Story = {
      ...story,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    this.stories.push(newStory);
    this.saveStories();
    return newStory;
  }

  async deleteStory(storyId: string): Promise<void> {
    const story = this.stories.find(s => s.id === storyId);
    if (story?.publicId) {
      this.deleteImage(story.publicId);
    }
    this.stories = this.stories.filter(s => s.id !== storyId);
    this.saveStories();
  }

  async createPost(post: Omit<Post, 'id' | 'createdAt' | 'likes'>): Promise<Post> {
    const newPost: Post = {
      ...post,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      likes: 0
    };

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('posts')
        .insert([newPost])
        .select()
        .single();
      if (!error && data) return data as Post;
    }

    this.posts.push(newPost);
    this.savePosts();
    return newPost;
  }

  async deletePost(postId: string): Promise<void> {
    const post = this.posts.find(p => p.id === postId);
    if (post?.publicId) {
      this.deleteImage(post.publicId);
    }
    if (this.supabase) {
      await this.supabase.from('posts').delete().eq('id', postId);
    }
    this.posts = this.posts.filter(p => p.id !== postId);
    this.savePosts();
  }

  async getUser(username: string): Promise<User | undefined> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      if (!error && data) return data as User;
    }
    return this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  async updateUser(user: User): Promise<void> {
    if (this.supabase) {
      await this.supabase.from('users').update(user).eq('id', user.id);
    }
    const index = this.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
      this.saveUsers();
    }
  }

  async deleteUser(userId: string): Promise<void> {
    if (this.supabase) {
      await this.supabase.from('users').delete().eq('id', userId);
      await this.supabase.from('posts').delete().eq('userId', userId);
    }
    this.users = this.users.filter(u => u.id !== userId);
    this.posts = this.posts.filter(p => p.userId !== userId);
    this.saveUsers();
    this.savePosts();
  }

  async signup(username: string, displayName: string): Promise<User> {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      displayName,
      avatar: `https://picsum.photos/seed/${username}/200`,
      bio: 'New Pulse user.',
      isVerified: false,
      isPrivate: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0
    };

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();
      if (!error && data) return data as User;
    }

    this.users.push(newUser);
    this.saveUsers();
    return newUser;
  }

  // Cloudinary Image Upload Helper
  async uploadImage(file: File): Promise<{ url: string; publicId?: string }> {
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      return { url: data.secure_url, publicId: data.public_id };
    }
    
    // Fallback to compressed base64 for local persistence
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 1080px
          const maxDim = 1080;
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to 0.7 quality
          resolve({ url: canvas.toDataURL('image/jpeg', 0.7) });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  // Cloudinary Image Deletion Helper (Simulated/Placeholder)
  async deleteImage(publicId: string): Promise<void> {
    console.log(`Pul5e: Request sent to delete image ${publicId} from Cloudinary.`);
    // In a real app with a backend, we'd call our server to delete from Cloudinary
    // using the admin API and signature.
  }
}

export const storage = new StorageService();
