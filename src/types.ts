export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  isVerified: boolean;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  likes: number;
  hashtags: string[];
  publicId?: string;
}

export interface Story {
  id: string;
  userId: string;
  imageUrl: string;
  createdAt: string;
  publicId?: string;
}

export interface AppConfig {
  theme: {
    primaryColor: string;
    glassBlur: number;
    glassOpacity: number;
    borderRadius: number;
    fontFamily: 'Inter' | 'Space Grotesk' | 'JetBrains Mono';
  };
  mechanics: {
    enableLogin: boolean;
    enableSignup: boolean;
    enableLikes: boolean;
    enableBookmarks: boolean;
    enableComments: boolean;
    enableSearch: boolean;
    enableProfileEditing: boolean;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
