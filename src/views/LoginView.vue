<template>
  <div class="login-container">
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

    <!-- 登录表单容器 -->
    <div class="login-wrapper">
      <div
        class="login-card"
        ref="cardRef"
        @mousemove="onMouseMove"
        @mouseleave="onMouseLeave"
        :style="cardStyle"
      >
        <div class="card-content">
          <h1 class="title">知岛</h1>
          <p class="subtitle">欢迎回来，探索知识的岛屿</p>

          <n-grid :cols="1" :x-gap="0" :y-gap="20">
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
              <div class="options">
                <n-checkbox v-model:checked="form.rememberMe"
                  >记住我</n-checkbox
                >
                <a href="#" class="forgot">忘记密码？</a>
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
                登 录
              </n-button>
            </n-gi>
          </n-grid>

          <div class="register-link">
            还没有账号？ <router-link to="/register">立即注册</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { NInput, NButton, NCheckbox, NGrid, NGi, useMessage } from "naive-ui";
import Grainient from "../component/Grainient/Grainient.vue";
import { loginApi, LoginParams, getUserInfoApi } from "@/api/user/user";
import { useUserStore } from "@/store/userStore";

const router = useRouter();
const message = useMessage();
const userStore = useUserStore();

const form = reactive<LoginParams & { rememberMe: boolean }>({
  telephone: "",
  password: "",
  rememberMe: false,
});

const errors = reactive({
  telephone: "",
  password: "",
});

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
};

// 手动验证表单（提交时调用）
const validateForm = (): boolean => {
  validateTelephone();
  validatePassword();
  return !errors.telephone && !errors.password;
};

const onSubmit = async () => {
  if (isLoading.value) return;

  if (!validateForm()) {
    message.error("请检查表单填写是否正确");
    return;
  }

  try {
    isLoading.value = true;
    const res = await loginApi(form);

    // 登录成功，保存 token 等信息
    console.log("登录成功:", res);

    // 使用 userStore 保存用户状态
    userStore.setUserData({
      id: res.id,
      name: res.name || res.firstName,
      token: res.token,
    });

    localStorage.setItem(
      "userInfo",
      JSON.stringify({
        id: res.id,
        firstName: res.firstName,
        lastName: res.lastName,
      }),
    );

    // 获取用户信息
    const userInfo = await getUserInfoApi();
    console.log("用户信息:", userInfo);
    message.success("登录成功！");
    router.push("/home");
  } catch (error: any) {
    console.error("登录失败:", error);
    message.error(error.message || "登录失败，请检查账号密码");
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
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

.login-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  width: 420px;
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

.options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot {
  color: #36a8c4;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.forgot:hover {
  color: #2b8aa3;
  text-decoration: underline;
}

.register-link {
  text-align: center;
  margin-top: 24px;
  color: #666;
  font-size: 14px;
}

.register-link a {
  color: #36a8c4;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.register-link a:hover {
  color: #2b8aa3;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
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
