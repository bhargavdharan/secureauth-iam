import client from './client';
import type { Page, AuditLog } from '../types';

export const getAuditLogs = (params: {
  page?: number;
  size?: number;
  userId?: number;
  action?: string;
}) => client.get<Page<AuditLog>>('/api/audit-logs', { params });
