import { defineStore } from 'pinia';

export const useChatStore = defineStore('chat', {
  state: () => ({
    currentGroupDetail: null as any,
  }),
  actions: {
    setCurrentGroupDetail(detail: any) {
      this.currentGroupDetail = detail;
    },
    clearCurrentGroupDetail() {
      this.currentGroupDetail = null;
    }
  }
});
