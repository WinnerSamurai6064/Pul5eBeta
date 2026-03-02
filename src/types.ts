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
  followers?: string[];
  following?: string[];
  postsCount: number;
  password?: string;
  audioUrl?: string;
  savedPosts?: string[];
  verifiedType?: 'blue' | 'yellow' | 'green' | 'none';
  isAdmin?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: 'like' | 'comment' | 'follow';
  postId?: string;
  createdAt: string;
  read: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
  likes: number;
  likedBy?: string[];
  hashtags: string[];
  publicId?: string;
  comments?: Comment[];
  audioUrl?: string;
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
