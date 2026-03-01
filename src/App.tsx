import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  PlusSquare, 
  User as UserIcon, 
  Settings, 
  LogOut,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Lock,
  Trash2,
  X,
  Zap,
  ArrowRight,
  ChevronRight,
  Check,
  Camera
} from 'lucide-react';
import { cn } from './lib/utils';
import { storage } from './lib/storage';
import { Post, User, AppConfig, Story } from './types';
import { AdminPanel } from './components/AdminPanel';

// --- Components ---

const VerificationBadge = ({ username, size = "sm" }: { username: string; size?: "sm" | "lg" }) => {
  if (username !== 'PUL5E') return null;
  const containerSize = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  const iconSize = size === "lg" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className={cn("flex items-center justify-center bg-blue-500 rounded-full", containerSize)}>
      <Check className={cn("text-white stroke-[4]", iconSize)} />
    </div>
  );
};

const LoadingScreen = () => (
  <motion.div 
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    className="fixed inset-0 z-[1000] bg-app-bg flex items-center justify-center"
  >
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative p-8 rounded-[40px] glass border-cta/20"
      style={{ background: 'rgba(255, 106, 0, 0.1)' }}
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 1.5,
          ease: "easeInOut"
        }}
      >
        <Zap className="w-16 h-16 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" />
      </motion.div>
    </motion.div>
  </motion.div>
);

const GlassButton = ({ children, onClick, className, active }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "p-3 rounded-2xl transition-all duration-300 flex items-center justify-center",
      active ? "bg-cta/20 scale-110" : "hover:bg-white/10",
      className
    )}
  >
    {children}
  </button>
);

const PostCard = ({ post, user, onDelete, config }: { post: Post; user: User; onDelete?: (id: string) => any; config: AppConfig; key?: any; isOwnPost?: boolean }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full aspect-[9/16] max-h-[80vh] rounded-[40px] overflow-hidden border-hairline transition-all duration-500 bg-black shadow-2xl"
      style={{ borderRadius: `${config.theme.borderRadius}px` }}
    >
      {/* Image Layer - Bottom */}
      <img 
        src={post.imageUrl} 
        alt="Post content" 
        className="absolute inset-0 w-full h-full object-cover z-0"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          console.error("Pul5e: Image failed to load:", target.src);
          if (!target.src.includes('picsum.photos/seed/error')) {
            target.src = 'https://picsum.photos/seed/error/1080/1920';
          }
        }}
      />
      
      {/* Overlay Layer - Middle */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end p-8 z-10 pointer-events-none">
        <div className="flex items-center justify-between mb-4 pointer-events-auto">
          <div className="flex items-center gap-3">
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-cta/30" referrerPolicy="no-referrer" />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-lg text-white">{user.username}</span>
                <VerificationBadge username={user.username} />
              </div>
              <p className="text-white/60 text-xs">Original Audio • {post.likes} likes</p>
            </div>
          </div>
        </div>
        
        <p className="text-white/90 text-sm mb-4 line-clamp-3 pointer-events-auto">
          {post.caption}
          <span className="block mt-2 text-cta font-medium">
            {post.hashtags.map(h => `#${h} `)}
          </span>
        </p>

        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex gap-6">
            <Heart className="w-7 h-7 text-white hover:text-cta cursor-pointer transition-colors" />
            <MessageCircle className="w-7 h-7 text-white hover:text-cta cursor-pointer transition-colors" />
            <Send className="w-7 h-7 text-white hover:text-cta cursor-pointer transition-colors" />
          </div>
          <Bookmark className="w-7 h-7 text-white hover:text-cta cursor-pointer transition-colors" />
        </div>
      </div>

      {/* Action Layer - Top */}
      {onDelete && (
        <div className="absolute top-6 right-6 z-30">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(post.id);
            }}
            className="p-3 bg-red-500/80 hover:bg-red-500 backdrop-blur-md rounded-full transition-all border border-white/20 shadow-xl"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </motion.div>
  );
};

// --- Main App ---

