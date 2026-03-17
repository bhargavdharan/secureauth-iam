import client from './client';

export const updateProfile = (data: { firstName?: string; lastName?: string; email?: string }) =>
  client.put('/api/settings/profile', data);

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  client.put('/api/settings/password', data);

export const setupMfa = () =>
  client.post<{ secret: string; qrCodeUri: string; qrCodeImage: string }>('/api/mfa/setup');

export const verifyMfa = (code: string) =>
  client.post('/api/mfa/verify', { code });

export const disableMfa = () =>
  client.delete('/api/settings/mfa');
