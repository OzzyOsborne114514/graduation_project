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
          <n-badge
            v-if="item.path === '/home/messages' && unreadApplyCount > 0"
            :value="unreadApplyCount"
            :max="99"
          >
            <n-icon size="24">
              <component :is="item.icon" />
            </n-icon>
          </n-badge>
          <n-icon v-else size="24">
            <component :is="item.icon" />
          </n-icon>
        </router-link>
      </nav>

      <!-- 底部用户头像 -->
      <div class="user-avatar-section">
        <n-dropdown
          :options="userDropdownOptions"
          placement="right"
          @select="handleUserDropdownSelect"
        >
          <n-avatar
            :size="50"
            v-authImg="userAvatar"
            round
            class="user-avatar"
          />
        </n-dropdown>
      </div>
    </aside>

    <!-- 中间内容区（仅在主页显示） -->
    <aside class="channel-sidebar" v-if="showChannelSidebar">
      <div class="channel-header">
        <div class="search-box">
          <n-icon size="20"><Search24Regular /></n-icon>
          <input
            type="text"
            placeholder="搜索"
            readonly
            @click="showSearchModal = true"
          />
        </div>
        <n-dropdown
          :options="createDropdownOptions"
          placement="bottom"
          @select="handleCreateDropdownSelect"
        >
          <div class="create-group-btn">
            <span class="plus-icon">+</span>
          </div>
        </n-dropdown>
      </div>
      <div class="channel-list">
        <div v-if="myGroups.length === 0" class="empty-text">
          暂无加入的群聊
        </div>
        <div
          v-else
          v-for="group in myGroups"
          :key="group.id"
          class="channel-item"
          :class="{ active: activeGroupId === group.id }"
          @click="handleGroupClick(group)"
        >
          <n-avatar
            :size="50"
            v-authImg="group.photo?.url || defaultAvatar"
            round
          />
          <div class="channel-info">
            <div class="channel-name">{{ group.groupName }}</div>
            <div class="channel-desc">
              {{ "暂无消息" }}
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧主内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 搜索弹窗组件 -->
    <SearchModal v-model="showSearchModal" />
    <!-- 创建群聊弹窗组件 -->
    <AddDomainModal v-model="showAddDomainModal" @success="fetchMyGroups" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NIcon,
  useMessage,
  NButton,
  NAvatar,
  NDropdown,
  NBadge,
} from "naive-ui";
import { SignOut20Regular, Search24Regular } from "@vicons/fluent";
import SearchModal from "@/component/Home/SearchModal.vue";
import AddDomainModal from "@/component/Home/AddDomainModal.vue";
import { logoutApi } from "@/api/user/user";
import { getAllApplyJoinGroupApi, getMyGroupList } from "@/api/group/group";
import defaultAvatar from "@/assets/images/默认头像.jpeg";
import { useUserStore } from "@/store/userStore";
const userStore = useUserStore();

const route = useRoute();
const router = useRouter();
const message = useMessage();

// 判断是否显示频道侧边栏
const showChannelSidebar = computed(() => {
  return (
    route.path.startsWith("/home/dashboard") ||
    route.path.startsWith("/home/chat")
  );
});

// 主导航项
import {
  Home24Regular,
  Chat24Regular,
  People24Regular,
  Toolbox24Regular,
} from "@vicons/fluent";
const mainNavItems = [
  { path: "/home", icon: Home24Regular, name: "首页" },
  { path: "/home/messages", icon: Chat24Regular, name: "消息" },
  { path: "/home/friends", icon: People24Regular, name: "好友" },
  { path: "/home/tools", icon: Toolbox24Regular, name: "工具" },
];

const activeServer = ref(1);

// 创建下拉菜单选项
import { PeopleAdd24Regular, PeopleTeamAdd24Regular } from "@vicons/fluent";
const createDropdownOptions = [
  {
    label: "创建群聊",
    key: "createGroup",
    icon: () => h(NIcon, null, { default: () => h(PeopleTeamAdd24Regular) }),
  },
  {
    label: "加好友/群",
    key: "addFriend",
    icon: () => h(NIcon, null, { default: () => h(PeopleAdd24Regular) }),
  },
];

