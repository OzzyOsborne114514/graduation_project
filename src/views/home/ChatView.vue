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
            <div
              class="message-content-wrapper"
              @contextmenu.prevent="handleContextMenu($event, msg)"
            >
              <div v-if="msg.senderId !== userStore.id" class="sender-name">
                {{ msg.senderName }}
              </div>
              <div class="message-bubble">
                <div v-if="msg.file" class="message-file">
                  <n-icon size="32" class="file-icon">
                    <Image24Regular
                      v-if="getFileType(msg.file).startsWith('image/')"
                    />
                    <Document24Regular v-else />
                  </n-icon>
                  <div class="file-info">
                    <div class="file-name">{{ getFileName(msg.file) }}</div>
                    <div class="file-size">{{ getFileSize(msg.file) }}</div>
                  </div>
                  <n-button
                    text
                    type="primary"
                    @click="downloadFile(msg.file)"
                    class="download-btn"
                  >
                    下载
                  </n-button>
                </div>
                <div v-if="msg.content" class="message-text">
                  {{ msg.content }}
                </div>
              </div>
              <div class="message-time">{{ msg.sendTime }}</div>
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
        <n-popover trigger="click" placement="top-start" :width="300">
          <template #trigger>
            <n-icon size="20"><Emoji24Regular /></n-icon>
          </template>
          <div class="emoji-picker">
            <span
              v-for="emoji in emojiList"
              :key="emoji"
              class="emoji-item"
              @click="addEmoji(emoji)"
            >
              {{ emoji }}
            </span>
          </div>
        </n-popover>
        <n-icon size="20" @click="triggerFileInput('file')">
          <Attach24Regular />
        </n-icon>
        <n-icon size="20" @click="triggerFileInput('image')">
          <Image24Regular />
        </n-icon>
        <input
          type="file"
          ref="fileInput"
          style="display: none"
          @change="handleFileChange"
        />
        <input
          type="file"
          ref="imageInput"
          style="display: none"
          accept="image/*"
          @change="handleImageChange"
        />
      </div>
      <div class="file-preview-container" v-if="selectedFile">
        <div class="file-preview-card">
          <n-icon size="32" class="file-icon">
            <Image24Regular v-if="selectedFile.type.startsWith('image/')" />
            <Document24Regular v-else />
          </n-icon>
          <div class="file-info">
            <div class="file-name">{{ selectedFile.name }}</div>
            <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
          </div>
          <n-icon
            size="20"
            class="remove-file-icon"
            @click="selectedFile = null"
          >
            <Dismiss24Regular />
          </n-icon>
        </div>
      </div>
      <div class="input-wrapper">
        <n-input
          v-model:value="inputText"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 6 }"
          placeholder="输入消息... (Enter 发送, Ctrl+Enter 换行)"
          @keydown="handleKeyDown"
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

    <!-- 右键菜单 -->
    <n-dropdown
      placement="bottom-start"
      trigger="manual"
      :x="xRef"
      :y="yRef"
      :options="contextMenuOptions"
      :show="showDropdownRef"
      :on-clickoutside="() => (showDropdownRef = false)"
      @select="handleMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import {
  NAvatar,
  NIcon,
  NInput,
  NButton,
  NSpin,
  useMessage,
  NPopover,
  NDropdown,
} from "naive-ui";
import {
  MoreHorizontal24Regular,
  Emoji24Regular,
  Attach24Regular,
  Image24Regular,
  People24Regular,
  Document24Regular,
  Dismiss24Regular,
  ArrowUndo24Regular,
} from "@vicons/fluent";
import {
  getHistoryMessage,
  sendMessage,
  getMembersInfo,
  withdrawMessage,
} from "@/api/group/group";
import { useUserStore } from "@/store/userStore";
import { useChatStore } from "@/store/chatStore";
import defaultAvatar from "@/assets/images/默认头像.jpeg";
import socketService from "@/utils/socket";

import { h } from "vue";
const renderIcon = (icon: any) => {
  return () => h(NIcon, null, { default: () => h(icon) });
};

const route = useRoute();
const userStore = useUserStore();
const chatStore = useChatStore();
const message = useMessage();
const messageContainer = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);

const groupId = ref(route.params.groupId as string);
const groupDetail = computed(() => chatStore.currentGroupDetail);
const messages = ref<any[]>([]);
const loading = ref(false);
const inputText = ref("");
const selectedFile = ref<File | null>(null);

