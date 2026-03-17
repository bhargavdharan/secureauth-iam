import client from './client';
import type { Page, User } from '../types';

export const getUsers = (page = 0, size = 10, search?: string, type?: string) =>
  client.get<Page<User>>('/api/users', { params: { page, size, search, type } });

export const getUserById = (id: number) =>
  client.get<User>(`/api/users/${id}`);

export const updateUser = (id: number, data: Partial<User>) =>
  client.put<User>(`/api/users/${id}`, data);

export const toggleUser = (id: number) =>
  client.put<User>(`/api/users/${id}/toggle`);

export const assignRoles = (id: number, roleIds: number[]) =>
  client.put<User>(`/api/users/${id}/roles`, { roleIds });

export const createUser = (
  data: { firstName: string; lastName: string; email: string; password: string },
  roleIds?: number[]
) =>
  client.post<User>('/api/users', data, {
    params: roleIds ? { roleIds: roleIds.join(',') } : undefined,
  });

export const deleteUser = (id: number) =>
  client.delete(`/api/users/${id}`);
