export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  roles: string[];
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
  fields?: Record<string, string>;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  owner: string;
  sensitivityLevel: string;
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  id: string;
  role: string;
  resourceId: string;
  resourceName: string;
  permission: string;
  conditionExpression: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccessDecision {
  allowed: boolean;
  decision: string;
  reason: string;
  userId: string;
  userEmail: string;
  resourceId: string;
  resourceName: string;
  action: string;
  evaluatedAt: string;
}

export interface UserInfo {
  id: string;
  email: string;
  roles: string[];
}
