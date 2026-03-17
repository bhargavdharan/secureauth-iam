import client from './client';
import type { FormAttribute } from '../types';

export const getAllAttributes = () =>
  client.get<FormAttribute[]>('/api/form-attributes');

export const getAttributesByFormType = (formType: string) =>
  client.get<FormAttribute[]>(`/api/form-attributes/form/${formType}`);

export const getAllAttributesByFormType = (formType: string) =>
  client.get<FormAttribute[]>(`/api/form-attributes/form/${formType}/all`);

export const createAttribute = (data: Partial<FormAttribute>) =>
  client.post<FormAttribute>('/api/form-attributes', data);

export const updateAttribute = (id: number, data: FormAttribute) =>
  client.put<FormAttribute>(`/api/form-attributes/${id}`, data);

export const deleteAttribute = (id: number) =>
  client.delete(`/api/form-attributes/${id}`);

export const bulkUpdateAttributes = (data: FormAttribute[]) =>
  client.put<FormAttribute[]>('/api/form-attributes/bulk', data);