function MainApp() {
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'landing' | 'signup' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [config, setConfig] = useState<AppConfig>(storage.getConfig());
  const [stories, setStories] = useState<Story[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Create Post State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newCaption, setNewCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Story State
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);
  const [selectedStoryFile, setSelectedStoryFile] = useState<File | null>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  // Edit Profile State
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'post' | 'story'>('post');

  // Diagnostics State
  const [systemStatus, setSystemStatus] = useState<any>(null);

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      const allPosts = await storage.getPosts();
      setPosts(allPosts);
      
      const allStories = await storage.getStories();
      setStories(allStories);

      // Fetch all users for stories
      const savedUsers = localStorage.getItem('pul5e_users');
      if (savedUsers) setUsers(JSON.parse(savedUsers));

      const user = await storage.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setView('app');
        setIsPrivate(user.isPrivate);
      }

      // Apply theme on mount
      const currentConfig = storage.getConfig();
      setConfig(currentConfig);
      const root = document.documentElement;
      root.style.setProperty('--cta', currentConfig.theme.primaryColor);
      root.style.setProperty('--glass-blur', `${currentConfig.theme.glassBlur}px`);
      root.style.fontFamily = currentConfig.theme.fontFamily;

      setTimeout(() => setIsLoading(false), 1500);
    };
    init();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.mechanics.enableLogin) {
      setError('Login is currently disabled by administrator.');
      return;
    }
    setError('');
    
    // Admin check
    if (username.toLowerCase() === 'pul5e' && password === 'admin') {
      const admin = await storage.getUser('PUL5E');
      if (admin) {
        setCurrentUser(admin);
        storage.setCurrentUser(admin);
        setView('app');
        setIsPrivate(admin.isPrivate);
        return;
      }
    }

    const user = await storage.getUser(username);
    if (user) {
      setCurrentUser(user);
      storage.setCurrentUser(user);
      setView('app');
      setIsPrivate(user.isPrivate);
    } else {
      setError('User not found. Please sign up.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.mechanics.enableSignup) {
      setError('Registration is currently disabled by administrator.');
      return;
    }
    if (!username || !displayName) {
      setError('Please fill all fields');
      return;
    }
    const existing = await storage.getUser(username);
    if (existing) {
      setError('Username already taken');
      return;
    }
    const newUser = await storage.signup(username, displayName);
    setCurrentUser(newUser);
    storage.setCurrentUser(newUser);
    setView('app');
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    setIsSavingProfile(true);
    try {
      let avatarUrl = currentUser.avatar;
      if (editAvatarFile) {
        const { url } = await storage.uploadImage(editAvatarFile);
        avatarUrl = url;
      }
      
      const updatedUser = {
        ...currentUser,
        displayName: editDisplayName,
        bio: editBio,
        avatar: avatarUrl
      };
      
      await storage.updateUser(updatedUser);
      setCurrentUser(updatedUser);
      setIsEditProfileModalOpen(false);
      setEditAvatarFile(null);
    } catch (err) {
      console.error('Profile update failed:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateStory = async () => {
    if (!currentUser || !selectedStoryFile) return;
    setIsUploadingStory(true);
    try {
      const { url, publicId } = await storage.uploadImage(selectedStoryFile);
      const newStory = await storage.createStory({
        userId: currentUser.id,
        imageUrl: url,
        publicId
      });
      setStories([newStory, ...stories]);
      setIsCreateStoryModalOpen(false);
      setSelectedStoryFile(null);
    } catch (err) {
      console.error('Story upload failed:', err);
    } finally {
      setIsUploadingStory(false);
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser || !selectedFile) return;
    
    setIsUploading(true);
    try {
      const { url, publicId } = await storage.uploadImage(selectedFile);
      
      const newPost = await storage.createPost({
        userId: currentUser.id,
        imageUrl: url,
        publicId,
        caption: newCaption,
        hashtags: ['Pul5e', 'socialmedia', 'trending', 'valentines', 'March', 'Pul5ebeta']
      });
      
      setPosts([newPost, ...posts]);
      setIsCreateModalOpen(false);
      setSelectedFile(null);
      setNewCaption('');
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStoryDelete = async (storyId: string) => {
    setDeleteConfirmId(storyId);
    setDeleteConfirmType('story');
  };

  const handleDeletePost = async (id: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmType('post');
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    if (deleteConfirmType === 'post') {
      await storage.deletePost(deleteConfirmId);
      setPosts(posts.filter(p => p.id !== deleteConfirmId));
    } else {
      await storage.deleteStory(deleteConfirmId);
      setStories(stories.filter(s => s.id !== deleteConfirmId));
      setIsStoryModalOpen(false);
    }
    setDeleteConfirmId(null);
  };

  const togglePrivate = async () => {
    if (!currentUser) return;
    const updated = { ...currentUser, isPrivate: !isPrivate };
    await storage.updateUser(updated);
    setCurrentUser(updated);
    setIsPrivate(!isPrivate);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    if (confirm('Are you sure you want to delete your account? This is permanent.')) {
      await storage.deleteUser(currentUser.id);
      setCurrentUser(null);
      storage.setCurrentUser(null);
      setView('landing');
      setActiveTab('home');
    }
  };

  const filteredPosts = posts.filter(p => 
    p.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.hashtags.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) return <LoadingScreen />;

  if (view === 'landing' || view === 'signup') {
    return (
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-2">
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="inline-block p-4 rounded-[30px] glass mb-4"
              style={{ background: 'rgba(255, 106, 0, 0.1)' }}
            >
              <Zap className="w-12 h-12 text-cta fill-cta" />
            </motion.div>
            <h1 className="text-5xl font-black italic tracking-tighter">PUL5E</h1>
            <p className="text-secondary-text font-medium">Global Connectivity Platform</p>
          </div>

          <div className="glass-thick rounded-[40px] p-8 space-y-6">
            <h2 className="text-2xl font-bold">{view === 'landing' ? 'Welcome Back' : 'Join the Pulse'}</h2>
            
            <form onSubmit={view === 'landing' ? handleLogin : handleSignup} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-2">Username</label>
                <input 
                  type="text" 
                  className="w-full glass p-4 rounded-2xl outline-none focus:ring-2 ring-cta/20 transition-all"
                  placeholder="@username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {view === 'signup' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-2">Display Name</label>
                  <input 
                    type="text" 
                    className="w-full glass p-4 rounded-2xl outline-none focus:ring-2 ring-cta/20 transition-all"
                    placeholder="Your Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              )}

              {view === 'landing' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-2">Password</label>
                  <input 
                    type="password" 
                    className="w-full glass p-4 rounded-2xl outline-none focus:ring-2 ring-cta/20 transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}

              {error && <p className="text-red-500 text-sm ml-2 font-medium">{error}</p>}

              <button 
                type="submit"
                className={cn(
                  "w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg",
                  view === 'landing' 
                    ? "glass-thick border-cta/40 text-cta hover:bg-cta/10" 
                    : "bg-cta text-cta-text shadow-cta/20"
                )}
              >
                {view === 'landing' ? 'Access' : 'Create Pulse'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            <div className="pt-4 text-center">
              <button 
                onClick={() => {
                  setView(view === 'landing' ? 'signup' : 'landing');
                  setError('');
                }}
                className="text-sm font-bold text-link-orange hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                {view === 'landing' ? "Don't have an account? Sign Up" : "Already a member? Log In"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pb-32 bg-app-bg">
      {/* Thick Glass Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-center">
        <div className="w-full max-w-lg glass-thick rounded-[30px] px-6 py-3 flex items-center justify-between border-hairline">
          <h1 className="text-2xl font-black tracking-tighter italic text-cta">
            PUL5E
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{currentUser?.username}</span>
              <VerificationBadge username={currentUser?.username || ''} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-lg px-4 pt-28 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              {/* Stories Bar */}
              <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar">
                <button 
                  onClick={() => setIsCreateStoryModalOpen(true)}
                  className="flex-shrink-0 flex flex-col items-center gap-2"
                >
                  <div className="w-16 h-16 rounded-full glass border-2 border-cta/30 flex items-center justify-center relative">
                    <img src={currentUser?.avatar} className="w-14 h-14 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute bottom-0 right-0 bg-cta rounded-full p-1 border-2 border-app-bg">
                      <PlusSquare className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-secondary-text">Your Story</span>
                </button>

                {stories.map(story => {
                  const storyUser = users.find(u => u.id === story.userId) || { 
                    username: 'User', 
                    avatar: `https://picsum.photos/seed/${story.userId}/200` 
                  };
                  return (
                    <button 
                      key={story.id}
                      onClick={() => {
                        setSelectedStory(story);
                        setIsStoryModalOpen(true);
                      }}
                      className="flex-shrink-0 flex flex-col items-center gap-2"
                    >
                      <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-cta to-emerald-500">
                        <div className="w-full h-full rounded-full border-2 border-app-bg overflow-hidden">
                          <img src={storyUser.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-secondary-text truncate w-16 text-center">
                        {storyUser.username}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    config={config}
                    isOwnPost={currentUser?.id === post.userId}
                    user={users.find(u => u.id === post.userId) || { 
                      id: 'anon', 
                      username: 'Anonymous', 
                      avatar: 'https://picsum.photos/seed/anon/200',
                      isVerified: false 
                    } as any} 
                    onDelete={currentUser?.id === post.userId ? handleDeletePost : undefined}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-secondary-text">
                  <PlusSquare className="w-12 h-12 mb-4 opacity-20" />
                  <p>No pulses found. Start the beat.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'search' && config.mechanics.enableSearch && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="glass-thick rounded-[25px] p-2 flex items-center gap-3 border-hairline">
                <Search className="w-5 h-5 ml-3 text-secondary-text" />
                <input 
                  type="text" 
                  placeholder="Search hashtags or pulses..." 
                  className="bg-transparent border-none outline-none flex-1 py-2 text-sm text-text-primary placeholder:text-secondary-text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {['#glass', '#future', '#pul5e', '#liquid', '#design', '#vibes'].map(tag => (
                  <div 
                    key={tag}
                    onClick={() => setSearchQuery(tag.replace('#', ''))}
                    className="glass p-4 rounded-2xl cursor-pointer hover:bg-cta/10 hover:border-cta/30 transition-all text-center font-bold text-secondary-text hover:text-cta"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {currentUser && (
                <>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <img src={currentUser.avatar} className="w-28 h-28 rounded-full border-4 border-cta/20 p-1" referrerPolicy="no-referrer" />
                      {currentUser.username === 'PUL5E' && (
                        <div className="absolute bottom-1 right-1 bg-app-bg rounded-full p-0.5">
                          <VerificationBadge username={currentUser.username} size="lg" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black italic">{currentUser.displayName}</h2>
                      <p className="text-secondary-text font-medium">@{currentUser.username}</p>
                    </div>
                    <p className="text-sm max-w-xs text-secondary-text">{currentUser.bio}</p>
                    
                    {config.mechanics.enableProfileEditing && (
                      <button 
                        onClick={() => {
                          setEditDisplayName(currentUser.displayName);
                          setEditBio(currentUser.bio);
                          setIsEditProfileModalOpen(true);
                        }}
                        className="px-6 py-2 glass rounded-full text-xs font-bold hover:bg-white/10 transition-all border-hairline"
                      >
                        Edit Profile
                      </button>
                    )}
                    
                    <div className="flex gap-8 py-6 border-y border-hairline w-full justify-center">
                      <div className="text-center">
                        <div className="font-black text-xl">{posts.filter(p => p.userId === currentUser.id).length}</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-secondary-text">Pulses</div>
                      </div>
                      <div className="text-center">
                        <div className="font-black text-xl">{currentUser.followersCount.toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-secondary-text">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-black text-xl">{currentUser.followingCount}</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-secondary-text">Following</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {posts.filter(p => p.userId === currentUser.id).map(post => (
                      <div key={post.id} className="aspect-square glass rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-all border-hairline">
                        <img 
                          src={post.imageUrl} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/400';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-black italic mb-6">Settings</h2>
              
              <div className="space-y-3">
                <div className="glass p-5 rounded-[25px] flex flex-col gap-4 border-hairline">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10">
                        <Zap className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className="font-bold">System Diagnostics</span>
                    </div>
                    <button 
                      onClick={() => setSystemStatus(storage.getConnectionStatus())}
                      className="text-xs font-bold text-cta hover:underline"
                    >
                      Check Status
                    </button>
                  </div>
                  
                  {systemStatus && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", systemStatus.supabase ? "bg-emerald-500" : "bg-red-500")} />
                        <span className="text-[10px] font-bold uppercase text-secondary-text">Supabase</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", systemStatus.cloudinary ? "bg-emerald-500" : "bg-red-500")} />
                        <span className="text-[10px] font-bold uppercase text-secondary-text">Cloudinary</span>
                      </div>
                      {!systemStatus.supabase && (
                        <p className="col-span-2 text-[9px] text-red-500/60 leading-tight">
                          * Supabase keys missing in .env. Falling back to LocalStorage.
                        </p>
                      )}
                      {!systemStatus.cloudinary && (
                        <p className="col-span-2 text-[9px] text-red-500/60 leading-tight">
                          * Cloudinary keys missing. Images stored as local Base64.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="glass p-5 rounded-[25px] flex items-center justify-between border-hairline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10">
                      <Lock className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="font-bold">Private Account</span>
                  </div>
                  <button 
                    onClick={togglePrivate}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      isPrivate ? "bg-cta" : "bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                      isPrivate ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>

                <div className="glass p-5 rounded-[25px] flex items-center justify-between border-hairline">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cta/10 text-cta">
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="font-bold">Admin C-Panel</span>
                  </div>
                  <button 
                    onClick={() => window.location.href = '/admin'}
                    className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cta/10 hover:text-cta transition-all"
                  >
                    Open Panel
                  </button>
                </div>

                <div className="glass p-5 rounded-[25px] flex items-center justify-between text-red-500 hover:bg-red-500/10 cursor-pointer transition-all border-hairline" onClick={handleDeleteAccount}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-500/10">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <span className="font-bold">Delete Account</span>
                  </div>
                </div>

                <div className="glass p-5 rounded-[25px] flex items-center justify-between text-secondary-text hover:bg-white/10 cursor-pointer transition-all border-hairline" onClick={() => { setCurrentUser(null); storage.setCurrentUser(null); setView('landing'); setActiveTab('home'); }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="font-bold">Log Out</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Thick Glass Bottom Navigation */}
      <nav className="fixed bottom-8 left-0 right-0 z-50 px-6 flex justify-center">
        <div className="w-full max-w-sm glass-thick rounded-[35px] px-4 py-3 flex items-center justify-between border-hairline">
          <GlassButton active={activeTab === 'home'} onClick={() => setActiveTab('home')}>
            <Home className="w-6 h-6" />
          </GlassButton>
          {config.mechanics.enableSearch && (
            <GlassButton active={activeTab === 'search'} onClick={() => setActiveTab('search')}>
              <Search className="w-6 h-6" />
            </GlassButton>
          )}
          <GlassButton className="bg-cta text-cta-text shadow-lg shadow-cta/20" onClick={() => setIsCreateModalOpen(true)}>
            <PlusSquare className="w-6 h-6" />
          </GlassButton>
          <GlassButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>
            <UserIcon className="w-6 h-6" />
          </GlassButton>
          <GlassButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
            <Settings className="w-6 h-6" />
          </GlassButton>
        </div>
      </nav>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass-thick rounded-[30px] p-8 text-center border-hairline"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black italic mb-2 uppercase">Delete {deleteConfirmType}?</h3>
              <p className="text-secondary-text text-sm mb-8">This action cannot be undone. Are you sure you want to remove this {deleteConfirmType}?</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="py-3 rounded-2xl font-bold bg-white/10 hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="py-3 rounded-2xl font-black bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Story Modal */}
      <AnimatePresence>
        {isCreateStoryModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-thick rounded-[40px] p-8 border-hairline"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic uppercase">New Story</h2>
                <button onClick={() => setIsCreateStoryModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div 
                  onClick={() => document.getElementById('story-file')?.click()}
                  className="aspect-[9/16] rounded-[30px] border-2 border-dashed border-cta/30 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-cta/5 transition-all overflow-hidden relative"
                >
                  {selectedStoryFile ? (
                    <img src={URL.createObjectURL(selectedStoryFile)} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-cta opacity-40" />
                      <p className="text-sm font-bold opacity-40 uppercase tracking-widest">Select Image</p>
                    </>
                  )}
                  <input 
                    id="story-file" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => setSelectedStoryFile(e.target.files?.[0] || null)}
                  />
                </div>

                <button 
                  onClick={handleCreateStory}
                  disabled={!selectedStoryFile || isUploadingStory}
                  className="w-full py-4 bg-cta text-white rounded-[20px] font-black uppercase tracking-widest shadow-xl shadow-cta/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploadingStory ? 'Uploading...' : 'Pulse Story'}
                  <Zap className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {isStoryModalOpen && selectedStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black flex items-center justify-center"
          >
            <div className="relative w-full h-full max-w-lg aspect-[9/16]">
              <img src={selectedStory.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              
              <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={users.find(u => u.id === selectedStory.userId)?.avatar || `https://picsum.photos/seed/${selectedStory.userId}/200`} 
                    className="w-10 h-10 rounded-full border-2 border-white/30" 
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white">
                        {users.find(u => u.id === selectedStory.userId)?.username || 'User'}
                      </span>
                      <VerificationBadge username={users.find(u => u.id === selectedStory.userId)?.username || ''} />
                    </div>
                    <p className="text-white/60 text-[10px] uppercase font-bold">
                      {new Date(selectedStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsStoryModalOpen(false)} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white">
                    <X className="w-6 h-6" />
                  </button>
                  {currentUser?.id === selectedStory.userId && (
                    <button 
                      onClick={() => handleStoryDelete(selectedStory.id)}
                      className="p-2 bg-red-500/20 backdrop-blur-md rounded-full text-red-500"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="absolute top-2 left-6 right-6 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  onAnimationComplete={() => setIsStoryModalOpen(false)}
                  className="h-full bg-white"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md glass-thick rounded-[40px] p-8 relative"
            >
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-3xl font-black mb-2 italic">NEW PULSE</h2>
              <p className="text-secondary-text mb-8 font-medium">Share your connectivity</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-2">Visual Content</label>
                  <div 
                    className="w-full aspect-[16/9] glass rounded-3xl flex flex-col items-center justify-center border-dashed border-2 border-white/10 hover:border-cta/40 transition-all cursor-pointer overflow-hidden group"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    {selectedFile ? (
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-all" 
                        onLoad={(e) => URL.revokeObjectURL((e.target as any).src)}
                      />
                    ) : (
                      <>
                        <PlusSquare className="w-10 h-10 text-white/20 mb-2 group-hover:text-cta transition-all" />
                        <span className="text-xs font-bold text-white/40 group-hover:text-white transition-all">Select Image</span>
                      </>
                    )}
                  </div>
                  <input 
                    id="file-input"
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-2">Caption</label>
                  <textarea 
                    className="w-full glass p-4 rounded-2xl outline-none focus:ring-2 ring-cta/20 transition-all min-h-[100px] resize-none text-sm"
                    placeholder="What's on your mind? Use #hashtags to connect..."
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                  />
                </div>
                
                <button 
                  onClick={handleCreatePost}
                  disabled={!selectedFile || isUploading}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg",
                    selectedFile && !isUploading 
                      ? "bg-cta text-cta-text shadow-cta/20 hover:scale-[1.02] active:scale-[0.98]" 
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  )}
                >
                  {isUploading ? 'Syncing...' : 'Pulse Now'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditProfileModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md glass-thick rounded-[40px] p-8 relative"
            >
              <button 
                onClick={() => setIsEditProfileModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-3xl font-black mb-2 italic uppercase">Edit Profile</h2>
              <p className="text-secondary-text mb-8 font-medium">Update your pulse identity</p>
              
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => document.getElementById('avatar-input')?.click()}
                  >
                    <img 
                      src={editAvatarFile ? URL.createObjectURL(editAvatarFile) : currentUser?.avatar} 
                      className="w-24 h-24 rounded-full border-4 border-cta/20 p-1 object-cover"
                      onLoad={(e) => editAvatarFile && URL.revokeObjectURL((e.target as any).src)}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <PlusSquare className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input 
                    id="avatar-input"
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setEditAvatarFile(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-2">Display Name</label>
                  <input 
                    type="text" 
                    className="w-full glass p-4 rounded-2xl outline-none focus:ring-2 ring-cta/20 transition-all text-sm"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-2">Bio</label>
                  <textarea 
                    className="w-full glass p-4 rounded-2xl outline-none focus:ring-2 ring-cta/20 transition-all min-h-[80px] resize-none text-sm"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                </div>
                
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isSavingProfile}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg bg-cta text-cta-text shadow-cta/20 hover:scale-[1.02] active:scale-[0.98]",
                    isSavingProfile && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSavingProfile ? 'Saving...' : 'Update Profile'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/" element={<MainApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
