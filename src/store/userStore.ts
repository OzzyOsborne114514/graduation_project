import { defineStore } from 'pinia';

export interface UserState {
  id: string | null;
  name: string;
  token: string;
  avatar: string | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: localStorage.getItem('userId') || null,
    name: localStorage.getItem('userName') || '',
    token: localStorage.getItem('token') || '',
    avatar: localStorage.getItem('userAvatar') || null
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
      if (data.avatar !== undefined) {
        this.avatar = data.avatar;
        if (data.avatar) localStorage.setItem('userAvatar', data.avatar);
        else localStorage.removeItem('userAvatar');
      }
    },
    clearUserData() {
      this.id = null;
      this.name = '';
      this.token = '';
      this.avatar = null;
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('token');
      localStorage.removeItem('userAvatar');
    }
  },
  getters: {
    isLoggedIn: (state) => !!state.token
  }
});
