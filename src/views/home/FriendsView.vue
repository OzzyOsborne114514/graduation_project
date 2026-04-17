<template>
  <div class="friends-view">
    <aside class="friends-sidebar">
      <div class="sidebar-header">
        <div class="search-box">
          <n-icon size="20"><Search24Regular /></n-icon>
          <input v-model="searchQuery" type="text" placeholder="搜索好友" />
        </div>
      </div>
      
      <div class="friends-list">
        <div class="list-section">
          <div class="section-title">我的好友</div>
          <div 
            v-for="friend in filteredFriends" 
            :key="friend.id" 
            class="friend-item"
            :class="{ active: selectedFriend?.id === friend.id }"
            @click="selectedFriend = friend"
          >
            <n-avatar 
              :size="40" 
              v-authImg="friend.photo?.url || defaultAvatar" 
              round 
            />
            <div class="friend-info">
              <div class="friend-name">{{ friend.name }}</div>
              <div class="friend-status" :class="{ online: friend.online }">
                {{ friend.online ? '在线' : '离线' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <main class="friend-detail" v-if="selectedFriend">
      <header class="detail-header">
        <div class="user-info">
          <n-avatar 
            :size="64" 
            v-authImg="selectedFriend.photo?.url || defaultAvatar" 
            round 
          />
          <div class="user-meta">
            <h2 class="user-name">{{ selectedFriend.name }}</h2>
            <p class="user-id">ID: {{ selectedFriend.id }}</p>
          </div>
        </div>
        <div class="detail-actions">
          <n-button type="primary" @click="startChat(selectedFriend)">
            发送消息
          </n-button>
        </div>
      </header>

      <n-divider />

      <div class="detail-content">
        <div class="info-group">
          <label>手机号</label>
          <span>{{ selectedFriend.telephone || '未填写' }}</span>
        </div>
        <div class="info-group">
          <label>性别</label>
          <span>{{ selectedFriend.gender === '0' ? '男' : '女' }}</span>
        </div>
      </div>
    </main>
    
    <div class="empty-state" v-else>
      <n-icon size="64" color="#e0e0e0"><People24Regular /></n-icon>
      <p>选择一个好友查看详情</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NAvatar, NButton, NIcon, NDivider, useMessage } from 'naive-ui';
import { Search24Regular, People24Regular } from '@vicons/fluent';
import defaultAvatar from '@/assets/images/默认头像.jpeg';

const message = useMessage();
const searchQuery = ref('');
const selectedFriend = ref<any>(null);

// 模拟数据
const friends = ref([
  { id: '1001', name: '后端之神', telephone: '13800138000', gender: '0', online: true, photo: { url: '' } },
  { id: '1002', name: '键盘外的星辰', telephone: '13912345678', gender: '1', online: false, photo: { url: '' } },
  { id: '1003', name: '代码搬运工', telephone: '13788889999', gender: '0', online: true, photo: { url: '' } },
]);

const filteredFriends = computed(() => {
  if (!searchQuery.value) return friends.value;
  const q = searchQuery.value.toLowerCase();
  return friends.value.filter(f => f.name.toLowerCase().includes(q));
});

const startChat = (friend: any) => {
  message.info(`与 ${friend.name} 的私聊功能开发中...`);
};
</script>

<style scoped>
.friends-view {
  display: flex;
  height: 100%;
  background-color: #fff;
}

.friends-sidebar {
  width: 280px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f0f0f0;
  padding: 8px 12px;
  border-radius: 8px;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  width: 100%;
}

.friends-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.section-title {
  padding: 8px 12px;
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
}

.friend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 2px;
}

.friend-item:hover {
  background-color: #f0f0f0;
}

.friend-item.active {
  background-color: #e6f7ff;
}

.friend-info {
  flex: 1;
  overflow: hidden;
}

.friend-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.friend-status {
  font-size: 12px;
  color: #999;
}

.friend-status.online {
  color: #52c41a;
}

.friend-detail {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-name {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.user-id {
  margin: 4px 0 0;
  color: #999;
}

.detail-content {
  margin-top: 24px;
}

.info-group {
  margin-bottom: 20px;
}

.info-group label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.info-group span {
  font-size: 16px;
  color: #333;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.empty-state p {
  margin-top: 16px;
}
</style>
