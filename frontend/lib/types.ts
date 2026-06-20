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
