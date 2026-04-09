<template>
  <div class="register-container">
    <!-- 动态渐变背景 -->
    <div class="background-wrapper">
      <Grainient
        color1="#36A8C4"
        color2="#BFBFC0"
        color3="#BBD6DD"
        :time-speed="2"
        :color-balance="0.0"
        :warp-strength="1.0"
        :warp-frequency="5.0"
        :warp-speed="2.0"
        :warp-amplitude="50.0"
        :blend-angle="0.0"
        :blend-softness="0.05"
        :rotation-amount="500.0"
        :noise-scale="2.0"
        :grain-amount="0"
        :grain-scale="2.0"
        :grain-animated="false"
        :contrast="1.5"
        :gamma="1.0"
        :saturation="1.0"
        :center-x="0.0"
        :center-y="0.0"
        :zoom="0.9"
      />
    </div>

    <!-- 注册表单容器 -->
    <div class="register-wrapper">
      <div
        class="register-card"
        ref="cardRef"
        @mousemove="onMouseMove"
        @mouseleave="onMouseLeave"
        :style="cardStyle"
      >
        <div class="card-content">
          <h1 class="title">知岛</h1>
          <p class="subtitle">创建账号，开启知识之旅</p>

          <n-grid :cols="1" :x-gap="0" :y-gap="20">
            <n-gi>
              <div class="form-item">
                <div class="form-label">昵称</div>
                <n-input
                  v-model:value="form.name"
                  placeholder="请输入昵称"
                  size="large"
                  clearable
                  @blur="validateName"
                />
                <div v-if="errors.name" class="error-text">
                  {{ errors.name }}
                </div>
              </div>
            </n-gi>

            <n-gi>
              <div class="form-item">
                <div class="form-label">手机号</div>
                <n-input
                  v-model:value="form.telephone"
                  placeholder="请输入手机号"
                  size="large"
                  clearable
                  @blur="validateTelephone"
                />
                <div v-if="errors.telephone" class="error-text">
                  {{ errors.telephone }}
                </div>
              </div>
            </n-gi>

            <n-gi>
              <div class="form-item">
                <div class="form-label">密码</div>
                <n-input
                  v-model:value="form.password"
                  type="password"
                  placeholder="请输入密码"
                  size="large"
                  show-password-on="mousedown"
                  @blur="validatePassword"
                />
                <div v-if="errors.password" class="error-text">
                  {{ errors.password }}
                </div>
              </div>
            </n-gi>

            <n-gi>
              <div class="form-item">
                <div class="form-label">确认密码</div>
                <n-input
                  v-model:value="form.confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  size="large"
                  show-password-on="mousedown"
                  @blur="validateConfirmPassword"
                />
                <div v-if="errors.confirmPassword" class="error-text">
                  {{ errors.confirmPassword }}
                </div>
              </div>
            </n-gi>

            <n-gi>
              <div class="form-item">
                <div class="form-label">性别</div>
                <n-radio-group v-model:value="form.gender" size="large">
                  <n-space>
                    <n-radio value="0">男</n-radio>
                    <n-radio value="1">女</n-radio>
                  </n-space>
                </n-radio-group>
              </div>
            </n-gi>

            <n-gi>
              <div class="form-item">
                <div class="form-label">头像</div>
                <div class="avatar-upload">
                  <div v-if="avatarPreview" class="avatar-preview">
                    <img :src="avatarPreview" alt="头像预览" />
                    <n-button
                      type="error"
                      size="small"
                      class="remove-avatar"
                      @click="removeAvatar"
                    >
                      删除
                    </n-button>
                  </div>
                  <n-upload
                    v-else
                    :show-file-list="false"
                    :custom-request="handleAvatarUpload"
                    accept="image/*"
                  >
                    <div class="upload-placeholder">
                      <span class="upload-icon">+</span>
                      <span class="upload-text">点击上传头像</span>
                    </div>
                  </n-upload>
                </div>
              </div>
            </n-gi>

            <n-gi>
              <n-button
                type="primary"
                size="large"
                :loading="isLoading"
                :disabled="isLoading"
                @click="onSubmit"
                block
                strong
              >
                注 册
              </n-button>
            </n-gi>
          </n-grid>

          <div class="login-link">
            已有账号？ <router-link to="/login">立即登录</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import {
  NInput,
  NButton,
  NRadio,
  NRadioGroup,
  NSpace,
  NGrid,
  NGi,
  NUpload,
  useMessage,
} from "naive-ui";
import Grainient from "../component/Grainient/Grainient.vue";
import { registerApi, RegisterParams } from "@/api/user/user";

const router = useRouter();
const message = useMessage();

const form = reactive<RegisterParams & { confirmPassword: string }>({
  name: "",
  telephone: "",
  password: "",
  confirmPassword: "",
  gender: "male",
});

const errors = reactive({
  name: "",
  telephone: "",
  password: "",
  confirmPassword: "",
});

// 头像相关
const avatarFile = ref<File | null>(null);
const avatarPreview = ref<string>("");

