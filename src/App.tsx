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
  Camera,
  Bell
} from 'lucide-react';
import { cn } from './lib/utils';
import { storage } from './lib/storage';
import { Post, User, AppConfig, Story, Notification } from './types';
import { AdminPanel } from './components/AdminPanel';
import { DEFAULT_AVATAR, DEFAULT_ERROR_IMAGE } from './lib/defaults';

// --- Components ---

const VerificationBadge = ({ user, size = "sm" }: { user: User; size?: "sm" | "lg" }) => {
  if (!user.isVerified) return null;
  
  const type = user.verifiedType || 'blue';
  
  const containerSize = size === "lg" ? "w-6 h-6" : "w-4 h-4";
  const iconSize = size === "lg" ? "w-4 h-4" : "w-3 h-3";
  
  const colorClass = {
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    green: "bg-green-500",
    none: "bg-blue-500"
  }[type];

  return (
    <div className={cn("flex items-center justify-center rounded-full glass border border-white/20 p-0.5", size === "lg" ? "w-8 h-8" : "w-5 h-5")}>
      <div className={cn("flex items-center justify-center rounded-full", colorClass, containerSize)}>
        <Check className={cn("text-white stroke-[4]", iconSize)} />
      </div>
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

const PostCard = ({ post, user, onDelete, onLike, onComment, onShareToStory, onSave, onViewProfile, config, currentUser, users }: { post: Post; user: User; onDelete?: (id: string) => any; onLike?: (id: string) => void; onComment?: (id: string, text: string) => void; onShareToStory?: (post: Post) => void; onSave?: (id: string) => void; onViewProfile?: (user: User) => void; config: AppConfig; key?: any; isOwnPost?: boolean; currentUser?: User | null; users: User[] }) => {
  const [showHeart, setShowHeart] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareAnim, setShowShareAnim] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const isLiked = currentUser && post.likedBy?.includes(currentUser.id);
  const isSaved = currentUser && currentUser.savedPosts?.includes(post.id);

  const handleDoubleTap = () => {
    setShowHeart(true);
    onLike?.(post.id);
    setTimeout(() => setShowHeart(false), 800);
  };

  const handleShare = () => {
    setShowShareAnim(true);
    onShareToStory?.(post);
    setTimeout(() => setShowShareAnim(false), 1200);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && onComment) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full aspect-[9/16] max-h-[80vh] rounded-[40px] overflow-hidden border-hairline transition-all duration-500 bg-black shadow-2xl"
      style={{ borderRadius: `${config.theme.borderRadius}px` }}
      onDoubleClick={handleDoubleTap}
    >
      {/* Image Layer - Bottom */}
      <img 
        src={post.imageUrl} 
        alt="Post content" 
        className="absolute inset-0 w-full h-full object-cover z-0"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          console.error("Pul5e: Image failed to load:", target.src);
          if (!target.src.includes('data:image/svg+xml')) {
            target.src = DEFAULT_ERROR_IMAGE;
          }
        }}
      />

      {/* Double Tap Heart Animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <Heart className="w-32 h-32 text-white fill-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share to Story Animation */}
      <AnimatePresence>
        {showShareAnim && (
          <motion.div 
            initial={{ y: 50, x: -50, scale: 0.5, opacity: 0 }}
            animate={{ y: -200, x: 200, scale: 1.5, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <Send className="w-24 h-24 text-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay Layer - Middle */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end p-8 z-10 pointer-events-none">
        <div className="flex items-center justify-between mb-4 pointer-events-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewProfile?.(user)}>
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-cta/30" referrerPolicy="no-referrer" />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-lg text-white">{user.username}</span>
                <VerificationBadge user={user} />
              </div>
              <p className="text-white/60 text-xs">
                {post.audioUrl ? 'Custom Audio' : 'Original Audio'} • {post.likes} likes
              </p>
            </div>
          </div>
        </div>
        
        {post.audioUrl && (
          <div className="mb-4 pointer-events-auto">
            <audio controls className="w-full h-8" src={post.audioUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <p className="text-white/90 text-sm mb-4 line-clamp-3 pointer-events-auto">
          {post.caption.split(/(#[\w]+)/g).map((part, i) => 
            part.startsWith('#') ? (
              <span key={i} className="text-cta font-medium">{part}</span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>

        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-1">
              <Heart 
                onClick={() => onLike?.(post.id)}
                className={cn(
                  "w-7 h-7 cursor-pointer transition-colors",
                  isLiked ? "text-red-500 fill-red-500" : "text-white hover:text-cta"
                )} 
              />
              <span className="text-[10px] font-bold text-white/80">{post.likes}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <MessageCircle 
                onClick={() => setShowComments(!showComments)}
                className={cn(
                  "w-7 h-7 text-white hover:text-cta cursor-pointer transition-colors",
                  showComments && "text-cta"
                )} 
              />
              <span className="text-[10px] font-bold text-white/80">{post.comments?.length || 0}</span>
            </div>
            <Send 
              onClick={handleShare}
              className="w-7 h-7 text-white hover:text-cta cursor-pointer transition-colors" 
            />
          </div>
          <Bookmark 
            onClick={() => onSave?.(post.id)}
            className={cn(
              "w-7 h-7 cursor-pointer transition-colors",
              isSaved ? "text-cta fill-cta" : "text-white hover:text-cta"
            )} 
          />
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pointer-events-auto overflow-hidden"
            >
              <div className="max-h-32 overflow-y-auto mb-3 space-y-2 hide-scrollbar">
                {post.comments?.map(comment => {
                  const commentUser = users.find(u => u.id === comment.userId);
                  return (
                    <div key={comment.id} className="text-sm flex gap-2 items-start">
                      <span 
                        className="font-bold text-white whitespace-nowrap cursor-pointer hover:underline"
                        onClick={() => commentUser && onViewProfile?.(commentUser)}
                      >
                        {commentUser?.username || 'User'}
                      </span>
                      <span className="text-white/80 break-words flex-1">{comment.text}</span>
                    </div>
                  );
                })}
                {(!post.comments || post.comments.length === 0) && (
                  <p className="text-white/50 text-xs italic">No comments yet. Be the first!</p>
                )}
              </div>
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input 
                  type="text" 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={140}
                  placeholder="Add a comment... (max 140 chars)" 
                  className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-cta"
                />
                <button type="submit" disabled={!commentText.trim()} className="text-cta font-bold text-sm px-2 disabled:opacity-50">Post</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
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
  const [profileTab, setProfileTab] = useState<'posts' | 'saved'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState<'users' | 'tags'>('users');
  const [isPrivate, setIsPrivate] = useState(false);
  const [config, setConfig] = useState<AppConfig>(storage.getConfig());
  const [stories, setStories] = useState<Story[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Create Post State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newCaption, setNewCaption] = useState('');
  const [newAudioUrl, setNewAudioUrl] = useState('');
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
  const [editAudioUrl, setEditAudioUrl] = useState('');
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
    
    const user = await storage.login(username, password);
    if (user) {
      setCurrentUser(user);
      storage.setCurrentUser(user);
      setView('app');
      setIsPrivate(user.isPrivate);
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.mechanics.enableSignup) {
      setError('Registration is currently disabled by administrator.');
      return;
    }
    if (!username || !displayName || !password) {
      setError('Please fill all fields');
      return;
    }
    const existing = await storage.getUser(username);
    if (existing) {
      setError('Username already taken');
      return;
    }
    const newUser = await storage.signup(username, displayName, password);
    setCurrentUser(newUser);
    storage.setCurrentUser(newUser);
    setView('app');
  };

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) return;
    if (currentUser.id === targetUserId) return;

    await storage.followUser(currentUser.id, targetUserId);
    
    // Update local state
    const updatedUsers = await storage.getUsers();
    setUsers(updatedUsers);
    
    const updatedCurrentUser = updatedUsers.find(u => u.id === currentUser.id);
    if (updatedCurrentUser) {
      setCurrentUser(updatedCurrentUser);
      storage.setCurrentUser(updatedCurrentUser);
    }

    if (selectedUser && selectedUser.id === targetUserId) {
      const updatedSelectedUser = updatedUsers.find(u => u.id === targetUserId);
      if (updatedSelectedUser) setSelectedUser(updatedSelectedUser);
    }
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
        audioUrl: editAudioUrl,
        avatar: avatarUrl
      };
      
      await storage.updateUser(updatedUser);
      setCurrentUser(updatedUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
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
      const { url, publicId } = await storage.uploadImage(selectedStoryFile, undefined, currentUser.id, 'story');
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
      const { url, publicId } = await storage.uploadImage(selectedFile, newCaption, currentUser.id, 'post');
      
      const extractedHashtags = newCaption.match(/#[\w]+/g)?.map(tag => tag.slice(1)) || [];
      
      const newPost = await storage.createPost({
        userId: currentUser.id,
        imageUrl: url,
        publicId,
        caption: newCaption,
        hashtags: extractedHashtags,
        audioUrl: newAudioUrl || undefined
      });
      
      setPosts([newPost, ...posts]);
      setIsCreateModalOpen(false);
      setSelectedFile(null);
      setNewCaption('');
      setNewAudioUrl('');
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

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const likedBy = post.likedBy || [];
    const isLiked = likedBy.includes(currentUser.id);
    
    const updatedLikedBy = isLiked 
      ? likedBy.filter(id => id !== currentUser.id)
      : [...likedBy, currentUser.id];
      
    const updatedPost = { 
      ...post, 
      likes: isLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
      likedBy: updatedLikedBy
    };
    
    await storage.updatePost(updatedPost);
    setPosts(posts.map(p => p.id === postId ? updatedPost : p));

    if (!isLiked && post.userId !== currentUser.id) {
      const newNotification = await storage.addNotification({
        userId: post.userId,
        actorId: currentUser.id,
        type: 'like',
        postId: post.id
      });
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const handleSavePost = async (postId: string) => {
    if (!currentUser) return;
    
    const savedPosts = currentUser.savedPosts || [];
    const isSaved = savedPosts.includes(postId);
    
    const updatedSavedPosts = isSaved
      ? savedPosts.filter(id => id !== postId)
      : [...savedPosts, postId];
      
    const updatedUser = {
      ...currentUser,
      savedPosts: updatedSavedPosts
    };
    
    await storage.updateUser(updatedUser);
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleCommentPost = async (postId: string, text: string) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      text,
      createdAt: new Date().toISOString()
    };

    const updatedPost = { 
      ...post, 
      comments: [...(post.comments || []), newComment] 
    };
    
    await storage.updatePost(updatedPost);
    setPosts(posts.map(p => p.id === postId ? updatedPost : p));

    if (post.userId !== currentUser.id) {
      const newNotification = await storage.addNotification({
        userId: post.userId,
        actorId: currentUser.id,
        type: 'comment',
        postId: post.id
      });
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const handleShareToStory = async (post: Post) => {
    if (!currentUser) return;
    setIsUploadingStory(true);
    try {
      const newStory = await storage.createStory({
        userId: currentUser.id,
        imageUrl: post.imageUrl,
        publicId: post.publicId
      });
      setStories([newStory, ...stories]);
      alert('Post shared to your story!');
    } catch (err) {
      console.error('Failed to share to story:', err);
    } finally {
      setIsUploadingStory(false);
    }
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
            {/* Notification Bell Neatly Placed */}
            <GlassButton 
              active={activeTab === 'notifications'} 
              onClick={() => {
                setActiveTab('notifications');
                if (currentUser) {
                  storage.markNotificationsRead(currentUser.id);
                  setNotifications(notifications.map(n => ({ ...n, read: true })));
                }
              }} 
              className="relative p-2 rounded-full hover:bg-white/5 transition-all"
            >
              <Bell className="w-5 h-5" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-cta rounded-full"></span>
              )}
            </GlassButton>

            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{currentUser?.username}</span>
              {currentUser && <VerificationBadge user={currentUser} />}
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
                    avatar: DEFAULT_AVATAR 
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
                    currentUser={currentUser}
                    users={users}
                    onLike={handleLikePost}
                    onComment={handleCommentPost}
                    onShareToStory={handleShareToStory}
                    onSave={handleSavePost}
                    onViewProfile={handleViewProfile}
                    user={users.find(u => u.id === post.userId) || { 
                      id: 'anon', 
                      username: 'Anonymous', 
                      avatar: DEFAULT_AVATAR,
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
                  placeholder="Search users or hashtags..." 
                  className="bg-transparent border-none outline-none flex-1 py-2 text-sm text-text-primary placeholder:text-secondary-text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex justify-center gap-4 border-b border-hairline pb-4">
                <button 
                  onClick={() => setSearchTab('users')}
                  className={cn("text-sm font-bold uppercase tracking-widest transition-colors", searchTab === 'users' ? "text-white" : "text-white/50")}
                >
                  Users
                </button>
                <button 
                  onClick={() => setSearchTab('tags')}
                  className={cn("text-sm font-bold uppercase tracking-widest transition-colors", searchTab === 'tags' ? "text-white" : "text-white/50")}
                >
                  Tags
                </button>
              </div>
              
              {searchQuery || searchTab === 'users' ? (
                <div className="space-y-4">
                  {searchTab === 'users' ? (
                    users.filter(u => 
                      !searchQuery || 
                      u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length > 0 ? (
                      users.filter(u => 
                        !searchQuery || 
                        u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(user => (
                        <div key={user.id} className="flex items-center justify-between p-4 glass rounded-2xl cursor-pointer hover:bg-white/5 transition-colors group">
                          <div className="flex items-center gap-4" onClick={() => handleViewProfile(user)}>
                            <img src={user.avatar} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-white">{user.username}</span>
                                <VerificationBadge user={user} />
                              </div>
                              <span className="text-sm text-secondary-text">{user.displayName}</span>
                            </div>
                          </div>
                          {currentUser && currentUser.id !== user.id && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollow(user.id);
                              }}
                              className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                                currentUser.following?.includes(user.id) 
                                  ? "glass border-hairline text-white/50" 
                                  : "bg-cta text-cta-text"
                              )}
                            >
                              {currentUser.following?.includes(user.id) ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-secondary-text">No users found</div>
                    )
                  ) : (
                    posts.filter(p => p.hashtags.some(h => h.toLowerCase().includes(searchQuery.replace('#', '').toLowerCase()))).length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {posts.filter(p => p.hashtags.some(h => h.toLowerCase().includes(searchQuery.replace('#', '').toLowerCase()))).map(post => (
                          <div key={post.id} className="aspect-square glass rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-all border-hairline">
                            <img 
                              src={post.imageUrl} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_ERROR_IMAGE;
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-secondary-text">No posts found with this hashtag</div>
                    )
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from(new Set(posts.flatMap(p => p.hashtags))).slice(0, 6).map(tag => (
                    <div 
                      key={tag}
                      onClick={() => {
                        setSearchTab('tags');
                        setSearchQuery(tag);
                      }}
                      className="glass p-4 rounded-2xl cursor-pointer hover:bg-cta/10 hover:border-cta/30 transition-all text-center font-bold text-secondary-text hover:text-cta"
                    >
                      #{tag}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div 
              key="notifications"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-black italic mb-6">Notifications</h2>
              
              {notifications.length > 0 ? (
                notifications.map(notification => {
                  const actor = users.find(u => u.id === notification.actorId);
                  const post = notification.postId ? posts.find(p => p.id === notification.postId) : null;
                  if (!actor) return null;

                  return (
                    <div key={notification.id} className="flex items-center gap-4 p-4 glass rounded-2xl">
                      <img 
                        src={actor.avatar} 
                        className="w-12 h-12 rounded-full object-cover cursor-pointer" 
                        onClick={() => handleViewProfile(actor)}
                      />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-bold cursor-pointer" onClick={() => handleViewProfile(actor)}>{actor.username}</span>
                          {notification.type === 'like' ? ' liked your pulse.' : 
                           notification.type === 'comment' ? ' commented on your pulse.' : 
                           ' started following you.'}
                        </p>
                        <p className="text-xs text-secondary-text mt-1">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {post && <img src={post.imageUrl} className="w-12 h-12 rounded-xl object-cover" />}
                      {notification.type === 'follow' && (
                        <button 
                          onClick={() => handleFollow(actor.id)}
                          className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                            currentUser?.following?.includes(actor.id) 
                              ? "glass border-hairline text-white/50" 
                              : "bg-cta text-cta-text"
                          )}
                        >
                          {currentUser?.following?.includes(actor.id) ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20 text-secondary-text">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No notifications yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {(selectedUser || currentUser) && (
                <>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <img src={(selectedUser || currentUser)?.avatar} className="w-28 h-28 rounded-full border-4 border-cta/20 p-1" referrerPolicy="no-referrer" />
                      {(selectedUser || currentUser)?.isVerified && (
                        <div className="absolute bottom-1 right-1 bg-app-bg rounded-full p-0.5">
                          <VerificationBadge user={(selectedUser || currentUser)!} size="lg" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black italic">{(selectedUser || currentUser)?.displayName}</h2>
                      <p className="text-secondary-text font-medium">@{(selectedUser || currentUser)?.username}</p>
                    </div>
                    <p className="text-sm max-w-xs text-secondary-text">{(selectedUser || currentUser)?.bio}</p>
                    
                    {(selectedUser || currentUser)?.audioUrl && (
                      <div className="w-full max-w-xs mt-2">
                        <audio controls className="w-full h-10 rounded-full outline-none" src={(selectedUser || currentUser)?.audioUrl} />
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      {(!selectedUser || selectedUser.id === currentUser?.id) ? (
                        config.mechanics.enableProfileEditing && (
                          <button 
                            onClick={() => {
                              if (currentUser) {
                                setEditDisplayName(currentUser.displayName);
                                setEditBio(currentUser.bio);
                                setEditAudioUrl(currentUser.audioUrl || '');
                                setIsEditProfileModalOpen(true);
                              }
                            }}
                            className="px-6 py-2 glass rounded-full text-xs font-bold hover:bg-white/10 transition-all border-hairline"
                          >
                            Edit Profile
                          </button>
                        )
                      ) : (
                        <button 
                          onClick={() => selectedUser && handleFollow(selectedUser.id)}
                          className={cn(
                            "px-8 py-2 rounded-full text-xs font-bold transition-all shadow-lg",
                            currentUser?.following?.includes(selectedUser.id) 
                              ? "glass border-hairline text-white/50" 
                              : "bg-cta text-cta-text shadow-cta/20"
                          )}
                        >
                          {currentUser?.following?.includes(selectedUser.id) ? 'Following' : 'Follow'}
                        </button>
                      )}

                      {selectedUser && selectedUser.id !== currentUser?.id && (
                        <button 
                          onClick={() => setSelectedUser(null)}
                          className="px-6 py-2 glass rounded-full text-xs font-bold hover:bg-white/10 transition-all border-hairline"
                        >
                          My Profile
                        </button>
                      )}
                    </div>
                    
                    <div className="flex gap-8 py-6 border-y border-hairline w-full justify-center">
                      <div className="text-center">
                        <div className="font-black text-xl">{posts.filter(p => p.userId === (selectedUser || currentUser)?.id).length}</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-secondary-text">Pulses</div>
                      </div>
                      <div className="text-center">
                        <div className="font-black text-xl">{(selectedUser || currentUser)?.followersCount.toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-secondary-text">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-black text-xl">{(selectedUser || currentUser)?.followingCount}</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-secondary-text">Following</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 border-b border-hairline pb-4">
                    <button 
                      onClick={() => setProfileTab('posts')}
                      className={cn("text-sm font-bold uppercase tracking-widest transition-colors", profileTab === 'posts' ? "text-white" : "text-white/50")}
                    >
                      Posts
                    </button>
                    <button 
                      onClick={() => setProfileTab('saved')}
                      className={cn("text-sm font-bold uppercase tracking-widest transition-colors", profileTab === 'saved' ? "text-white" : "text-white/50")}
                    >
                      Saved
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {profileTab === 'posts' && posts.filter(p => p.userId === (selectedUser || currentUser)?.id).map(post => (
                      <div key={post.id} className="aspect-square glass rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-all border-hairline">
                        <img 
                          src={post.imageUrl} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_ERROR_IMAGE;
                          }}
                        />
                      </div>
                    ))}
                    {profileTab === 'saved' && posts.filter(p => (selectedUser || currentUser)?.savedPosts?.includes(p.id)).map(post => (
                      <div key={post.id} className="aspect-square glass rounded-2xl overflow-hidden cursor-pointer hover:opacity-80 transition-all border-hairline">
                        <img 
                          src={post.imageUrl} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_ERROR_IMAGE;
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
                {currentUser?.username === 'PUL5E' && (
                  <div className="glass p-5 rounded-[25px] flex flex-col gap-4 border-hairline">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10">
                          <Zap className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="font-bold">System Diagnostics</span>
                      </div>
                      <button 
                        onClick={async () => setSystemStatus(await storage.getConnectionStatus())}
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
                )}

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

                {currentUser?.username === 'PUL5E' && (
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
                )}

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
          <GlassButton className="bg-cta text-cta-text" onClick={() => setIsCreateModalOpen(true)}>
            <PlusSquare className="w-6 h-6" />
          </GlassButton>
          <GlassButton active={activeTab === 'profile'} onClick={() => {
            setSelectedUser(null);
            setActiveTab('profile');
          }}>
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
                <div 
                  className="flex items-center gap-3 cursor-pointer" 
                  onClick={() => {
                    const user = users.find(u => u.id === selectedStory.userId);
                    if (user) {
                      handleViewProfile(user);
                      setIsStoryModalOpen(false);
                    }
                  }}
                >
                  <img 
                    src={users.find(u => u.id === selectedStory.userId)?.avatar || DEFAULT_AVATAR} 
                    className="w-10 h-10 rounded-full border-2 border-white/30" 
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white">
                        {users.find(u => u.id === selectedStory.userId)?.username || 'User'}
                      </span>
                      {users.find(u => u.id === selectedStory.userId) && (
                        <VerificationBadge user={users.find(u => u.id === selectedStory.userId)!} />
                      )}
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

                {currentUser?.isAdmin && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-2">Audio Link (Admin Only)</label>
                    <input 
                      type="url"
                      className="w-full glass p-4 rounded-2xl outline-none focus:ring-2 ring-cta/20 transition-all text-sm"
                      placeholder="https://example.com/audio.mp3"
                      value={newAudioUrl}
                      onChange={(e) => setNewAudioUrl(e.target.value)}
                    />
                  </div>
                )}
                
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

                {currentUser?.username === 'PUL5E' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-2">Profile Audio URL (Admin Only)</label>
                    <input 
                      type="url" 
                      placeholder="https://example.com/audio.mp3"
                      className="w-full glass p-4 rounded-2xl outline-none focus:ring-2 ring-cta/20 transition-all text-sm"
                      value={editAudioUrl}
                      onChange={(e) => setEditAudioUrl(e.target.value)}
                    />
                  </div>
                )}
                
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
