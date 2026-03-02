import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Post, User, AppConfig, Story, Notification } from '../types';

import { DEFAULT_AVATAR } from './defaults';

// Environment variables for production deployment (Supabase/Cloudinary)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'PUL5E';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

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
  private notifications: Notification[] = [];
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
    const savedNotifications = localStorage.getItem('pul5e_notifications');

    if (savedNotifications) {
      try {
        this.notifications = JSON.parse(savedNotifications);
      } catch (e) {
        this.notifications = [];
      }
    }
    
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
        username: ADMIN_USERNAME,
        displayName: 'Pul5e Official',
        avatar: DEFAULT_AVATAR,
        bio: 'Connecting the world through visual pulse.',
        isVerified: true,
        isPrivate: false,
        followersCount: 12500,
        followingCount: 42,
        postsCount: 0,
        isAdmin: true,
        password: ADMIN_PASSWORD
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

  async getConnectionStatus() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      return {
        supabase: data.supabase === 'Connected',
        cloudinary: data.cloudinary === 'Configured',
        localStorage: true,
        details: data
      };
    } catch (e) {
      return {
        supabase: false,
        cloudinary: false,
        localStorage: true,
        details: { error: 'Backend unreachable' }
      };
    }
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

  private saveNotifications() {
    try {
      localStorage.setItem('pul5e_notifications', JSON.stringify(this.notifications));
    } catch (e) {
      console.error('Failed to save notifications to localStorage.', e);
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      read: false
    };
    this.notifications.unshift(newNotification);
    this.saveNotifications();
    return newNotification;
  }

  async markNotificationsRead(userId: string): Promise<void> {
    this.notifications = this.notifications.map(n => n.userId === userId ? { ...n, read: true } : n);
    this.saveNotifications();
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

    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const cloudinaryPosts: Post[] = await res.json();
        if (cloudinaryPosts && cloudinaryPosts.length > 0) {
          // Merge with local posts to preserve comments and likes
          const merged = cloudinaryPosts.map(cp => {
            const localPost = this.posts.find(lp => lp.id === cp.id);
            if (localPost) {
              return { ...cp, comments: localPost.comments || [], likes: localPost.likes || 0 };
            }
            return cp;
          });
          
          // Add any local posts that aren't in Cloudinary (e.g., local blobs)
          const localOnly = this.posts.filter(lp => !cloudinaryPosts.some(cp => cp.id === lp.id));
          
          this.posts = [...merged, ...localOnly].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.savePosts();
          return this.posts;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch posts from Cloudinary backend", e);
    }

    return [...this.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getStories(): Promise<Story[]> {
    // Filter out stories older than 6 hours
    const now = new Date().getTime();
    const sixHours = 6 * 60 * 60 * 1000;
    this.stories = this.stories.filter(s => (now - new Date(s.createdAt).getTime()) < sixHours);
    this.saveStories();

    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('stories')
        .select('*')
        .order('createdAt', { ascending: false });
      if (!error && data) return data as Story[];
    }

    try {
      const res = await fetch('/api/stories');
      if (res.ok) {
        const cloudinaryStories: Story[] = await res.json();
        if (cloudinaryStories && cloudinaryStories.length > 0) {
          const localOnly = this.stories.filter(ls => !cloudinaryStories.some(cs => cs.id === ls.id));
          this.stories = [...cloudinaryStories, ...localOnly].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          this.saveStories();
          return this.stories;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch stories from Cloudinary backend", e);
    }

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

  async updatePost(post: Post): Promise<void> {
    if (this.supabase) {
      await this.supabase.from('posts').update(post).eq('id', post.id);
    }
    const index = this.posts.findIndex(p => p.id === post.id);
    if (index !== -1) {
      this.posts[index] = post;
      this.savePosts();
    }
  }

  async getUsers(): Promise<User[]> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('users')
        .select('*');
      if (!error && data) return data as User[];
    }
    return this.users;
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

  async followUser(followerId: string, followingId: string): Promise<void> {
    const follower = this.users.find(u => u.id === followerId);
    const following = this.users.find(u => u.id === followingId);

    if (!follower || !following) return;

    if (!follower.following) follower.following = [];
    if (!following.followers) following.followers = [];

    const isFollowing = follower.following.includes(followingId);

    if (isFollowing) {
      // Unfollow
      follower.following = follower.following.filter(id => id !== followingId);
      following.followers = following.followers.filter(id => id !== followerId);
      follower.followingCount = Math.max(0, follower.followingCount - 1);
      following.followersCount = Math.max(0, following.followersCount - 1);
    } else {
      // Follow
      follower.following.push(followingId);
      following.followers.push(followerId);
      follower.followingCount += 1;
      following.followersCount += 1;

      // Add notification
      await this.addNotification({
        userId: followingId,
        actorId: followerId,
        type: 'follow'
      });
    }

    await this.updateUser(follower);
    await this.updateUser(following);
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

  async signup(username: string, displayName: string, password?: string): Promise<User> {
    // Ensure private accounts exist
    let pul5eTeam = this.users.find(u => u.username === 'pul5eteam');
    if (!pul5eTeam) {
      pul5eTeam = {
        id: 'pul5eteam',
        username: 'pul5eteam',
        displayName: 'Pul5e Teams',
        avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f97316'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z'/%3E%3C/svg%3E",
        bio: 'Pul5e official team',
        isVerified: true,
        verifiedType: 'blue',
        isPrivate: true,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        following: []
      };
      this.users.push(pul5eTeam);
    }

    let tekDev = this.users.find(u => u.username === 'tekdev');
    if (!tekDev) {
      tekDev = {
        id: 'tekdev',
        username: 'tekdev',
        displayName: 'Tek Development',
        avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Ctext x='50%25' y='50%25' font-size='12' text-anchor='middle' alignment-baseline='middle' font-family='sans-serif' font-weight='bold' fill='white'%3ETD%3C/text%3E%3C/svg%3E",
        bio: 'we develop amazing web apps',
        isVerified: true,
        verifiedType: 'blue',
        isPrivate: true,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        following: []
      };
      this.users.push(tekDev);
    }

    const newUserId = Math.random().toString(36).substr(2, 9);

    const newUser: User = {
      id: newUserId,
      username,
      displayName,
      avatar: DEFAULT_AVATAR,
      bio: 'New Pulse user.',
      isVerified: false,
      isPrivate: false,
      followersCount: 2,
      followingCount: 0,
      followers: ['pul5eteam', 'tekdev'],
      postsCount: 0,
      password: password,
      isAdmin: username.toLowerCase() === 'pul5e' // Hardcode admin for this specific username
    };

    pul5eTeam.following = [...(pul5eTeam.following || []), newUserId];
    pul5eTeam.followingCount += 1;
    
    tekDev.following = [...(tekDev.following || []), newUserId];
    tekDev.followingCount += 1;

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

  async login(username: string, password?: string): Promise<User | null> {
    const user = await this.getUser(username);
    if (!user) return null;
    
    // In a real app, we'd use bcrypt to compare hashes
    if (user.password === password) {
      return user;
    }
    
    // Fallback for admin if not in DB yet
    if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase() && password === ADMIN_PASSWORD && !user.password) {
      return user;
    }

    return null;
  }

  // Cloudinary Image Upload Helper
  async uploadImage(file: File, caption?: string, userId?: string, type?: 'post' | 'story'): Promise<{ url: string; publicId?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (caption) formData.append('caption', caption);
      if (userId) formData.append('userId', userId);
      if (type) formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return { url: data.url, publicId: data.publicId };
      }
    } catch (error) {
      console.warn('Backend upload failed, falling back to local base64', error);
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

  // Cloudinary Image Deletion Helper
  async deleteImage(publicId: string): Promise<void> {
    try {
      await fetch('/api/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId })
      });
      console.log(`Pul5e: Deleted image ${publicId} from Cloudinary.`);
    } catch (error) {
      console.error(`Pul5e: Failed to delete image ${publicId}.`, error);
    }
  }
}

export const storage = new StorageService();
