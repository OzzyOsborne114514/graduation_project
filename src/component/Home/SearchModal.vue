<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :style="{ width: '600px', maxHeight: '80vh' }"
    :bordered="false"
    :closable="true"
    @close="closeModal"
  >
    <template #header>
      <div class="modal-header">综合搜索</div>
    </template>

    <!-- 搜索框 -->
    <div class="search-section">
      <div class="search-input-wrapper">
        <n-icon size="20" class="search-icon">
          <Search24Regular />
        </n-icon>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="输入搜索关键词"
          class="search-input"
          @keyup.enter="handleSearch"
        />
      </div>
      <n-button type="primary" @click="handleSearch">搜索</n-button>
    </div>

    <!-- 标签页 -->
    <n-tabs v-model:value="activeTab" type="line" class="search-tabs">
      <n-tab-pane name="user" tab="用户">
        <div class="tab-content">
          <div v-if="loading" class="loading-state">搜索中...</div>
          <div v-else-if="!hasSearched" class="empty-state">
            <n-icon size="64" class="empty-icon">
              <Search24Regular />
            </n-icon>
            <p>输入关键词搜索</p>
          </div>
          <div v-else-if="userResults.length === 0" class="empty-state">
            <n-empty description="暂无搜索结果" />
          </div>
          <div v-else class="result-list">
            <div
              v-for="user in userResults"
              :key="user.id"
              class="result-item"
              @click="selectUser(user)"
            >
              <n-avatar :size="48" :src="user.photo || defaultAvatar" round />
              <div class="result-info">
                <div class="result-name">
                  {{ user.firstName }}{{ user.lastName }}
                </div>
                <div class="result-desc">
                  {{ user.telephone || "暂无描述" }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="group" tab="领域">
        <div class="tab-content">
          <div v-if="loading" class="loading-state">搜索中...</div>
          <div v-else-if="!hasSearched" class="empty-state">
            <n-icon size="64" class="empty-icon">
              <Search24Regular />
            </n-icon>
            <p>输入关键词搜索</p>
          </div>
          <div v-else-if="groupResults.length === 0" class="empty-state">
            <n-empty description="暂无搜索结果" />
          </div>
          <div v-else class="result-list">
            <div
              v-for="group in groupResults"
              :key="group.id"
              class="result-item"
              @click="selectGroup(group)"
            >
              <n-avatar :size="48" :src="group.photo || defaultAvatar" round />
              <div class="result-info">
                <div class="result-name">{{ group.groupName }}</div>
                <div class="result-desc">
                  {{ group.groupContent || "暂无描述" }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </n-modal>

  <!-- 群聊详情弹窗 -->
  <n-modal
    v-model:show="showGroupDetailModal"
    preset="card"
    :style="{ width: '420px' }"
    :bordered="false"
    :closable="true"
  >
    <template #header>
      <div class="modal-header">群聊详情</div>
    </template>

    <div v-if="selectedGroup" class="group-detail">
      <div class="group-header">
        <n-avatar
          :src="selectedGroup.photo || defaultAvatar"
          :size="80"
          round
        />
        <div class="group-title">
          <div class="group-name-large">{{ selectedGroup.groupName }}</div>
          <div class="group-id">ID: {{ selectedGroup.id }}</div>
        </div>
      </div>

      <n-divider />

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
      </div>

      <n-divider />

      <n-space justify="center">
        <n-button @click="showGroupDetailModal = false">取消</n-button>
        <n-button
          type="primary"
          :loading="isApplying"
          :disabled="isApplying"
          @click="applyToJoinGroup"
        >
          申请加入
        </n-button>
      </n-space>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  NModal,
  NTabs,
  NTabPane,
  NButton,
  NIcon,
  NAvatar,
  NDivider,
  NSpace,
  NEmpty,
  useMessage,
} from "naive-ui";
import { Search24Regular } from "@vicons/fluent";
import { getGroupListApi, applyJoinGroupApi } from "@/api/group/group";
import defaultAvatar from "@/assets/images/默认头像.jpeg";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const message = useMessage();

const showModal = ref(props.modelValue);
const activeTab = ref("user");
const searchKeyword = ref("");
const loading = ref(false);
const hasSearched = ref(false);
const userResults = ref<any[]>([]);
const groupResults = ref<any[]>([]);

// 群聊详情弹窗
const showGroupDetailModal = ref(false);
const selectedGroup = ref<any>(null);
const isApplying = ref(false);

watch(
  () => props.modelValue,
  (val) => {
    showModal.value = val;
    if (val) {
      // 打开弹窗时重置状态
      searchKeyword.value = "";
      hasSearched.value = false;
      userResults.value = [];
      groupResults.value = [];
    }
  },
);

watch(showModal, (val) => {
  emit("update:modelValue", val);
});

const closeModal = () => {
  showModal.value = false;
};

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    message.warning("请输入搜索关键词");
    return;
  }

  loading.value = true;
  hasSearched.value = true;

  try {
    // 搜索群聊（领域）
    const groupRes = await getGroupListApi({
      groupName: searchKeyword.value.trim(),
      page: 1,
      pageSize: 50,
    });
    groupResults.value = (groupRes as any[]) || [];

    // TODO: 搜索用户接口
    userResults.value = [];
  } catch (error: any) {
    message.error("搜索失败：" + (error.message || "未知错误"));
  } finally {
    loading.value = false;
  }
};

const selectUser = (user: any) => {
  console.log("选择用户:", user);
  // TODO: 打开用户详情或添加好友
};

const selectGroup = (group: any) => {
  selectedGroup.value = group;
  showGroupDetailModal.value = true;
};

const applyToJoinGroup = async () => {
  if (!selectedGroup.value) return;

  isApplying.value = true;
  try {
    await applyJoinGroupApi(selectedGroup.value.id);
    message.success("申请已发送，等待管理员审核");
    showGroupDetailModal.value = false;
  } catch (error: any) {
    message.error(error.message || "申请失败");
  } finally {
    isApplying.value = false;
  }
};
</script>

<style scoped>
.modal-header {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.search-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 8px 12px;
  gap: 8px;
}

.search-icon {
  color: #999;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
}

.search-input::placeholder {
  color: #999;
}

.search-tabs {
  margin-top: 16px;
}

.tab-content {
  min-height: 300px;
  max-height: 400px;
  overflow-y: auto;
}

.loading-state {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.empty-icon {
  color: #d9d9d9;
  margin-bottom: 16px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.result-item:hover {
  background-color: #f5f5f5;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.result-desc {
  font-size: 14px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 群聊详情样式 */
.group-detail {
  padding: 8px 0;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 16px;
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
  font-size: 14px;
  color: #999;
}

.group-info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-label {
  font-size: 14px;
  color: #666;
  min-width: 80px;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  flex: 1;
  word-break: break-all;
}
</style>
