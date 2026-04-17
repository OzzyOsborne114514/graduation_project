<template>
  <n-modal
    v-model:show="showModal"
    preset="card"
    :style="{ width: '500px' }"
    :bordered="false"
    :closable="true"
    @close="closeModal"
  >
    <template #header>
      <div class="modal-header">创建群聊</div>
    </template>

    <div class="create-form">
      <!-- 群聊头像 -->
      <div class="avatar-upload">
        <div class="avatar-preview" @click="triggerFileInput">
          <img
            v-if="previewPhoto"
            :src="previewPhoto"
            alt="群聊头像"
            class="avatar-img"
          />
          <div v-else class="avatar-placeholder">
            <n-icon size="32"><Camera24Regular /></n-icon>
            <span>上传头像</span>
          </div>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleFileChange"
        />
      </div>

      <!-- 群聊名称 -->
      <div class="form-item">
        <label class="form-label"
          >群聊名称 <span class="required">*</span></label
        >
        <n-input
          v-model:value="form.groupName"
          placeholder="请输入群聊名称"
          size="large"
        />
      </div>

      <!-- 群聊描述 -->
      <div class="form-item">
        <label class="form-label">群聊描述</label>
        <n-input
          v-model:value="form.groupContent"
          type="textarea"
          placeholder="请输入群聊描述"
          :rows="3"
        />
      </div>

      <!-- 添加成员 -->
      <div class="form-item">
        <label class="form-label">添加成员</label>
        <div class="member-input-wrapper">
          <n-input
            v-model:value="memberInput"
            placeholder="输入用户ID，按回车添加"
            @keyup.enter="addMember"
          />
          <n-button type="primary" color="#5b8ff9" @click="addMember">
            添加
          </n-button>
        </div>
        <div v-if="form.userIdList.length > 0" class="member-list">
          <n-tag
            v-for="(userId, index) in form.userIdList"
            :key="index"
            closable
            @close="removeMember(index)"
          >
            {{ userId }}
          </n-tag>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="form-actions">
        <n-button size="large" @click="closeModal">取消</n-button>
        <n-button
          type="primary"
          color="#5b8ff9"
          size="large"
          :loading="isSubmitting"
          :disabled="!form.groupName"
          @click="handleSubmit"
        >
          创建群聊
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { NModal, NInput, NButton, NIcon, NTag, useMessage } from "naive-ui";
import { Camera24Regular } from "@vicons/fluent";
import { createGroupApi } from "@/api/group/group";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const message = useMessage();

const showModal = ref(props.modelValue);
const isSubmitting = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const previewPhoto = ref("");
const photoFile = ref<File | null>(null);
const memberInput = ref("");

const form = ref({
  groupName: "",
  groupContent: "",
  userIdList: [] as string[],
});

watch(
  () => props.modelValue,
  (val) => {
    showModal.value = val;
    if (val) {
      // 重置表单
      form.value = {
        groupName: "",
        groupContent: "",
        userIdList: [],
      };
      previewPhoto.value = "";
      photoFile.value = null;
      memberInput.value = "";
    }
  },
);

watch(showModal, (val) => {
  emit("update:modelValue", val);
});

const closeModal = () => {
  showModal.value = false;
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    photoFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewPhoto.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const addMember = () => {
  const userId = memberInput.value.trim();
  if (!userId) {
    message.warning("请输入用户ID");
    return;
  }
  if (form.value.userIdList.includes(userId)) {
    message.warning("该用户已添加");
    return;
  }
  form.value.userIdList.push(userId);
  memberInput.value = "";
};

const removeMember = (index: number) => {
  form.value.userIdList.splice(index, 1);
};

const handleSubmit = async () => {
  if (!form.value.groupName.trim()) {
    message.warning("请输入群聊名称");
    return;
  }

  isSubmitting.value = true;
  try {
    // 构建 FormData，参考注册用户接口的格式
    const formData = new FormData();

    // 添加 dto 字段（JSON 格式）
    const dto = {
      groupName: form.value.groupName.trim(),
      groupContent: form.value.groupContent.trim() || undefined,
      userIdList: form.value.userIdList,
    };
    formData.append(
      "dto",
      new Blob([JSON.stringify(dto)], { type: "application/json" }),
    );

    // 添加 photo 字段（文件）
    if (photoFile.value) {
      formData.append("photo", photoFile.value);
    }

    await createGroupApi(formData as any);
    message.success("群聊创建成功");
    emit("success");
    closeModal();
  } catch (error: any) {
    message.error(error.message || "创建失败");
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.modal-header {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.create-form {
  padding: 8px 0;
}

.avatar-upload {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: background-color 0.2s;
}

.avatar-preview:hover {
  background-color: #e8e8e8;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 12px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.required {
  color: #ff4d4f;
}

.member-input-wrapper {
  display: flex;
  gap: 8px;
}

.member-list {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}
</style>
