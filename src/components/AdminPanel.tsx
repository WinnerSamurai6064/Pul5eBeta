import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Palette, 
  Cpu, 
  Save, 
  RefreshCcw, 
  CheckCircle2,
  Lock,
  Heart,
  Bookmark,
  MessageCircle,
  Search,
  User,
  Zap
} from 'lucide-react';
import { storage } from '../lib/storage';
import { AppConfig } from '../types';
import { cn } from '../lib/utils';

export const AdminPanel = () => {
  const [config, setConfig] = useState<AppConfig>(storage.getConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      const user = await storage.getCurrentUser();
      if (user?.username === 'PUL5E') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        setTimeout(() => window.location.href = '/', 2000);
      }
    };
    checkAuth();
  }, []);

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-6">
        <div className="glass-thick p-12 rounded-[40px] text-center space-y-4">
          <Lock className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-black italic uppercase">Access Denied</h1>
          <p className="text-secondary-text">Only the official PUL5E admin can access this panel.</p>
          <p className="text-xs text-cta animate-pulse">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === null) return null;

  const handleSave = () => {
    setIsSaving(true);
    storage.saveConfig(config);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }, 800);
  };

  const updateTheme = (key: keyof AppConfig['theme'], value: any) => {
    setConfig({
      ...config,
      theme: { ...config.theme, [key]: value }
    });
  };

  const toggleMechanic = (key: keyof AppConfig['mechanics']) => {
    setConfig({
      ...config,
      mechanics: { ...config.mechanics, [key]: !config.mechanics[key] }
    });
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-cta/20">
                <Settings className="w-6 h-6 text-cta" />
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase">C-Panel</h1>
            </div>
            <p className="text-secondary-text font-medium">Pul5e Central Command • Theme & Mechanics Engine</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 glass rounded-2xl font-bold text-sm hover:bg-white/5 transition-all"
            >
              Exit to App
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-2 transition-all shadow-lg",
                showSuccess ? "bg-emerald-500 text-white" : "bg-cta text-white shadow-cta/20 hover:scale-105"
              )}
            >
              {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : showSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Syncing...' : showSuccess ? 'Applied' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Theme Engine Block */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-thick rounded-[40px] p-8 space-y-8 border-hairline"
          >
            <div className="flex items-center gap-3 border-b border-hairline pb-6">
              <Palette className="w-6 h-6 text-cta" />
              <h2 className="text-2xl font-black italic uppercase">Theme Engine</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-1">Primary Brand Color</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={config.theme.primaryColor}
                    onChange={(e) => updateTheme('primaryColor', e.target.value)}
                    className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={config.theme.primaryColor}
                    onChange={(e) => updateTheme('primaryColor', e.target.value)}
                    className="flex-1 glass p-3 rounded-xl text-sm font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-1">Glass Blur Intensity ({config.theme.glassBlur}px)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={config.theme.glassBlur}
                  onChange={(e) => updateTheme('glassBlur', parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cta"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-1">Border Radius ({config.theme.borderRadius}px)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="60" 
                  value={config.theme.borderRadius}
                  onChange={(e) => updateTheme('borderRadius', parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cta"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary-text ml-1">Typography System</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Inter', 'Space Grotesk', 'JetBrains Mono'].map((font) => (
                    <button
                      key={font}
                      onClick={() => updateTheme('fontFamily', font)}
                      className={cn(
                        "py-3 rounded-xl text-xs font-bold transition-all border border-hairline",
                        config.theme.fontFamily === font ? "bg-cta text-white border-cta" : "glass hover:bg-white/5"
                      )}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mechanics Engine Block */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-thick rounded-[40px] p-8 space-y-8 border-hairline"
          >
            <div className="flex items-center gap-3 border-b border-hairline pb-6">
              <Cpu className="w-6 h-6 text-cta" />
              <h2 className="text-2xl font-black italic uppercase">Mechanics Engine</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MechanicToggle 
                label="User Authentication" 
                icon={<Lock className="w-4 h-4" />} 
                active={config.mechanics.enableLogin} 
                onClick={() => toggleMechanic('enableLogin')} 
              />
              <MechanicToggle 
                label="Public Registration" 
                icon={<User className="w-4 h-4" />} 
                active={config.mechanics.enableSignup} 
                onClick={() => toggleMechanic('enableSignup')} 
              />
              <MechanicToggle 
                label="Engagement (Likes)" 
                icon={<Heart className="w-4 h-4" />} 
                active={config.mechanics.enableLikes} 
                onClick={() => toggleMechanic('enableLikes')} 
              />
              <MechanicToggle 
                label="Bookmarks System" 
                icon={<Bookmark className="w-4 h-4" />} 
                active={config.mechanics.enableBookmarks} 
                onClick={() => toggleMechanic('enableBookmarks')} 
              />
              <MechanicToggle 
                label="Comments Engine" 
                icon={<MessageCircle className="w-4 h-4" />} 
                active={config.mechanics.enableComments} 
                onClick={() => toggleMechanic('enableComments')} 
              />
              <MechanicToggle 
                label="Global Search" 
                icon={<Search className="w-4 h-4" />} 
                active={config.mechanics.enableSearch} 
                onClick={() => toggleMechanic('enableSearch')} 
              />
              <MechanicToggle 
                label="Profile Editing" 
                icon={<Settings className="w-4 h-4" />} 
                active={config.mechanics.enableProfileEditing} 
                onClick={() => toggleMechanic('enableProfileEditing')} 
              />
              <MechanicToggle 
                label="AI Pulse Generation" 
                icon={<Zap className="w-4 h-4" />} 
                active={true} 
                disabled={true}
                onClick={() => {}} 
              />
            </div>
          </motion.div>
        </div>

        {/* Live Preview Block */}
        <div className="glass-thick rounded-[40px] p-8 border-hairline">
           <div className="flex items-center gap-3 mb-6">
              <RefreshCcw className="w-5 h-5 text-cta" />
              <h2 className="text-xl font-black italic uppercase">Real-time Preview</h2>
            </div>
            <div className="flex flex-wrap gap-6 items-center justify-center py-12 bg-black/40 rounded-[30px] border border-hairline">
                <div 
                  className="glass p-8 flex flex-col items-center gap-4"
                  style={{ 
                    borderRadius: `${config.theme.borderRadius}px`,
                    backdropFilter: `blur(${config.theme.glassBlur}px)`,
                    fontFamily: config.theme.fontFamily
                  }}
                >
                  <div className="w-16 h-16 rounded-full bg-cta flex items-center justify-center shadow-lg shadow-cta/20">
                    <Zap className="w-8 h-8 text-white fill-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Pul5e Card</h3>
                    <p className="text-secondary-text text-sm">Theme Engine Active</p>
                  </div>
                  <button className="px-6 py-2 bg-cta text-white rounded-full text-xs font-black uppercase tracking-widest">
                    Action
                  </button>
                </div>

                <div className="space-y-4 max-w-xs w-full">
                   <div className="flex items-center justify-between glass p-4 rounded-2xl border-hairline">
                      <span className="text-sm font-bold">Likes</span>
                      <div className={cn("w-3 h-3 rounded-full", config.mechanics.enableLikes ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500")} />
                   </div>
                   <div className="flex items-center justify-between glass p-4 rounded-2xl border-hairline">
                      <span className="text-sm font-bold">Auth</span>
                      <div className={cn("w-3 h-3 rounded-full", config.mechanics.enableLogin ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500")} />
                   </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const MechanicToggle = ({ label, icon, active, onClick, disabled }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex items-center justify-between p-4 rounded-2xl border transition-all",
      active 
        ? "glass-thick border-cta/40 bg-cta/5" 
        : "glass border-hairline opacity-50 grayscale",
      disabled && "cursor-not-allowed"
    )}
  >
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-xl", active ? "bg-cta/20 text-cta" : "bg-white/5 text-secondary-text")}>
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
    </div>
    <div className={cn(
      "w-10 h-5 rounded-full relative transition-all",
      active ? "bg-cta" : "bg-white/10"
    )}>
      <div className={cn(
        "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
        active ? "right-1" : "left-1"
      )} />
    </div>
  </button>
);
