import { defineStore } from 'pinia';

export interface UserState {
  id: string | null;
  name: string;
  token: string;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: localStorage.getItem('userId') || null,
    name: localStorage.getItem('userName') || '',
    token: localStorage.getItem('token') || ''
  }),
  actions: {
    setUserData(data: Partial<UserState>) {
      if (data.id !== undefined) {
        this.id = data.id;
        if (data.id) localStorage.setItem('userId', data.id);
        else localStorage.removeItem('userId');
      }
      if (data.name !== undefined) {
        this.name = data.name;
        if (data.name) localStorage.setItem('userName', data.name);
        else localStorage.removeItem('userName');
      }
      if (data.token !== undefined) {
        this.token = data.token;
        if (data.token) localStorage.setItem('token', data.token);
        else localStorage.removeItem('token');
      }
    },
    clearUserData() {
      this.id = null;
      this.name = '';
      this.token = '';
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('token');
    }
  },
  getters: {
    isLoggedIn: (state) => !!state.token
  }
});
