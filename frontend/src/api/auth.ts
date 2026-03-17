import client from './client';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

export const login = (data: LoginRequest) =>
  client.post<AuthResponse>('/api/auth/login', data);

export const register = (data: RegisterRequest) =>
  client.post<AuthResponse>('/api/auth/register', data);

export const getMe = () =>
  client.get<User>('/api/auth/me');

export const refreshToken = (refreshToken: string) =>
  client.post<AuthResponse>('/api/auth/refresh', { refreshToken });
