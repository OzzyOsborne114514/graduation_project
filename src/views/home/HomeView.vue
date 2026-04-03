<template>
  <div class="home-layout">
    <!-- 左侧导航栏 -->
    <aside class="sidebar">
      <!-- Logo -->
      <div class="logo">
        <span class="logo-text">Oopz.</span>
      </div>

      <!-- 主导航菜单 -->
      <nav class="main-nav">
        <router-link
          v-for="item in mainNavItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
        >
          <i :class="item.icon"></i>
        </router-link>
      </nav>

      <!-- 底部服务器/频道列表 -->
      <div class="server-list">
        <div
          v-for="server in servers"
          :key="server.id"
          class="server-item"
          :class="{
            active: activeServer === server.id,
            'has-notification': server.hasNotification,
          }"
          @click="activeServer = server.id"
        >
          <img :src="server.avatar" :alt="server.name" />
          <span v-if="server.hasNotification" class="notification-dot"></span>
        </div>
        <div class="server-item add-server" @click="showAddModal = true">
          <i class="icon-plus"></i>
        </div>
      </div>
    </aside>

    <!-- 中间内容区（可选，用于频道/好友列表） -->
    <aside class="channel-sidebar" v-if="showChannelSidebar">
      <div class="channel-header">
        <div class="search-box">
          <i class="icon-search"></i>
          <input type="text" placeholder="搜索你感兴趣的领域" />
        </div>
      </div>
      <div class="channel-list">
        <!-- 频道列表内容 -->
      </div>
    </aside>

    <!-- 右侧主内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 创建或加入域弹窗组件 -->
    <AddDomainModal v-model="showAddModal" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AddDomainModal from "@/component/Home/AddDomainModal.vue";

// 主导航项
const mainNavItems = [
  { path: "/home", icon: "icon-home", name: "首页" },
  { path: "/messages", icon: "icon-message", name: "消息" },
  { path: "/friends", icon: "icon-friends", name: "好友" },
];

// 服务器/频道列表
const servers = ref([
  {
    id: 1,
    name: "服务器1",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1",
    hasNotification: false,
  },
  {
    id: 2,
    name: "服务器2",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2",
    hasNotification: true,
  },
  {
    id: 3,
    name: "服务器3",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3",
    hasNotification: true,
  },
]);

const activeServer = ref(1);
const showChannelSidebar = ref(true);

// 弹窗相关状态
const showAddModal = ref(false);
</script>

<style scoped>
.home-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f5f5f5;
}

/* 左侧导航栏 */
.sidebar {
  width: 72px;
  background-color: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}

.logo {
  margin-bottom: 24px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

/* 主导航 */
.main-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.nav-item {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: #999;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: #f0f0f0;
  color: #666;
}

.nav-item.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

/* 服务器列表 */
.server-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
}

.server-item {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.server-item:hover {
  border-color: #1890ff;
}

.server-item.active {
  border-color: #1890ff;
  border-radius: 16px;
}

.server-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.server-item.add-server {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border: 2px dashed #ccc;
}

.server-item.add-server:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.notification-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background-color: #ff4d4f;
  border-radius: 50%;
  border: 2px solid #fff;
}

/* 中间频道侧边栏 */
.channel-sidebar {
  width: 260px;
  background-color: #fafafa;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.channel-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 20px;
  padding: 8px 16px;
  gap: 8px;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  width: 100%;
}

.search-box input::placeholder {
  color: #999;
}

/* 右侧主内容区 */
.main-content {
  flex: 1;
  overflow: auto;
  background-color: #fff;
}

/* 图标样式 */
.icon-home::before {
  content: "🏠";
  font-size: 20px;
}

.icon-message::before {
  content: "💬";
  font-size: 20px;
}

.icon-voice::before {
  content: "🎤";
  font-size: 20px;
}

.icon-friends::before {
  content: "👥";
  font-size: 20px;
}

.icon-search::before {
  content: "🔍";
}

.icon-plus::before {
  content: "➕";
  font-size: 20px;
}
</style>