// 处理创建下拉菜单选择
const handleCreateDropdownSelect = (key: string) => {
  if (key === "createGroup") {
    showAddDomainModal.value = true;
  } else if (key === "addFriend") {
    showSearchModal.value = true;
  }
};

// 用户相关
const userAvatar = ref(userStore.avatar || defaultAvatar);

// 用户下拉菜单选项
const userDropdownOptions = [
  {
    label: "退出登录",
    key: "logout",
    icon: () => h(NIcon, null, { default: () => h(SignOut20Regular) }),
  },
];

// 处理用户下拉菜单选择
const handleUserDropdownSelect = async (key: string) => {
  if (key === "logout") {
    try {
      await logoutApi();
      message.success("退出登录成功");
      router.push("/login");
    } catch (error: any) {
      message.error(error.message || "退出登录失败");
    }
  }
};

// 搜索弹窗
const showSearchModal = ref(false);
// 创建群聊弹窗
const showAddDomainModal = ref(false);

// 未读消息数（待审核的入群申请）
const unreadApplyCount = ref(0);

// 我的群聊列表
const myGroups = ref<any[]>([]);
const activeGroupId = ref<string | null>(
  (route.params.groupId as string) || null,
);

// 监听路由变化同步激活的群组ID
watch(
  () => route.params.groupId,
  (newId) => {
    if (newId) {
      activeGroupId.value = newId as string;
    } else {
      activeGroupId.value = null;
    }
  },
);

// 获取我加入的群聊列表
const fetchMyGroups = async () => {
  try {
    const res = await getMyGroupList();
    myGroups.value = res || [];
  } catch (error: any) {
    message.error("获取群聊列表失败：" + (error.message || "未知错误"));
  }
};

// 处理群聊项点击
const handleGroupClick = (group: any) => {
  activeGroupId.value = group.id;
  router.push(`/home/chat/${group.id}`);
};

// 获取未读消息数
const fetchUnreadApplyCount = async () => {
  try {
    const res = await getAllApplyJoinGroupApi();
    // 统计状态为 0（待审核）的申请数量
    const pendingApplies = (res || []).filter(
      (item: any) => item.applyStatus == "0",
    );
    unreadApplyCount.value = pendingApplies.length;
  } catch (error) {
    console.error("获取未读消息数失败:", error);
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchUnreadApplyCount();
  fetchMyGroups();
  console.log(userAvatar.value);
});
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

/* 导航项中的徽章样式 */
.nav-item :deep(.n-badge) {
  display: flex;
  align-items: center;
  justify-content: center;
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
  width: 320px;
  background-color: #fafafa;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.channel-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.channel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 20px;
  padding: 8px 16px;
  gap: 8px;
  cursor: pointer;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  width: 100%;
  cursor: pointer;
}

.search-box input::placeholder {
  color: #999;
}

.create-group-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-group-btn:hover {
  background-color: #e0e0e0;
}

.plus-icon {
  font-size: 24px;
  font-weight: 300;
  color: #666;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding-bottom: 2px;
}

/* 频道列表 */
.channel-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.channel-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  gap: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 2px;
}

.channel-item:hover {
  background-color: #f0f0f0;
}

.channel-item.active {
  background-color: #e6f7ff;
}

.channel-info {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-top: 2px;
}

.channel-name {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  text-align: left;
}

.channel-desc {
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  text-align: left;
}

.empty-text {
  text-align: center;
  color: #999;
  margin-top: 40px;
  font-size: 14px;
}

/* 右侧主内容区 */
.main-content {
  flex: 1;
  overflow: auto;
  background-color: #fff;
}

/* 用户头像区域 */
.user-avatar-section {
  padding: 12px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: center;
  align-items: center;
}

.user-avatar {
  cursor: pointer;
  transition: transform 0.2s;
}

.user-avatar:hover {
  transform: scale(1.05);
}

/* 主导航图标样式 */
.nav-item .n-icon {
  color: #666;
}

.nav-item.active .n-icon {
  color: #1890ff;
}
</style>
