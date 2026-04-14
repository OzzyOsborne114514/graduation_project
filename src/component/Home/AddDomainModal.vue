<template>
  <div class="modal-overlay" v-if="modelValue" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>创建领域</h3>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>

      <div class="modal-body"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const searchKeyword = ref("");

const closeModal = () => {
  emit("update:modelValue", false);
};

// 处理创建域点击
const handleCreateDomain = () => {
  console.log("点击了创建领域");
  // TODO: 实现创建领域逻辑
};

// 处理搜索/加入域点击
const handleSearchDomain = () => {
  if (!searchKeyword.value.trim()) {
    alert("请输入领域 ID 或邀请链接");
    return;
  }
  console.log("搜索加入领域:", searchKeyword.value);
  // TODO: 实现搜索加入领域逻辑
};
</script>

<style scoped>
/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #f2f2f2;
  width: 400px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  position: relative;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  text-align: center;
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  position: absolute;
  right: 16px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-card {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.action-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.join-card {
  flex-direction: column;
  align-items: flex-start;
  cursor: default;
}

.join-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transform: none;
}

.join-card .action-info {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.create-icon {
  background-color: #e6f7ff;
  border: 1px dashed #1890ff;
}

.join-icon {
  background-color: #e6f7ff;
}

.icon-plus-blue::before {
  content: "➕";
  color: #1890ff;
  font-size: 16px;
}

.icon-people-blue::before {
  content: "👥";
  color: #1890ff;
  font-size: 16px;
}

.icon-search-gray::before {
  content: "🔍";
  color: #999;
  font-size: 16px;
}

.action-info h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  color: #333;
}

.action-info p {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.search-input-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 12px;
  border: 1px solid #e8e8e8;
  box-sizing: border-box;
}

.search-input-wrapper input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: #333;
}

.search-input-wrapper input::placeholder {
  color: #bbb;
}

.search-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:hover .icon-search-gray::before {
  color: #666;
}
</style>
