import api from '../utils/api';
import { FollowStats, Author } from '../types/activity';

export const followUser = async (username: string) => {
  const response = await api.post(`/api/users/${username}/follow`);
  return response.data;
};

export const unfollowUser = async (username: string) => {
  const response = await api.delete(`/api/users/${username}/follow`);
  return response.data;
};

export const getFollowStats = async (username: string) => {
  const response = await api.get<FollowStats>(`/api/users/${username}/follow/stats`);
  return response.data;
};

export const getFollowers = async (username: string, page = 1) => {
  const response = await api.get<{ data: Author[]; total: number; page: number }>(`/api/users/${username}/followers`, {
    params: { page }
  });
  return response.data;
};

export const getFollowing = async (username: string, page = 1) => {
  const response = await api.get<{ data: Author[]; total: number; page: number }>(`/api/users/${username}/following`, {
    params: { page }
  });
  return response.data;
};