// 右键菜单相关
const showDropdownRef = ref(false);
const xRef = ref(0);
const yRef = ref(0);
const selectedMsgRef = ref<any>(null);

const contextMenuOptions = computed(() => {
  if (!selectedMsgRef.value) return [];
  const options = [];

  // 只有自己的消息显示撤回
  if (selectedMsgRef.value.senderId === userStore.id) {
    // 只能撤回两分钟内的消息
    const sendTime = new Date(selectedMsgRef.value.sendTime).getTime();
    const now = new Date().getTime();
    const isWithinTwoMinutes = now - sendTime <= 2 * 60 * 1000;

    if (isWithinTwoMinutes) {
      options.push({
        label: "撤回",
        key: "withdraw",
        icon: renderIcon(ArrowUndo24Regular),
      });
    }
  }

  // 可以在这里添加更多选项，如“复制”、“转发”等
  return options;
});

const handleContextMenu = (e: MouseEvent, msg: any) => {
  selectedMsgRef.value = msg;
  xRef.value = e.clientX;
  yRef.value = e.clientY;
  showDropdownRef.value = true;
};

const handleMenuSelect = async (key: string) => {
  showDropdownRef.value = false;
  if (key === "withdraw" && selectedMsgRef.value) {
    // 再次检查时间，防止用户长时间停留在右键菜单
    const sendTime = new Date(selectedMsgRef.value.sendTime).getTime();
    const now = new Date().getTime();
    if (now - sendTime > 2 * 60 * 1000) {
      message.error("消息发送已超过两分钟，无法撤回");
      return;
    }

    const msgId = selectedMsgRef.value.id || selectedMsgRef.value.msgId;
    if (!msgId) {
      message.warning("消息 ID 缺失，无法撤回");
      return;
    }
    try {
      const res = await withdrawMessage(msgId);
      message.success("消息已撤回");
      messages.value = messages.value.filter(
        (m) => m.id !== msgId && m.msgId !== msgId,
      );
    } catch (error: any) {
      message.error("撤回失败：" + (error.message || "未知错误"));
    }
  }
};

// 表情列表
const emojiList = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😃",
  "😄",
  "😅",
  "😆",
  "😉",
  "😊",
  "😋",
  "😎",
  "😍",
  "😘",
  "🥰",
  "😗",
  "😙",
  "😚",
  "☺️",
  "🙂",
  "🤗",
  "🤩",
  "🤔",
  "🤨",
  "😐",
  "😑",
  "😶",
  "🙄",
  "😏",
  "😣",
  "😥",
  "😮",
  "🤐",
  "😯",
  "😪",
  "😫",
  "🥱",
  "😴",
  "😌",
  "😛",
  "😜",
  "😝",
  "🤤",
  "😒",
  "😓",
  "😔",
  "😕",
  "🙃",
  "🤑",
  "😲",
  "☹️",
  "🙁",
  "😖",
  "😞",
  "😟",
  "😤",
  "😢",
  "😭",
  "😦",
  "😧",
  "😨",
  "😩",
  "🤯",
  "😬",
  "😰",
  "😱",
  "🥵",
  "🥶",
  "😳",
  "🤪",
  "😵",
  "🥴",
  "😠",
  "😡",
  "🤬",
  "😷",
  "🤒",
  "🤕",
  "🤢",
  "🤮",
  "🤧",
  "😇",
  "🥳",
  "🥺",
  "🧐",
  "🤓",
  "😈",
  "👿",
  "👹",
  "👺",
  "💀",
  "👻",
  "👽",
  "🤖",
  "💩",
  "😺",
  "😸",
  "😹",
  "😻",
  "😼",
  "😽",
  "🙀",
  "😿",
  "😾",
];

const addEmoji = (emoji: string) => {
  inputText.value += emoji;
};

// 触发文件选择
const triggerFileInput = (type: "file" | "image") => {
  if (type === "file") {
    fileInput.value?.click();
  } else {
    imageInput.value?.click();
  }
};

// 处理文件选择
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    selectedFile.value = input.files[0];
    input.value = ""; // 重置，允许再次选择同一文件
  }
};

