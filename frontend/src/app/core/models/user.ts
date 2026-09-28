export type UserRole = 'student' | 'staff' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  college_id?: string | null;
  role: UserRole;
  is_active?: number;
  created_at?: string;
  last_login_at?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  expiresAt: string | null;
}
