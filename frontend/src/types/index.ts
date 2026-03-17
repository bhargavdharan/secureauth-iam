export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  mfaEnabled: boolean;
  roles: string[];
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
  mfaRequired: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  key?: string;
  permissions: string;
  active: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  recentLogins: number;
  recentActivity: Array<{
    id: number;
    userId: number;
    action: string;
    resource: string;
    details: string;
    timestamp: string;
  }>;
  roleDistribution: Record<string, number>;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
  builtIn: boolean;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  builtIn: boolean;
  permissions: Permission[];
}

export interface FormAttribute {
  id: number;
  fieldName: string;
  label: string;
  fieldType: string;
  formType: 'USER_CREATE' | 'USER_EDIT';
  required: boolean;
  visible: boolean;
  editable: boolean;
  displayOrder: number;
  defaultValue: string | null;
  placeholder: string | null;
  validationRegex: string | null;
  validationMessage: string | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