// 处理头像上传
const handleAvatarUpload = ({ file }: { file: any }) => {
  const actualFile = file.file as File;
  if (!actualFile) return;

  // 验证文件类型
  if (!actualFile.type.startsWith("image/")) {
    message.error("请上传图片文件");
    return;
  }

  // 验证文件大小（限制 5MB）
  if (actualFile.size > 5 * 1024 * 1024) {
    message.error("图片大小不能超过 5MB");
    return;
  }

  avatarFile.value = actualFile;

  // 生成预览
  const reader = new FileReader();
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string;
  };
  reader.readAsDataURL(actualFile);

  message.success("头像上传成功");
};

// 删除头像
const removeAvatar = () => {
  avatarFile.value = null;
  avatarPreview.value = "";
};

const isLoading = ref(false);
const cardRef = ref<HTMLElement | null>(null);

// 3D 卡片倾斜效果
const rotateX = ref(0);
const rotateY = ref(0);

const cardStyle = computed(() => ({
  transform: `perspective(1000px) rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg)`,
  transition: "transform 0.1s ease",
}));

const onMouseMove = (e: MouseEvent) => {
  if (!cardRef.value) return;
  const rect = cardRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  rotateY.value = ((x - centerX) / centerX) * 5;
  rotateX.value = ((centerY - y) / centerY) * 5;
};

const onMouseLeave = () => {
  rotateX.value = 0;
  rotateY.value = 0;
};

// 单个字段验证方法
const validateName = () => {
  if (!form.name) {
    errors.name = "请输入昵称";
  } else if (form.name.length < 2 || form.name.length > 20) {
    errors.name = "昵称长度应为 2-20 个字符";
  } else {
    errors.name = "";
  }
};

const validateTelephone = () => {
  if (!form.telephone) {
    errors.telephone = "请输入手机号";
  } else if (!/^1[3-9]\d{9}$/.test(form.telephone)) {
    errors.telephone = "请输入正确的手机号";
  } else {
    errors.telephone = "";
  }
};

const validatePassword = () => {
  if (!form.password) {
    errors.password = "请输入密码";
  } else if (form.password.length < 6 || form.password.length > 20) {
    errors.password = "密码长度应为 6-20 个字符";
  } else {
    errors.password = "";
  }
  // 如果确认密码已填写，也需要重新验证
  if (form.confirmPassword) {
    validateConfirmPassword();
  }
};

const validateConfirmPassword = () => {
  if (!form.confirmPassword) {
    errors.confirmPassword = "请再次输入密码";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "两次输入的密码不一致";
  } else {
    errors.confirmPassword = "";
  }
};

// 手动验证表单（提交时调用）
const validateForm = (): boolean => {
  validateName();
  validateTelephone();
  validatePassword();
  validateConfirmPassword();

  return (
    !errors.name &&
    !errors.telephone &&
    !errors.password &&
    !errors.confirmPassword
  );
};

const onSubmit = async () => {
  if (isLoading.value) return;

  if (!validateForm()) {
    message.error("请检查表单填写是否正确");
    return;
  }

  try {
    isLoading.value = true;
    const formData = new FormData();
    formData.append(
      "dto",
      new Blob([JSON.stringify(form)], { type: "application/json" }),
    );

    if (avatarFile.value) {
      formData.append("photo", avatarFile.value);
    }
    const res = await registerApi(formData as any);

    console.log("注册成功:", res);
    message.success("注册成功！请登录");
    router.push("/login");
  } catch (error: any) {
    console.error("注册失败:", error);
    message.error(error.message || "注册失败，请重试");
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.background-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.register-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  width: 460px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  transform-style: preserve-3d;
  will-change: transform;
}

.card-content {
  transform: translateZ(20px);
}

.title {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #36a8c4 0%, #2b8aa3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 32px;
  font-size: 14px;
}

/* 头像上传样式 */
.avatar-upload {
  display: flex;
  justify-content: center;
}

.avatar-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #36a8c4;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-avatar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 0 !important;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-preview:hover .remove-avatar {
  opacity: 1;
}

.upload-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px dashed #ccc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-placeholder:hover {
  border-color: #36a8c4;
  background: #f0f9ff;
}

.upload-icon {
  font-size: 32px;
  color: #999;
  line-height: 1;
}

.upload-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.form-item {
  margin-bottom: 4px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  text-align: left;
}

.error-text {
  color: #ed6f6f;
  font-size: 12px;
  margin-top: 4px;
  text-align: left;
}

.login-link {
  text-align: center;
  margin-top: 24px;
  color: #666;
  font-size: 14px;
}

.login-link a {
  color: #36a8c4;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.login-link a:hover {
  color: #2b8aa3;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-card {
    width: 90%;
    padding: 32px 24px;
  }

  .title {
    font-size: 28px;
  }
}

/* 按钮样式 */
:deep(.n-button--primary-type) {
  background: linear-gradient(135deg, #36a8c4 0%, #2b8aa3 100%);
  border: none;
}

:deep(.n-button--primary-type:hover) {
  background: linear-gradient(135deg, #2b8aa3 0%, #36a8c4 100%);
}
</style>
