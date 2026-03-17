import client from './client';
import type { Role } from '../types';

export const getRoles = () =>
  client.get<Role[]>('/api/roles');

export const getRoleById = (id: number) =>
  client.get<Role>(`/api/roles/${id}`);

export const createRole = (data: { name: string; description: string; permissionIds: number[] }) =>
  client.post<Role>('/api/roles', data);

export const updateRole = (id: number, data: { name: string; description: string; permissionIds: number[] }) =>
  client.put<Role>(`/api/roles/${id}`, data);

export const deleteRole = (id: number) =>
  client.delete(`/api/roles/${id}`);

export const getPermissions = () =>
  client.get<Record<string, Array<{ id: number; name: string; description: string; category: string; builtIn: boolean }>>>('/api/roles/permissions');
