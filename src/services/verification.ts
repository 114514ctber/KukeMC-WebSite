import api from '../utils/api';

export interface VerificationRequest {
  id: number;
  username: string;
  platform: 'bilibili' | 'douyin' | 'kuaishou' | 'xiaohongshu';
  homepage_link: string;
  homepage_name: string;
  proof_link: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

export const applyVerification = async (data: {
  platform: string;
  homepage_link: string;
  homepage_name: string;
  proof_link: string;
  description?: string;
}) => {
  const response = await api.post('/api/verification/apply', data);
  return response.data;
};

export const getVerificationRequests = async (params?: { status?: string; page?: number; limit?: number }) => {
  const response = await api.get<VerificationRequest[]>('/api/verification/requests', { params });
  return response.data;
};

export const approveVerification = async (id: number, data?: { verification_link?: string }) => {
  const response = await api.post(`/api/verification/${id}/approve`, data || {});
  return response.data;
};

export const rejectVerification = async (id: number, reason: string) => {
  const response = await api.post(`/api/verification/${id}/reject`, { reason });
  return response.data;
};

export interface VerificationStatus {
  status: 'guest' | 'pending' | 'can_apply';
  request?: VerificationRequest;
}

export const getVerificationStatus = async () => {
  const response = await api.get<VerificationStatus>('/api/verification/my-status');
  return response.data;
};