// 处理图片选择
const handleImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    selectedFile.value = input.files[0];
    input.value = ""; // 重置，允许再次选择同一文件
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 处理按键
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    if (e.ctrlKey) {
      // Ctrl + Enter: 换行
      // 在 n-input textarea 中，普通 Enter 默认换行，
      // 但由于我们要让普通 Enter 发送，所以需要手动处理 Ctrl+Enter 的换行逻辑
      const target =
        (e.target as any).tagName === "TEXTAREA"
          ? e.target
          : (e.target as HTMLElement).querySelector("textarea");
      if (target) {
        const start = (target as HTMLTextAreaElement).selectionStart;
        const end = (target as HTMLTextAreaElement).selectionEnd;
        const value = inputText.value;
        inputText.value =
          value.substring(0, start) + "\n" + value.substring(end);
        // 在下个事件循环中恢复光标位置
        nextTick(() => {
          (target as HTMLTextAreaElement).selectionStart = (
            target as HTMLTextAreaElement
          ).selectionEnd = start + 1;
        });
      }
      e.preventDefault();
    } else if (!e.shiftKey) {
      // 只有 Enter (不含 Shift): 发送
      e.preventDefault();
      handleSendMessage();
    }
  }
};

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
  console.log("收到群消息:", data);

  // 归一化字段名，确保与历史消息接口返回的字段名一致
  const normalizedMsg = {
    ...data,
    senderId: String(data.userId || data.senderId),
    sendTime: data.time || data.sendTime,
    senderName: data.userName || data.senderName,
  };

  messages.value.push(normalizedMsg);
  scrollToBottom();
};

// 文件相关工具函数
const getFileType = (file: any) => {
  return file.type || "";
};

const getFileName = (file: any) => {
  return file.name || "未知文件";
};

const getFileSize = (file: any) => {
  if (!file.size) return "";
  return formatFileSize(file.size);
};

const downloadFile = (file: any) => {
  if (file.url) {
    window.open(file.url, "_blank");
  } else {
    message.warning("无法下载该文件：缺少下载地址");
  }
};

// 发送消息
const handleSendMessage = async () => {
  if (!inputText.value.trim() && !selectedFile.value) return;

  const content = inputText.value.trim();
  const file = selectedFile.value;

  inputText.value = ""; // 立即清空输入框
  selectedFile.value = null; // 立即清空文件

  try {
    await sendMessage(groupId.value, content, file || undefined);
    // 发送成功后，通常会通过 Socket 收到消息，不需要手动 push
  } catch (error: any) {
    message.error("发送失败：" + (error.message || "未知错误"));
    // 失败时恢复内容
    if (content) inputText.value = content;
    if (file) selectedFile.value = file;
  }
};

// 监听消息
const setupSocket = () => {
  if (userStore.token && groupId.value) {
    socketService.connect(userStore.token);
    socketService.subscribe(`/topic/group/${groupId.value}`, onMessageReceived);
  }
};

onMounted(() => {
  fetchMessages();
  fetchMembers();
  setupSocket();
});

// 组件卸载时移除监听
onUnmounted(() => {
  if (groupId.value) {
    socketService.unsubscribe(
      `/topic/group/${groupId.value}`,
      onMessageReceived,
    );
  }
});

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

watch(
  () => route.params.groupId,
  (newId, oldId) => {
    if (newId) {
      // 取消旧群聊订阅
      if (oldId) {
        socketService.unsubscribe(`/topic/group/${oldId}`, onMessageReceived);
      }
      groupId.value = newId as string;
      fetchMessages();
      fetchMembers();
      // 订阅新群聊
      socketService.subscribe(`/topic/group/${newId}`, onMessageReceived);
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
  white-space: pre-wrap;
  text-align: left;
}

.message-file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: #f0f2f5;
  border-radius: 4px;
  margin-bottom: 8px;
  min-width: 200px;
}

.message-mine .message-file {
  background-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.message-mine .message-file .file-icon {
  color: #fff;
}

.message-mine .message-file .file-name {
  color: #fff;
}

.message-mine .message-file .file-size {
  color: rgba(255, 255, 255, 0.7);
}

.message-mine .message-file .download-btn {
  color: #fff;
}

.message-text {
  word-break: break-all;
}

.message-mine .message-bubble {
  background-color: #1890ff;
  color: #fff;
  text-align: left;
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

.file-preview-container {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
}

.file-preview-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
  width: fit-content;
  max-width: 100%;
  position: relative;
}

.file-icon {
  color: #1890ff;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.remove-file-icon {
  cursor: pointer;
  color: #ccc;
  transition: color 0.2s;
}

.remove-file-icon:hover {
  color: #ff4d4f;
}

.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-item {
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.emoji-item:hover {
  background-color: #f0f0f0;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-wrapper .n-input {
  flex: 1;
  text-align: left;
}

.input-wrapper :deep(textarea) {
  text-align: left !important;
}
</style>
