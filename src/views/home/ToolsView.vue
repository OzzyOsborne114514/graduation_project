<template>
  <n-dialog-provider>
    <div class="tools-layout">
      <!-- 左侧工具分类侧边栏 -->
      <aside class="tools-sidebar">
        <div class="tools-header">
          <div class="tools-title">工具箱</div>
        </div>
        <div class="tools-list">
          <div v-for="tool in toolsList" :key="tool.key">
            <!-- 父工具项 -->
            <div
              class="tool-item"
              :class="{ active: activeTool === tool.key && !tool.children }"
              @click="
                tool.children ? toggleExpand(tool.key) : selectTool(tool.key)
              "
            >
              <n-icon size="24" class="tool-icon">
                <component :is="tool.icon" />
              </n-icon>
              <span class="tool-name">{{ tool.name }}</span>
              <!-- 展开/收起图标 -->
              <n-icon v-if="tool.children" size="16" class="expand-icon">
                <component
                  :is="
                    expandedTools.includes(tool.key)
                      ? ChevronDown24Regular
                      : ChevronRight24Regular
                  "
                />
              </n-icon>
            </div>
            <!-- 子工具列表 -->
            <div
              v-if="tool.children && expandedTools.includes(tool.key)"
              class="sub-tools-list"
            >
              <div
                v-for="subTool in tool.children"
                :key="subTool.key"
                class="sub-tool-item"
                :class="{ active: activeTool === subTool.key }"
                @click="selectTool(subTool.key)"
              >
                <n-icon size="20" class="sub-tool-icon">
                  <component :is="subTool.icon" />
                </n-icon>
                <span class="sub-tool-name">{{ subTool.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧主内容区 -->
      <main class="tools-main-content">
        <!-- 欢迎页面 -->
        <div v-if="!activeTool" class="tools-content">
          <div class="welcome-section">
            <n-icon size="64" class="welcome-icon">
              <Toolbox24Regular />
            </n-icon>
            <h2 class="welcome-title">欢迎使用工具箱</h2>
            <p class="welcome-desc">选择左侧工具开始使用</p>
          </div>
        </div>

        <!-- MD 编辑器 -->
        <div v-else-if="activeTool === 'markdown'" class="tool-panel">
          <MilkDown />
        </div>

        <!-- 流程图 -->
        <div v-else-if="activeTool === 'flowchart'" class="tool-panel">
          <Flowchart />
        </div>

        <!-- 时间轴 -->
        <div v-else-if="activeTool === 'timeline'" class="tool-panel">
          <Timeline />
        </div>

        <!-- ER图 -->
        <div v-else-if="activeTool === 'er-diagram'" class="tool-panel">
          <ERDiagram />
        </div>

        <!-- 思维导图 -->
        <div v-else-if="activeTool === 'mindmap'" class="tool-panel">
          <MindMap />
        </div>

        <!-- AI 对话 -->
        <div v-else-if="activeTool === 'ai-chat'" class="tool-panel">
          <div class="placeholder-content">
            <n-icon size="64" class="placeholder-icon">
              <Bot24Regular />
            </n-icon>
            <h3>AI 对话功能开发中...</h3>
          </div>
        </div>
      </main>
    </div>
  </n-dialog-provider>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { NIcon, NDialogProvider } from "naive-ui";
import {
  Toolbox24Regular,
  DocumentText24Regular,
  Flowchart24Regular,
  Bot24Regular,
  ChevronRight24Regular,
  ChevronDown24Regular,
  Organization24Regular,
  Timeline24Regular,
  Table24Regular,
  BrainCircuit24Regular,
} from "@vicons/fluent";
import MilkDown from "@/component/Tools/MilkDown.vue";
import Flowchart from "@/component/Tools/Flowchart.vue";
import Timeline from "@/component/Tools/Timeline.vue";
import ERDiagram from "@/component/Tools/ERDiagram.vue";
import MindMap from "@/component/Tools/MindMap.vue";

// 子工具类型
interface SubTool {
  key: string;
  name: string;
  icon: any;
}

// 工具类型
interface Tool {
  key: string;
  name: string;
  icon: any;
  children?: SubTool[];
}

// 工具列表
const toolsList: Tool[] = [
  {
    key: "markdown",
    name: "MD 文件",
    icon: DocumentText24Regular,
  },
  {
    key: "drawing",
    name: "绘图专区",
    icon: Flowchart24Regular,
    children: [
      { key: "flowchart", name: "流程图", icon: Organization24Regular },
      { key: "timeline", name: "时间轴", icon: Timeline24Regular },
      { key: "er-diagram", name: "ERD图", icon: Table24Regular },
      { key: "mindmap", name: "思维导图", icon: BrainCircuit24Regular },
    ],
  },
  {
    key: "ai-chat",
    name: "AI 对话",
    icon: Bot24Regular,
  },
];

// 当前选中的工具
const activeTool = ref<string | null>(null);

// 展开的父工具
const expandedTools = ref<string[]>(["drawing"]);

// 切换展开/收起
const toggleExpand = (key: string) => {
  const index = expandedTools.value.indexOf(key);
  if (index > -1) {
    expandedTools.value.splice(index, 1);
  } else {
    expandedTools.value.push(key);
  }
};

// 选择工具
const selectTool = (key: string) => {
  activeTool.value = key;
};
</script>

<style scoped>
.tools-layout {
  display: flex;
  height: 100%;
  width: 100%;
  background-color: #f5f5f5;
}

/* 左侧工具侧边栏 */
.tools-sidebar {
  width: 320px;
  background-color: #fafafa;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.tools-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.tools-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 工具列表 */
.tools-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.tool-item:hover {
  background-color: #f0f0f0;
}

.tool-item.active {
  background-color: #e6f7ff;
}

.tool-icon {
  color: #666;
  flex-shrink: 0;
}

.tool-item.active .tool-icon {
  color: #1890ff;
}

.tool-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.tool-item.active .tool-name {
  color: #1890ff;
}

/* 展开/收起图标 */
.expand-icon {
  margin-left: auto;
  color: #999;
  flex-shrink: 0;
}

/* 子工具列表 */
.sub-tools-list {
  padding-left: 16px;
  margin-bottom: 4px;
}

.sub-tool-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 2px;
}

.sub-tool-item:hover {
  background-color: #f0f0f0;
}

.sub-tool-item.active {
  background-color: #e6f7ff;
}

.sub-tool-icon {
  color: #999;
  flex-shrink: 0;
}

.sub-tool-item.active .sub-tool-icon {
  color: #1890ff;
}

.sub-tool-name {
  font-size: 13px;
  color: #666;
}

.sub-tool-item.active .sub-tool-name {
  color: #1890ff;
}

/* 右侧主内容区 */
.tools-main-content {
  flex: 1;
  overflow: auto;
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.tools-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 欢迎区域 */
.welcome-section {
  text-align: center;
  padding: 40px;
}

.welcome-icon {
  color: #5b8ff9;
  margin-bottom: 16px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.welcome-desc {
  font-size: 14px;
  color: #999;
}

/* 工具面板 */
.tool-panel {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

/* 占位内容 */
.placeholder-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.placeholder-icon {
  color: #ccc;
  margin-bottom: 16px;
}

.placeholder-content h3 {
  font-size: 16px;
  font-weight: 500;
  color: #666;
}
</style>
