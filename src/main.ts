import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { createPinia } from "pinia";
import authImg from "./utils/authImg";

const pinia = createPinia();
const app = createApp(App);

app.directive('authImg', authImg);

const debounce = (fn: any, delay: number) => {
  let timer: any = null;
  return function (this: any, ...args: any[]) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

const _ResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    callback = debounce(callback, 16);
    super(callback);
  }
};

app.use(store).use(router).use(pinia).mount("#app");
