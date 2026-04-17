<template>
  <div class="chat-view">
    <!-- 聊天头部 -->
    <header class="chat-header">
      <div class="group-info" v-if="groupDetail">
        <n-avatar
          :size="36"
          v-authImg="groupDetail.photo?.url || defaultAvatar"
          round
        />
        <span class="group-name">{{ groupDetail.groupName }}</span>
      </div>
      <div class="chat-actions">
        <n-icon size="24" @click="showMembers = !showMembers">
          <People24Regular />
        </n-icon>
        <n-icon size="24"><MoreHorizontal24Regular /></n-icon>
      </div>
    </header>

    <div class="chat-main-container">
      <!-- 消息列表区 -->
      <div class="message-container" ref="messageContainer">
        <div v-if="loading" class="loading-state">
          <n-spin size="medium" />
        </div>
        <template v-else>
          <div
            v-for="(msg, index) in messages"
            :key="msg.id || index"
            class="message-item"
            :class="{ 'message-mine': msg.senderId === userStore.id }"
          >
            <n-avatar
              v-if="msg.senderId !== userStore.id"
              :size="36"
              v-authImg="msg.photo?.url || defaultAvatar"
              round
              class="sender-avatar"
            />
            <div class="message-content-wrapper">
              <div v-if="msg.senderId !== userStore.id" class="sender-name">
                {{ msg.senderName }}
              </div>
              <div class="message-bubble">
                {{ msg.content }}
              </div>
              <div class="message-time">{{ formatTime(msg.sendTime) }}</div>
            </div>
            <n-avatar
              v-if="msg.senderId === userStore.id"
              :size="36"
              v-authImg="userStore.avatar || defaultAvatar"
              round
              class="sender-avatar"
            />
          </div>
        </template>
      </div>

      <!-- 群成员侧边栏 -->
      <aside class="members-sidebar" v-if="showMembers">
        <div class="members-header">群成员 ({{ members.length }})</div>
        <div class="members-list">
          <div v-for="member in members" :key="member.id" class="member-item">
            <n-avatar
              :size="32"
              v-authImg="member.photo?.url || defaultAvatar"
              round
            />
            <span class="member-name">{{ member.name }}</span>
            <span
              :style="{ color: member.onlineStatus == 1 ? 'green' : 'red' }"
              class="member-status"
              >{{ member.onlineStatus == 1 ? "在线" : "离线" }}</span
            >
          </div>
        </div>
      </aside>
    </div>

    <!-- 输入区 -->
    <footer class="chat-footer">
      <div class="toolbar">
        <n-icon size="20"><Emoji24Regular /></n-icon>
        <n-icon size="20"><Attach24Regular /></n-icon>
        <n-icon size="20"><Image24Regular /></n-icon>
      </div>
      <div class="input-wrapper">
        <n-input
          v-model:value="inputText"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 4 }"
          placeholder="输入消息..."
          @keyup.enter.prevent="handleSendMessage"
        />
        <n-button
          type="primary"
          :disabled="!inputText.trim()"
          @click="handleSendMessage"
        >
          发送
        </n-button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from "vue";
import { useRoute } from "vue-router";
import { NAvatar, NIcon, NInput, NButton, NSpin, useMessage } from "naive-ui";
import {
  MoreHorizontal24Regular,
  Emoji24Regular,
  Attach24Regular,
  Image24Regular,
  People24Regular,
} from "@vicons/fluent";
import {
  getHistoryMessage,
  sendMessage,
  getMembersInfo,
} from "@/api/group/group";
import { useUserStore } from "@/store/userStore";
import { useChatStore } from "@/store/chatStore";
import defaultAvatar from "@/assets/images/默认头像.jpeg";
import socketService from "@/utils/socket";

const route = useRoute();
const userStore = useUserStore();
const chatStore = useChatStore();
const message = useMessage();
const messageContainer = ref<HTMLElement | null>(null);

const groupId = ref(route.params.groupId as string);
const groupDetail = computed(() => chatStore.currentGroupDetail);
const messages = ref<any[]>([]);
const loading = ref(false);
const inputText = ref("");

// 群成员相关
const showMembers = ref(false);
const members = ref<any[]>([]);

// 获取群成员
const fetchMembers = async () => {
  if (!groupId.value) return;
  try {
    const res = await getMembersInfo(groupId.value);
    members.value = res || [];
  } catch (error) {
    console.error("获取群成员失败:", error);
  }
};

// 获取历史消息
const fetchMessages = async () => {
  if (!groupId.value) return;
  loading.value = true;
  try {
    const res = await getHistoryMessage(groupId.value);
    messages.value = res || [];
    scrollToBottom();
  } catch (error: any) {
    message.error("获取消息失败：" + (error.message || "未知错误"));
  } finally {
    loading.value = false;
  }
};

// 处理接收到的 Socket 消息
const onMessageReceived = (data: any) => {
  // 确保消息属于当前群聊
  if (data.groupId === groupId.value) {
    messages.value.push(data);
    scrollToBottom();
  }
};

// 发送消息
const handleSendMessage = async () => {
  if (!inputText.value.trim()) return;

  const content = inputText.value.trim();
  inputText.value = ""; // 立即清空输入框

  try {
    await sendMessage(groupId.value, content);
    // 发送成功后，通常会通过 Socket 收到自己发送的消息，所以这里不需要手动 push
  } catch (error: any) {
    message.error("发送失败：" + (error.message || "未知错误"));
    inputText.value = content; // 恢复内容
  }
};

onMounted(() => {
  fetchMessages();
  fetchMembers();

  // 连接 WebSocket 并监听消息
  if (userStore.token) {
    socketService.connect(userStore.token);
    socketService.on("message", onMessageReceived);
  }
});

// 组件卸载时移除监听
import { onUnmounted } from "vue";
onUnmounted(() => {
  socketService.off("message", onMessageReceived);
});

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

// 格式化时间
const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  const date = new Date(timeStr);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

onMounted(() => {
  fetchMessages();
});

watch(
  () => route.params.groupId,
  (newId) => {
    if (newId) {
      groupId.value = newId as string;
      fetchMessages();
      fetchMembers();
    }
  },
);
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

.chat-header {
  height: 64px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chat-actions {
  display: flex;
  gap: 16px;
  color: #666;
  cursor: pointer;
}

.chat-actions .n-icon:hover {
  color: #1890ff;
}

.chat-main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: #f5f7fa;
}

/* 群成员侧边栏 */
.members-sidebar {
  width: 240px;
  background-color: #fff;
  border-left: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.members-header {
  padding: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

.members-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.member-item:hover {
  background-color: #f5f5f5;
}

.member-name {
  font-size: 14px;
  color: #333;
}

.member-status {
  font-size: 12px;
  color: #999;
  display: block;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 80%;
}

.message-mine {
  align-self: flex-end;
  flex-direction: row;
}

.sender-avatar {
  flex-shrink: 0;
}

.message-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-mine .message-content-wrapper {
  align-items: flex-end;
}

.sender-name {
  font-size: 12px;
  color: #999;
}

.message-bubble {
  padding: 10px 14px;
  background-color: #fff;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  word-break: break-all;
}

.message-mine .message-bubble {
  background-color: #1890ff;
  color: #fff;
}

.message-time {
  font-size: 11px;
  color: #bbb;
}

.chat-footer {
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  background-color: #fff;
}

.toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  color: #666;
}

.toolbar .n-icon {
  cursor: pointer;
}

.toolbar .n-icon:hover {
  color: #1890ff;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-wrapper .n-input {
  flex: 1;
}
</style>
