import client from './client';
import type { ApiKey } from '../types';

export const getApiKeys = () =>
  client.get<ApiKey[]>('/api/api-keys');

export const createApiKey = (data: { name: string; permissions?: string }) =>
  client.post<ApiKey>('/api/api-keys', data);

export const revokeApiKey = (id: number) =>
  client.delete(`/api/api-keys/${id}`);
