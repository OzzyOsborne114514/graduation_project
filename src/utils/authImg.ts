import { nextTick, type Directive, type DirectiveBinding } from 'vue';

/**
 * 使用指南：
 * 1. 在需要懒加载的组件中，添加v-authImg指令
 * 2. 在组件中，添加popper-class-name和popper-class，两个值必须一样，用于懒加载的class的唯一性，建议命名为整个项目唯一的标识
 */
const loadImage = (el: HTMLElement, url: string) => {
  if (!url) return;
  // ajax发请求
  const request = new XMLHttpRequest();
  request.responseType = 'blob';
  request.open('get', url, true);
  // 添加自定义请求头
  const tokenKey = 'token';
  const token = localStorage.getItem(tokenKey);
  if (token) {
    request.setRequestHeader('token', token);
  }
  
  request.onreadystatechange = () => {
    if (request.readyState === XMLHttpRequest.DONE) {
      if (request.status === 200) {
        const u = URL.createObjectURL(request.response);
        // 填充图片
        const img = el instanceof HTMLImageElement ? el : el.querySelector('img');
        if (img) {
          img.src = u;
          img.onload = () => {
            URL.revokeObjectURL(u);
          };
        } else {
          el.style.backgroundImage = `url(${u})`;
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
          el.style.backgroundRepeat = 'no-repeat';
          // 对于背景图，如果不需要立即撤销，可以考虑在下一次加载前或组件卸载时处理
          // 这里尝试使用一个简单的延迟或在下一次调用前撤销
          setTimeout(() => {
             URL.revokeObjectURL(u);
          }, 10000); // 10秒后撤销，或者根据需要调整
        }
      } else {
        console.error('Failed to load image:', request.statusText);
      }
    }
  };
  request.send(null);
};

const authImg: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    nextTick(() => {
      loadImage(el, binding.value);
    });
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string>) {
    if (binding.value !== binding.oldValue) {
      loadImage(el, binding.value);
    }
  },
  unmounted(_el: HTMLElement) {
    // Cleanup if needed
  }
};

export default authImg;
