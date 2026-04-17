<template>
  <div class="messages-container">
    <!-- 左侧消息列表 -->
    <div class="messages-sidebar">
      <!-- 消息类型切换 -->
      <div class="message-tabs">
        <div
          class="tab-item"
          :class="{ active: activeTab === 'system' }"
          @click="activeTab = 'system'"
        >
          <n-badge
            :value="unreadSystemCount"
            :max="99"
            :show="unreadSystemCount > 0"
          >
            <span>系统消息</span>
          </n-badge>
        </div>
        <div
          class="tab-item"
          :class="{ active: activeTab === 'apply' }"
          @click="activeTab = 'apply'"
        >
          <n-badge
            :value="unreadApplyCount"
            :max="99"
            :show="unreadApplyCount > 0"
          >
            <span>入群申请</span>
          </n-badge>
        </div>
      </div>

      <!-- 系统消息列表 -->
      <div v-if="activeTab === 'system'" class="message-list">
        <div v-if="loading" class="loading-text">加载中...</div>
        <div v-else-if="systemMessages.length === 0" class="empty-text">
          暂无系统消息
        </div>
        <div
          v-for="msg in systemMessages"
          :key="msg.id"
          class="message-item"
          :class="{ unread: !msg.isRead }"
          @click="selectSystemMessage(msg)"
        >
          <n-avatar :size="48" v-authImg="msg.avatar || defaultAvatar" round />
          <div class="message-content">
            <div class="message-title">
              <span class="name">{{ msg.title }}</span>
              <span class="time">{{ formatTime(msg.createTime) }}</span>
            </div>
            <div class="message-preview">{{ msg.content }}</div>
          </div>
          <n-tag v-if="msg.applyStatus == '0'" type="warning" size="small">
            待处理
          </n-tag>
          <n-tag v-else-if="msg.applyStatus == '1'" type="success" size="small">
            已通过
          </n-tag>
          <n-tag v-else-if="msg.applyStatus == '2'" type="error" size="small">
            已拒绝
          </n-tag>
        </div>
      </div>

      <!-- 入群申请列表 -->
      <div v-else class="message-list">
        <div v-if="loading" class="loading-text">加载中...</div>
        <div v-else-if="applyMessages.length === 0" class="empty-text">
          暂无入群申请
        </div>
        <div
          v-for="msg in applyMessages"
          :key="msg.id"
          class="message-item"
          :class="{ unread: !msg.isRead }"
          @click="selectApplyMessage(msg)"
        >
          <n-avatar :size="48" v-authImg="msg.avatar || defaultAvatar" round />
          <div class="message-content">
            <div class="message-title">
              <span class="name">{{ msg.title }}</span>
              <span class="time">{{ formatTime(msg.createTime) }}</span>
            </div>
            <div class="message-preview">{{ msg.content }}</div>
          </div>
          <n-tag v-if="msg.applyStatus === '0'" type="warning" size="small">
            待处理
          </n-tag>
          <n-tag
            v-else-if="msg.applyStatus === '1'"
            type="success"
            size="small"
          >
            已通过
          </n-tag>
          <n-tag v-else-if="msg.applyStatus === '2'" type="error" size="small">
            已拒绝
          </n-tag>
        </div>
      </div>
    </div>

    <!-- 右侧消息详情 -->
    <div class="messages-content">
      <!-- 系统消息详情 -->
      <div
        v-if="activeTab === 'system' && selectedSystemMsg"
        class="detail-panel"
      >
        <div class="detail-header">
          <h3>{{ selectedSystemMsg.title }}</h3>
          <span class="detail-time">{{
            formatTime(selectedSystemMsg.createTime)
          }}</span>
        </div>
        <div class="detail-body">
          <p>{{ selectedSystemMsg.content }}</p>
        </div>
      </div>

      <!-- 入群申请详情 -->
      <div
        v-else-if="activeTab === 'apply' && selectedApplyMsg"
        class="detail-panel"
      >
        <div class="detail-header">
          <n-avatar
            :size="64"
            v-authImg="selectedApplyMsg.avatar || defaultAvatar"
            round
          />
          <div class="detail-title">
            <h3>{{ selectedApplyMsg.title }}</h3>
            <span class="detail-time">{{ selectedApplyMsg.createTime }}</span>
          </div>
        </div>
        <n-divider />
        <div class="detail-body">
          <div class="info-section">
            <div class="info-item">
              <span class="info-label">申请人</span>
              <span class="info-value">{{
                selectedApplyMsg.applicantName
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">申请群聊</span>
              <span class="info-value">{{ selectedApplyMsg.groupName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">申请时间</span>
              <span class="info-value">{{ selectedApplyMsg.createTime }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前状态</span>
              <n-tag v-if="selectedApplyMsg.applyStatus == '0'" type="warning">
                待处理
              </n-tag>
              <n-tag
                v-else-if="selectedApplyMsg.applyStatus == '1'"
                type="success"
              >
                已通过
              </n-tag>
              <n-tag
                v-else-if="selectedApplyMsg.applyStatus == '2'"
                type="error"
              >
                已拒绝
              </n-tag>
            </div>
          </div>

          <!-- 待我审核的申请显示操作按钮 -->
          <div
            v-if="
              selectedApplyMsg.applyStatus == '0' &&
              selectedApplyMsg.type === 'checkApply'
            "
            class="action-buttons"
          >
            <n-button type="primary" size="large" @click="handleApprove">
              同意加入
            </n-button>
            <n-button size="large" @click="handleReject">拒绝申请</n-button>
          </div>

          <!-- 我的申请显示提示信息 -->
          <div
            v-else-if="
              selectedApplyMsg.type === 'myApply' &&
              selectedApplyMsg.applyStatus === '0'
            "
            class="apply-status-tip"
          >
            <n-alert type="info" title="申请状态">
              您的申请正在等待管理员审核，请耐心等待
            </n-alert>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <n-empty description="选择一条消息查看详情" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  NBadge,
  NAvatar,
  NTag,
  NButton,
  NDivider,
  NEmpty,
  NAlert,
  useMessage,
} from "naive-ui";
import {
  getMyApplyJoinGroupApi,
  getAllApplyJoinGroupApi,
  checkApplyJoinGroupApi,
} from "@/api/group/group";
import defaultAvatar from "@/assets/images/默认头像.jpeg";
import socketService from "@/utils/socket";
import { useUserStore } from "@/store/userStore";

const userStore = useUserStore();
const message = useMessage();

// 当前激活的标签页
const activeTab = ref<"system" | "apply">("system");

// 加载状态
const loading = ref(false);

// 未读消息数
const unreadSystemCount = ref(0);
const unreadApplyCount = ref(0);

// 系统消息列表（我发起的申请）
const systemMessages = ref<any[]>([]);
const selectedSystemMsg = ref<any>(null);

// 入群申请列表（待我审核的申请）
const applyMessages = ref<any[]>([]);
const selectedApplyMsg = ref<any>(null);

// 格式化时间
const formatTime = (time: string | number) => {
  if (!time) return "";
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 今天
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  // 昨天
  if (diff < 48 * 60 * 60 * 1000 && date.getDate() === now.getDate() - 1) {
    return "昨天";
  }
  // 更早
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
};

// 处理 WebSocket 消息
const onSocketMessage = (data: any) => {
  // 如果收到的是入群申请相关的消息（根据业务逻辑判断消息类型）
  // 假设后端推送的消息包含 type 或特定字段来区分
  if (
    data.type === "APPLY_NOTIFICATION" ||
    data.type === "AUDIT_NOTIFICATION"
  ) {
    fetchApplyMessages(); // 重新拉取列表以获取最新状态
    message.info("收到新的申请通知");
  }
};

// 获取系统消息（真正的系统通知）
const fetchSystemMessages = async () => {
  loading.value = true;
  try {
    // 模拟系统消息数据
    systemMessages.value = [
      {
        id: "sys-1",
        title: "欢迎加入 Oopz",
        content: "欢迎来到 Oopz 协作平台！您可以创建群聊、邀请好友、共同绘图。",
        createTime: new Date("2026-04-15 10:00").toISOString(),
        isRead: true,
        avatar: "",
      },
      {
        id: "sys-2",
        title: "版本更新通知",
        content: "系统已更新至 v1.2.0，修复了 ERD 绘图工具的显示问题。",
        createTime: new Date("2026-04-16 14:30").toISOString(),
        isRead: false,
        avatar: "",
      },
    ];
    unreadSystemCount.value = systemMessages.value.filter(
      (m) => !m.isRead,
    ).length;
  } catch (error: any) {
    console.error("获取系统消息失败:", error);
    message.error("获取系统消息失败");
  } finally {
    loading.value = false;
  }
};

// 获取入群申请（我发起的 + 待我审核的）
const fetchApplyMessages = async () => {
  loading.value = true;
  try {
    // 获取我发起的申请
    const myAppliesRes = await getMyApplyJoinGroupApi();
    const myApplies = myAppliesRes || [];

    // 获取待我审核的申请
    const checkAppliesRes = await getAllApplyJoinGroupApi().catch(() => null);
    const checkApplies = checkAppliesRes || [];

    // 合并两种申请
    const myApplyList = myApplies.map((item: any) => ({
      id: `my-${item.id}`,
      title: `我的申请: ${item.groupName}`,
      content: `您申请加入群聊 "${item.groupName}"，${
        item.applyStatus == "0"
          ? "等待管理员审核"
          : item.applyStatus == "1"
          ? "已通过"
          : "已被拒绝"
      }`,
      applyStatus: item.applyStatus,
      isRead: item.applyStatus != "0",
      createTime: item.applyTime,
      avatar: item.groupPhoto,
      groupName: item.groupName,
      groupId: item.groupId,
      applicantName: "我",
      type: "myApply",
    }));

    const checkApplyList = checkApplies.map((item: any) => ({
      id: `check-${item.id}`,
      title: `审核请求: ${item.groupName}`,
      content: `${item.applicantName} 申请加入 "${item.groupName}"`,
      applyStatus: item.applyStatus,
      isRead: item.applyStatus != "0",
      createTime: item.applyTime,
      avatar: item.applicantPhoto,
      applicantName: item.applicantName,
      applicantId: item.applicantId,
      groupName: item.groupName,
      groupId: item.groupId,
      type: "checkApply",
    }));

    applyMessages.value = [...myApplyList, ...checkApplyList].sort(
      (a: any, b: any) =>
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime(),
    );

    unreadApplyCount.value = applyMessages.value.filter(
      (m) => !m.isRead,
    ).length;
  } catch (error: any) {
    console.error("获取入群申请失败:", error);
    message.error("获取入群申请失败");
  } finally {
    loading.value = false;
  }
};

// 选择系统消息
const selectSystemMessage = (msg: any) => {
  selectedSystemMsg.value = msg;
  if (!msg.isRead) {
    msg.isRead = true;
    unreadSystemCount.value = Math.max(0, unreadSystemCount.value - 1);
  }
};

// 选择入群申请
const selectApplyMessage = (msg: any) => {
  selectedApplyMsg.value = msg;
  console.log(msg);

  if (!msg.isRead) {
    msg.isRead = true;
    unreadApplyCount.value = Math.max(0, unreadApplyCount.value - 1);
  }
};

// 同意申请
const handleApprove = async () => {
  if (!selectedApplyMsg.value) return;
  try {
    const applyId = selectedApplyMsg.value.id.replace("check-", "");
    await checkApplyJoinGroupApi(applyId, "1");
    message.success("已同意申请");
    selectedApplyMsg.value.applyStatus = "1";
    fetchApplyMessages();
  } catch (error: any) {
    message.error(error.message || "操作失败");
  }
};

// 拒绝申请
const handleReject = async () => {
  if (!selectedApplyMsg.value) return;
  try {
    const applyId = selectedApplyMsg.value.id.replace("check-", "");
    await checkApplyJoinGroupApi(applyId, "2");
    message.success("已拒绝申请");
    selectedApplyMsg.value.applyStatus = "2";
    fetchApplyMessages();
  } catch (error: any) {
    message.error(error.message || "操作失败");
  }
};

// 初始化
onMounted(() => {
  fetchSystemMessages();
  fetchApplyMessages();

  // 监听 WebSocket
  if (userStore.token) {
    socketService.connect(userStore.token);
    socketService.on("message", onSocketMessage);
  }
});

// 卸载
import { onUnmounted } from "vue";
onUnmounted(() => {
  socketService.off("message", onSocketMessage);
});
</script>

<style scoped>
.messages-container {
  display: flex;
  height: 100%;
  background-color: #fff;
}

/* 左侧消息列表 */
.messages-sidebar {
  width: 320px;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
}

/* 消息类型切换 */
.message-tabs {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  background-color: #fff;
}

.tab-item {
  flex: 1;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
  position: relative;
}

.tab-item:hover {
  background-color: #f5f5f5;
}

.tab-item.active {
  color: #1890ff;
  font-weight: 500;
}

.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background-color: #1890ff;
}

/* 消息列表 */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.loading-text,
.empty-text {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.message-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-bottom: 4px;
}

.message-item:hover {
  background-color: #e8e8e8;
}

.message-item.unread {
  background-color: #e6f7ff;
}

.message-item.unread:hover {
  background-color: #bae7ff;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-title .name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.message-title .time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.message-preview {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 右侧消息详情 */
.messages-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

/* 详情面板 */
.detail-panel {
  padding: 32px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.detail-title {
  flex: 1;
}

.detail-title h3 {
  margin-bottom: 4px;
}

.detail-time {
  font-size: 13px;
  color: #999;
}

.detail-body {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.detail-body p {
  margin-bottom: 24px;
}

/* 信息区域 */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-label {
  font-size: 14px;
  color: #999;
  width: 80px;
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 24px;
}

/* 申请状态提示 */
.apply-status-tip {
  margin-top: 24px;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
