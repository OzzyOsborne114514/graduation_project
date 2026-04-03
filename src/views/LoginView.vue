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

          <form class="login-form" @submit.prevent="onSubmit">
            <div class="input-group">
              <input
                type="text"
                id="telephone"
                required
                v-model="form.telephone"
                autocomplete="off"
              />
              <label for="telephone">手机号</label>
              <!-- <i class="input-icon">👤</i> -->
            </div>

            <div class="input-group">
              <input
                type="password"
                id="password"
                required
                v-model="form.password"
                autocomplete="off"
              />
              <label for="password">密码</label>
              <!-- <i class="input-icon">🔒</i> -->
            </div>

            <div class="options">
              <label class="remember">
                <input type="checkbox" v-model="form.rememberMe" />
                <span>记住我</span>
              </label>
              <a href="#" class="forgot">忘记密码？</a>
            </div>

            <button type="submit" class="submit-btn" :disabled="isLoading">
              {{ isLoading ? "登录中..." : "登 录" }}
            </button>
          </form>

          <div class="register-link">还没有账号？ <a href="#">立即注册</a></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import Grainient from "../component/Grainient/Grainient.vue";
import { loginApi, LoginParams, getUserInfoApi } from "@/api/user/user";
import { useUserStore } from "@/store/userStore";

const router = useRouter();
const userStore = useUserStore();

const form = reactive<LoginParams>({
  telephone: "",
  password: "",
  rememberMe: false,
});

const isLoading = ref(false);

const cardRef = ref<HTMLElement | null>(null);
const mouseX = ref(0);
const mouseY = ref(0);
const isHovering = ref(false);

const onMouseMove = (e: MouseEvent) => {
  if (!cardRef.value) return;
  const rect = cardRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 计算旋转角度（最大倾斜 10 度）
  mouseX.value = (x / rect.width - 0.5) * 20;
  mouseY.value = (y / rect.height - 0.5) * -20;
  isHovering.value = true;
};

const onMouseLeave = () => {
  mouseX.value = 0;
  mouseY.value = 0;
  isHovering.value = false;
};

const cardStyle = computed(() => {
  if (!isHovering.value) {
    return {
      transform:
        "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      transition: "transform 0.5s ease",
    };
  }
  return {
    transform: `perspective(1000px) rotateX(${mouseY.value}deg) rotateY(${mouseX.value}deg) scale3d(1.02, 1.02, 1.02)`,
    transition: "transform 0.1s ease",
  };
});

const onSubmit = async () => {
  // 如果正在加载中，直接返回，防止重复点击
  if (isLoading.value) return;

  if (!form.telephone || !form.password) {
    alert("请输入手机号和密码");
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
      name: res.name || res.firstName, // 兼容不同的字段名
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

    // 提示并跳转（这里可以替换成你项目里的 Toast 组件）
    alert("登录成功！");
    // 获取用户信息
    const userInfo = await getUserInfoApi();
    console.log("用户信息:", userInfo);
    router.push("/home"); // 假设你的主页是 /home
  } catch (error: any) {
    // 错误已经在 axios 拦截器里打印了，这里可以做一些额外的 UI 交互
    console.error("登录失败:", error);
    alert(error.message || "登录失败，请检查账号密码");
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
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.background-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.login-wrapper {
  position: relative;
  z-index: 10;
  perspective: 1000px;
}

.login-card {
  width: 380px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
  transform-style: preserve-3d;
  will-change: transform;
}

.card-content {
  transform: translateZ(30px);
}

.title {
  margin: 0;
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  margin: 10px 0 30px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.input-group {
  position: relative;
  width: 100%;
}

.input-group input {
  width: 100%;
  padding: 16px 16px 16px 45px;
  font-size: 15px;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.input-group input:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.1),
    inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.input-group label {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 45px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0 4px;
}

.input-group input:focus ~ label,
.input-group input:valid ~ label {
  top: 0;
  left: 15px;
  font-size: 12px;
  color: #fff;
  background: rgba(181, 160, 237, 0.9);
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

/* 图标占位 */
.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  transition: color 0.3s ease;
}

.input-group input:focus ~ .input-icon {
  color: #fff;
}

.options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.remember {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.remember input {
  cursor: pointer;
}

.forgot {
  color: #fff;
  text-decoration: none;
  transition: opacity 0.3s;
}

.forgot:hover {
  opacity: 0.8;
}

.submit-btn {
  margin-top: 10px;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.submit-btn:hover {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.submit-btn:active {
  transform: translateY(0);
}

.register-link {
  margin-top: 25px;
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.register-link a {
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
