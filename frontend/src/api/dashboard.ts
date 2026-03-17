import client from './client';
import type { DashboardStats } from '../types';

export const getStats = () =>
  client.get<DashboardStats>('/api/dashboard/stats');
