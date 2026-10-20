import { api } from '@/lib/api';
import { unwrap } from '@/lib/unwrap';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/auth';

export async function getProfile(): Promise<User> {
  const { data } = await api.get<ApiResponse<User> | User>('/profile');
  return unwrap(data);
}
