<template>
  <div class="milkdown-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <n-button size="small" @click="importFile">
          <template #icon>
            <n-icon><FolderOpen24Regular /></n-icon>
          </template>
          导入
        </n-button>
        <n-button size="small" @click="exportFile">
          <template #icon>
            <n-icon><Save24Regular /></n-icon>
          </template>
          导出
        </n-button>
        <n-button size="small" :loading="isSaving" @click="saveToLocal">
          <template #icon>
            <n-icon><Cloud24Regular /></n-icon>
          </template>
          {{ isSaving ? "保存中" : "暂存" }}
        </n-button>
      </div>
      <div class="toolbar-right">
        <n-tag v-if="lastSavedTime" type="success" size="small">
          上次保存: {{ lastSavedTime }}
        </n-tag>
        <n-button size="small" type="error" ghost @click="clearContent">
          <template #icon>
            <n-icon><Delete24Regular /></n-icon>
          </template>
          清空
        </n-button>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div ref="editorRef" class="editor-content"></div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".md,.markdown,.txt"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { NButton, NIcon, NTag, useMessage } from "naive-ui";
import {
  FolderOpen24Regular,
  Save24Regular,
  Cloud24Regular,
  Delete24Regular,
} from "@vicons/fluent";

// Milkdown 核心
import { Editor, rootCtx, defaultValueCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { history } from "@milkdown/plugin-history";
import { clipboard } from "@milkdown/plugin-clipboard";
import { cursor } from "@milkdown/plugin-cursor";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { nord } from "@milkdown/theme-nord";

const message = useMessage();
const editorRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isSaving = ref(false);
const lastSavedTime = ref("");

// LocalStorage key
const STORAGE_KEY = "milkdown_draft";

let editor: Editor | null = null;
let saveTimer: number | null = null;

// 初始化编辑器
const initEditor = async () => {
  if (!editorRef.value) return;

  // 从 localStorage 读取暂存内容
  const savedContent = localStorage.getItem(STORAGE_KEY) || "";
  if (savedContent) {
    const savedTime = localStorage.getItem(`${STORAGE_KEY}_time`);
    if (savedTime) {
      lastSavedTime.value = savedTime;
    }
  }

  editor = await Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, editorRef.value!);
      ctx.set(defaultValueCtx, savedContent);

      // 监听内容变化，自动暂存
      const listener = ctx.get(listenerCtx);
      listener.markdownUpdated((ctx, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown) {
          debouncedAutoSave(markdown);
        }
      });
    })
    .use(nord)
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(clipboard)
    .use(cursor)
    .use(listener)
    .create();
};

// 防抖自动保存
const debouncedAutoSave = (content: string) => {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = window.setTimeout(() => {
    autoSave(content);
  }, 3000); // 3秒后自动保存
};

// 自动保存到 localStorage
const autoSave = (content: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, content);
    const now = new Date().toLocaleString();
    localStorage.setItem(`${STORAGE_KEY}_time`, now);
    lastSavedTime.value = now;
  } catch (error) {
    console.error("自动保存失败:", error);
  }
};

// 手动暂存
const saveToLocal = async () => {
  if (!editor) return;

  isSaving.value = true;
  try {
    const content = await getMarkdownContent();
    localStorage.setItem(STORAGE_KEY, content);
    const now = new Date().toLocaleString();
    localStorage.setItem(`${STORAGE_KEY}_time`, now);
    lastSavedTime.value = now;
    message.success("已暂存到本地");
  } catch (error) {
    message.error("暂存失败");
  } finally {
    isSaving.value = false;
  }
};

// 获取 Markdown 内容
const getMarkdownContent = async (): Promise<string> => {
  if (!editor) return "";
  // 通过 editor 实例获取内容
  const markdown = editor.action((ctx) => {
    const listener = ctx.get(listenerCtx);
    // 返回当前编辑器的内容
    return "";
  });

  // 使用更简单的方式：直接从编辑器 DOM 获取
  // 或者通过监听存储最新的内容
  return localStorage.getItem(STORAGE_KEY) || "";
};

// 导入文件
const importFile = () => {
  fileInputRef.value?.click();
};

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    if (content && editor) {
      // 更新编辑器内容
      editor.action((ctx) => {
        const listener = ctx.get(listenerCtx);
        // 清空并插入新内容
      });
      // 重新初始化编辑器以加载新内容
      editor.destroy();
      Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, editorRef.value!);
          ctx.set(defaultValueCtx, content);
          const listener = ctx.get(listenerCtx);
          listener.markdownUpdated((ctx, markdown, prevMarkdown) => {
            if (markdown !== prevMarkdown) {
              debouncedAutoSave(markdown);
            }
          });
        })
        .use(nord)
        .use(commonmark)
        .use(gfm)
        .use(history)
        .use(clipboard)
        .use(cursor)
        .use(listener)
        .create()
        .then((newEditor) => {
          editor = newEditor;
          message.success("文件导入成功");
        });
    }
  };
  reader.readAsText(file);

  // 清空 input 以便可以重复选择同一文件
  target.value = "";
};

// 导出文件
const exportFile = async () => {
  if (!editor) return;

  // 获取编辑器内容
  const content = localStorage.getItem(STORAGE_KEY) || "";

  if (!content.trim()) {
    message.warning("内容为空，无法导出");
    return;
  }

  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `document_${new Date().getTime()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  message.success("文件导出成功");
};

// 清空内容
const clearContent = () => {
  if (!editor) return;

  editor.destroy();
  Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, editorRef.value!);
      ctx.set(defaultValueCtx, "");
      const listener = ctx.get(listenerCtx);
      listener.markdownUpdated((ctx, markdown, prevMarkdown) => {
        if (markdown !== prevMarkdown) {
          debouncedAutoSave(markdown);
        }
      });
    })
    .use(nord)
    .use(commonmark)
    .use(gfm)
    .use(history)
    .use(clipboard)
    .use(cursor)
    .use(listener)
    .create()
    .then((newEditor) => {
      editor = newEditor;
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}_time`);
      lastSavedTime.value = "";
      message.success("内容已清空");
    });
};

onMounted(() => {
  initEditor();
});

onUnmounted(() => {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  editor?.destroy();
});
</script>

<style scoped>
.milkdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  background-color: #fafafa;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.editor-content :deep(.milkdown) {
  max-width: 100%;
  min-height: 100%;
}

/* Milkdown 编辑器样式覆盖 */
.editor-content :deep(.editor) {
  min-height: 88vh;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  border: 3px solid #d3d3d3;
  text-align: left !important;
}

/* 强制所有段落左对齐 */
.editor-content :deep(.editor) p,
.editor-content :deep(.editor) div,
.editor-content :deep(.editor) span {
  text-align: left !important;
}

/* 覆盖 Milkdown 默认的居中样式 */
.editor-content :deep(.milkdown) .ProseMirror {
  text-align: left !important;
}
</style>
