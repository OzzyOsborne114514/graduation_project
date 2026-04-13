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

    <!-- 中间内容区（仅在主页显示搜索群聊栏） -->
    <aside class="channel-sidebar" v-if="isHomePage">
      <div class="channel-header">
        <div class="search-box">
          <n-icon size="20"><Search12Regular /></n-icon>
          <input
            type="text"
            v-model="searchKeyword"
            placeholder="搜索你感兴趣的领域"
            @keyup.enter="handleSearch"
          />
        </div>
      </div>
      <div class="channel-list">
        <!-- 搜索结果列表 -->
        <div v-if="loading" class="loading-text">搜索中...</div>
        <div
          v-else-if="searchResults.length === 0 && hasSearched"
          class="empty-text"
        >
          暂无搜索结果
        </div>
        <div
          v-for="group in searchResults"
          :key="group.id"
          class="group-item"
          @click="selectGroup(group)"
        >
          <img
            :src="group.photo || require('@/assets/images/默认头像.jpeg')"
            :alt="group.groupName"
          />
          <div class="group-info">
            <div class="group-name">{{ group.groupName }}</div>
            <div class="group-desc">{{ group.groupContent || "暂无描述" }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧主内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 创建或加入域弹窗组件 -->
    <AddDomainModal v-model="showAddModal" />

    <!-- 群聊详情弹窗 -->
    <n-modal
      v-model:show="showGroupModal"
      preset="card"
      :style="{ width: '420px' }"
      :bordered="false"
      :closable="true"
      @close="closeGroupModal"
    >
      <template #header>
        <div class="modal-header">群聊详情</div>
      </template>

      <div v-if="selectedGroup" class="group-detail">
        <!-- 群聊头像和名称 -->
        <div class="group-header">
          <n-avatar
            :src="
              selectedGroup.photo || require('@/assets/images/默认头像.jpeg')
            "
            :size="80"
            round
          />
          <div class="group-title">
            <div class="group-name-large">{{ selectedGroup.groupName }}</div>
            <div class="group-id">ID: {{ selectedGroup.id }}</div>
          </div>
        </div>

        <n-divider />

        <!-- 群聊信息 -->
        <div class="group-info-section">
          <div class="info-item">
            <span class="info-label">群聊描述</span>
            <span class="info-value">{{
              selectedGroup.groupContent || "暂无描述"
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">创建时间</span>
            <span class="info-value">{{
              selectedGroup.createTime || "未知"
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">成员数量</span>
            <span class="info-value"
              >{{ selectedGroup.memberCount || 0 }} 人</span
            >
          </div>
        </div>
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button @click="closeGroupModal">取消</n-button>
          <n-button
            type="primary"
            :loading="isApplying"
            :disabled="isApplying"
            @click="applyToJoinGroup"
          >
            申请加入
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import {
  NIcon,
  useMessage,
  NModal,
  NCard,
  NButton,
  NSpace,
  NAvatar,
  NDivider,
} from "naive-ui";
import { Search12Regular } from "@vicons/fluent";
import AddDomainModal from "@/component/Home/AddDomainModal.vue";
import { getGroupListApi, applyJoinGroupApi } from "@/api/group/group";

const route = useRoute();
const message = useMessage();

// 判断是否在主页
const isHomePage = computed(() => route.path === "/home/dashboard");

// 主导航项
const mainNavItems = [
  { path: "/home", icon: "icon-home", name: "首页" },
  { path: "/home/messages", icon: "icon-message", name: "消息" },
  { path: "/home/friends", icon: "icon-friends", name: "好友" },
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

// 弹窗相关状态
const showAddModal = ref(false);

// 搜索相关
const searchKeyword = ref("");
const searchResults = ref<any[]>([]);
const loading = ref(false);
const hasSearched = ref(false);

// 处理搜索
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = [];
    hasSearched.value = false;
    return;
  }

  loading.value = true;
  hasSearched.value = true;

  try {
    const res = await getGroupListApi({
      groupName: searchKeyword.value.trim(),
      page: 1,
      pageSize: 20,
    });
    searchResults.value = res.records || [];
  } catch (error: any) {
    console.error("搜索失败:", error);
    message.error(error.message || "搜索失败");
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
};

// 选择群组
const selectGroup = (group: any) => {
  console.log("选择群组:", group);
  selectedGroup.value = group;
  showGroupModal.value = true;
};

// 群聊详情弹窗相关
const showGroupModal = ref(false);
const selectedGroup = ref<any>(null);
const isApplying = ref(false);

// 关闭弹窗
const closeGroupModal = () => {
  showGroupModal.value = false;
  selectedGroup.value = null;
};

// 申请加入群聊
const applyToJoinGroup = async () => {
  if (!selectedGroup.value) return;

  isApplying.value = true;
  try {
    const res = await applyJoinGroupApi(selectedGroup.value.id);
    console.log("申请加入群聊成功:", res);

    message.success(`已申请加入群聊: ${selectedGroup.value.groupName}`);
    closeGroupModal();
  } catch (error: any) {
    console.error("申请加入失败:", error);
    message.error(error.message || "申请加入失败");
  } finally {
    isApplying.value = false;
  }
};
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

/* 频道列表 */
.channel-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.loading-text,
.empty-text {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.group-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-item:hover {
  background-color: #e8e8e8;
}

.group-item img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-desc {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
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

/* 群聊详情弹窗样式 */
.modal-header {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.group-detail {
  padding: 8px 0;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.group-title {
  flex: 1;
}

.group-name-large {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.group-id {
  font-size: 12px;
  color: #999;
}

.group-info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.info-value {
  font-size: 14px;
  color: #333;
  word-break: break-all;
}

.icon-search::before {
  content: "🔍";
}

.icon-plus::before {
  content: "➕";
  font-size: 20px;
}
</style>
