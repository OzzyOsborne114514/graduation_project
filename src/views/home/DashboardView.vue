<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="welcome-text">
        <h1>你好，{{ userStore.name || "新用户" }}</h1>
        <p>今天是 {{ currentDate }}，开启高效的一天吧！</p>
      </div>
    </header>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  NGrid,
  NGi,
  NCard,
  NIcon,
  NAvatar,
  NTimeline,
  NTimelineItem,
} from "naive-ui";
import {
  Chat24Regular,
  People24Regular,
  Toolbox24Regular,
  Calendar24Regular,
} from "@vicons/fluent";
import { useUserStore } from "@/store/userStore";
import { getMyGroupList } from "@/api/group/group";
import defaultAvatar from "@/assets/images/默认头像.jpeg";

const userStore = useUserStore();
const currentDate = new Date().toLocaleDateString("zh-CN", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const recentGroups = ref<any[]>([]);

const fetchDashboardData = async () => {
  try {
    const res = await getMyGroupList();
    recentGroups.value = (res || []).slice(0, 5);
  } catch (error) {
    console.error("加载面板数据失败:", error);
  }
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
.dashboard {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.dashboard-header {
  margin-bottom: 24px;
}

.welcome-text h1 {
  margin: 0;
  font-size: 28px;
  color: #1a1a1a;
}

.welcome-text p {
  margin: 8px 0 0;
  color: #8c8c8c;
}

.dashboard-card {
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.recent-item:hover {
  background-color: #f0f0f0;
}

.item-info {
  flex: 1;
  overflow: hidden;
}

.item-name {
  font-weight: 500;
  color: #333;
}

.item-desc {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-list {
  text-align: center;
  color: #999;
  padding: 20px;
}
</style>
