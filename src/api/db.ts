import { useQueryStore } from '../store/queryStore';
import { API_BASE_URL } from './config';

const API_URL = API_BASE_URL;

export const uploadFile = async (file: File): Promise<{ status: string; table: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: { 'X-Session-ID': useQueryStore.getState().sessionId },
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload file');
  }
  return res.json();
};

export const fetchHealth = async () => {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error('Backend offline');
  return res.json();
};

export const fetchSchema = async () => {
  const res = await fetch(`${API_URL}/schema`, {
    headers: { 'X-Session-ID': useQueryStore.getState().sessionId }
  });
  if (!res.ok) throw new Error('Failed to fetch schema');
  return res.json();
};

export const runQuery = async (sql: string, page = 1, pageSize = 50): Promise<any> => {
  const res = await fetch(`${API_URL}/sql/execute`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Session-ID': useQueryStore.getState().sessionId 
    },
    body: JSON.stringify({ sql, page, pageSize })
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to execute query');
  }
  
  return res.json();
};
