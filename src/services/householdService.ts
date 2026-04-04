import api from './api';
import { Household } from '../types';

export const householdService = {
  async create(name: string): Promise<Household> {
    const { data } = await api.post('/households', { name });
    return data;
  },

  async join(inviteCode: string): Promise<Household> {
    const { data } = await api.post('/households/join', { inviteCode });
    return data;
  },

  async get(id: string): Promise<Household> {
    const { data } = await api.get(`/households/${id}`);
    return data;
  },

  async removeMember(householdId: string, userId: string): Promise<void> {
    await api.delete(`/households/${householdId}/members/${userId}`);
  },

  async regenerateInviteCode(householdId: string): Promise<string> {
    const { data } = await api.post(`/households/${householdId}/invite-code`);
    return data.inviteCode;
  },
};
