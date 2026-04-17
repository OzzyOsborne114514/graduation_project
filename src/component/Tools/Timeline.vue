<template>
  <div class="timeline-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <n-button size="small" @click="addEvent">
          <template #icon>
            <n-icon><Add24Regular /></n-icon>
          </template>
          添加事件
        </n-button>
        <n-button size="small" @click="toggleDirection">
          <template #icon>
            <n-icon><ArrowSwap24Regular /></n-icon>
          </template>
          {{ isHorizontal ? "垂直布局" : "水平布局" }}
        </n-button>
      </div>
      <div class="toolbar-right">
        <n-button size="small" type="primary" @click="exportImage">
          <template #icon>
            <n-icon><Save24Regular /></n-icon>
          </template>
          导出图片
        </n-button>
        <n-button size="small" type="error" ghost @click="clearTimeline">
          <template #icon>
            <n-icon><Delete24Regular /></n-icon>
          </template>
          清空
        </n-button>
      </div>
    </div>
    <!-- 画布 -->
    <div ref="graphContainer" class="graph-container"></div>
    <!-- 事件编辑弹窗 -->
    <n-modal
      v-model:show="showModal"
      title="编辑事件"
      preset="dialog"
      positive-text="保存"
      negative-text="取消"
      @positive-click="saveEvent"
      @negative-click="cancelEdit"
    >
      <n-form>
        <n-form-item label="时间">
          <n-input
            v-model:value="editingEvent.time"
            placeholder="例如：2024年1月"
          />
        </n-form-item>
        <n-form-item label="标题">
          <n-input v-model:value="editingEvent.title" placeholder="事件标题" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input
            v-model:value="editingEvent.description"
            type="textarea"
            placeholder="事件描述"
          />
        </n-form-item>
        <n-form-item label="颜色">
          <n-color-picker v-model:value="editingEvent.color" />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
  NButton,
  NIcon,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NColorPicker,
  useMessage,
  useDialog,
} from "naive-ui";
import {
  Add24Regular,
  ArrowSwap24Regular,
  Save24Regular,
  Delete24Regular,
} from "@vicons/fluent";
import { Graph } from "@antv/x6";
import html2canvas from "html2canvas";

const message = useMessage();
const dialog = useDialog();
const graphContainer = ref<HTMLElement | null>(null);
let graph: Graph | null = null;

const isHorizontal = ref(true);
const showModal = ref(false);
const editingEvent = ref({
  id: "",
  time: "",
  title: "",
  description: "",
  color: "#5b8ff9",
});
const isEditing = ref(false);

// 示例数据
const timelineEvents = ref([
  {
    id: "1",
    time: "2024年1月",
    title: "项目启动",
    description: "项目正式启动，组建团队",
    color: "#52c41a",
  },
  {
    id: "2",
    time: "2024年3月",
    title: "需求分析",
    description: "完成需求调研和分析",
    color: "#5b8ff9",
  },
  {
    id: "3",
    time: "2024年6月",
    title: "开发阶段",
    description: "进入核心功能开发",
    color: "#faad14",
  },
  {
    id: "4",
    time: "2024年9月",
    title: "测试上线",
    description: "系统测试并正式上线",
    color: "#ff4d4f",
  },
]);

// 初始化画布
const initGraph = (shouldRender = true) => {
  if (!graphContainer.value) return;

  graph = new Graph({
    container: graphContainer.value,
    width: graphContainer.value.clientWidth,
    height: graphContainer.value.clientHeight,
    grid: {
      visible: true,
      type: "dot",
      size: 10,
    },
    background: {
      color: "#f5f5f5",
    },
    panning: {
      enabled: true,
    },
    mousewheel: {
      enabled: true,
      modifiers: ["ctrl", "meta"],
    },
    interacting: {
      nodeMovable: false,
    },
  });

  // 监听画布上的双击事件
  graph.on("node:dblclick", ({ node }) => {
    const nodeId = node.id;
    const eventId =
      nodeId.startsWith("time-") ||
      nodeId.startsWith("title-") ||
      nodeId.startsWith("desc-")
        ? nodeId.split("-")[1]
        : nodeId;
    const event = timelineEvents.value.find((e) => e.id === eventId);
    if (event) {
      editingEvent.value = { ...event };
      isEditing.value = true;
      showModal.value = true;
    }
  });

  // 监听画布上的右键事件
  graph.on("node:contextmenu", ({ e, node }) => {
    e.preventDefault();
    const nodeId = node.id;
    const eventId =
      nodeId.startsWith("time-") ||
      nodeId.startsWith("title-") ||
      nodeId.startsWith("desc-")
        ? nodeId.split("-")[1]
        : nodeId;
    const event = timelineEvents.value.find((e) => e.id === eventId);
    if (event) {
      dialog.warning({
        title: "确认删除",
        content: `确定要删除事件 "${event.title}" 吗？`,
        positiveText: "删除",
        negativeText: "取消",
        onPositiveClick: () => {
          const index = timelineEvents.value.findIndex((e) => e.id === eventId);
          if (index > -1) {
            timelineEvents.value.splice(index, 1);
            renderTimeline();
            message.success("事件已删除");
          }
        },
      });
    }
  });

  window.addEventListener("resize", handleResize);
  if (shouldRender) {
    renderTimeline();
  }
};

// 处理窗口大小变化
const handleResize = () => {
  if (graph && graphContainer.value) {
    graph.resize(
      graphContainer.value.clientWidth,
      graphContainer.value.clientHeight,
    );
    renderTimeline();
  }
};

// 渲染时间轴
const renderTimeline = () => {
  if (!graph) return;

  // 销毁旧画布并重新初始化（不自动渲染）
  graph.dispose();
  initGraph(false);

  const events = timelineEvents.value;
  if (events.length === 0) return;

  const startX = 100;
  const startY = 200;
  const spacing = isHorizontal.value ? 250 : 200;

  // 绘制主轴线
  const axisLength = (events.length - 1) * spacing + 100;
  if (isHorizontal.value) {
    graph.addEdge({
      source: { x: startX - 50, y: startY },
      target: { x: startX + axisLength, y: startY },
      attrs: {
        line: {
          stroke: "#333",
          strokeWidth: 3,
          targetMarker: {
            name: "classic",
            size: 10,
          },
        },
      },
    });
  } else {
    graph.addEdge({
      source: { x: startX, y: startY - 50 },
      target: { x: startX, y: startY + axisLength },
      attrs: {
        line: {
          stroke: "#333",
          strokeWidth: 3,
          targetMarker: {
            name: "classic",
            size: 10,
          },
        },
      },
    });
  }

  // 绘制事件节点
  events.forEach((event, index) => {
    const x = isHorizontal.value ? startX + index * spacing : startX;
    const y = isHorizontal.value ? startY : startY + index * spacing;

    // 节点圆点
    const node = graph!.addNode({
      id: event.id,
      shape: "circle",
      x: x - 10,
      y: y - 10,
      width: 20,
      height: 20,
      attrs: {
        body: {
          fill: event.color,
          stroke: "#fff",
          strokeWidth: 3,
          cursor: "pointer",
        },
      },
    });

    // 时间标签（带背景和文字）
    const timeNode = graph!.addNode({
      id: `time-${event.id}`,
      shape: "rect",
      x: isHorizontal.value ? x - 50 : x + 30,
      y: isHorizontal.value ? y - 60 : y - 10,
      width: 100,
      height: 30,
      attrs: {
        body: {
          fill: "transparent",
          stroke: "transparent",
          cursor: "pointer",
        },
        label: {
          text: event.time,
          fill: "#666",
          fontSize: 12,
          fontWeight: "bold",
        },
      },
    });

    // 标题（带背景和文字）
    const titleNode = graph!.addNode({
      id: `title-${event.id}`,
      shape: "rect",
      x: isHorizontal.value ? x - 60 : x + 30,
      y: isHorizontal.value ? y + 30 : y + 20,
      width: 120,
      height: 30,
      attrs: {
        body: {
          fill: "transparent",
          stroke: "transparent",
          cursor: "pointer",
        },
        label: {
          text: event.title,
          fill: "#333",
          fontSize: 14,
          fontWeight: "bold",
        },
      },
    });

    // 描述（带背景和文字）
    let descNode;
    if (event.description) {
      descNode = graph!.addNode({
        id: `desc-${event.id}`,
        shape: "rect",
        x: isHorizontal.value ? x - 70 : x + 30,
        y: isHorizontal.value ? y + 55 : y + 45,
        width: 140,
        height: 60,
        attrs: {
          body: {
            fill: "transparent",
            stroke: "transparent",
            cursor: "pointer",
          },
          label: {
            text: event.description,
            fill: "#999",
            fontSize: 12,
          },
        },
      });
    }

    // 打开编辑弹窗
    const openEditModal = () => {
      editingEvent.value = { ...event };
      isEditing.value = true;
      showModal.value = true;
    };

    // 删除当前事件
    const deleteCurrentEvent = () => {
      const index = timelineEvents.value.findIndex((e) => e.id === event.id);
      if (index > -1) {
        timelineEvents.value.splice(index, 1);
        renderTimeline();
        message.success("事件已删除");
      }
    };

    // 绑定双击编辑事件
    timeNode.on("dblclick", openEditModal);
    titleNode.on("dblclick", openEditModal);
    if (descNode) descNode.on("dblclick", openEditModal);
    node.on("dblclick", openEditModal);

    // 绑定右键删除事件
    timeNode.on("contextmenu", (e: any) => {
      e.e.preventDefault();
      deleteCurrentEvent();
    });
    titleNode.on("contextmenu", (e: any) => {
      e.e.preventDefault();
      deleteCurrentEvent();
    });
    if (descNode) {
      descNode.on("contextmenu", (e: any) => {
        e.e.preventDefault();
        deleteCurrentEvent();
      });
    }
    node.on("contextmenu", (e: any) => {
      e.e.preventDefault();
      deleteCurrentEvent();
    });

    // 悬停效果
    timeNode.on("mouseenter", () => {
      timeNode.attr("body/fill", "#e6f7ff");
    });
    timeNode.on("mouseleave", () => {
      timeNode.attr("body/fill", "transparent");
    });

    titleNode.on("mouseenter", () => {
      titleNode.attr("body/fill", "#e6f7ff");
    });
    titleNode.on("mouseleave", () => {
      titleNode.attr("body/fill", "transparent");
    });

    if (descNode) {
      descNode.on("mouseenter", () => {
        descNode!.attr("body/fill", "#e6f7ff");
      });
      descNode.on("mouseleave", () => {
        descNode!.attr("body/fill", "transparent");
      });
    }
  });
};

// 添加事件
const addEvent = () => {
  editingEvent.value = {
    id: `event-${Date.now()}`,
    time: "",
    title: "",
    description: "",
    color: "#5b8ff9",
  };
  isEditing.value = false;
  showModal.value = true;
};

// 保存事件
const saveEvent = () => {
  if (!editingEvent.value.time || !editingEvent.value.title) {
    message.warning("请填写时间和标题");
    return false;
  }

  if (isEditing.value) {
    const index = timelineEvents.value.findIndex(
      (e) => e.id === editingEvent.value.id,
    );
    if (index > -1) {
      timelineEvents.value[index] = { ...editingEvent.value };
    }
  } else {
    timelineEvents.value.push({ ...editingEvent.value });
  }

  renderTimeline();
  message.success(isEditing.value ? "事件已更新" : "事件已添加");
  return true;
};

// 取消编辑
const cancelEdit = () => {
  showModal.value = false;
};

// 切换方向
const toggleDirection = () => {
  isHorizontal.value = !isHorizontal.value;
  renderTimeline();
};

// 导出图片
const exportImage = async () => {
  if (!graphContainer.value) return;

  try {
    const canvas = await html2canvas(graphContainer.value, {
      backgroundColor: "#f5f5f5",
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });
    const dataUri = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `时间轴.png`;
    link.href = dataUri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("图片导出成功");
  } catch (error) {
    console.error("导出失败:", error);
    message.error("导出失败");
  }
};

// 清空时间轴
const clearTimeline = () => {
  timelineEvents.value = [];
  if (graph) {
    graph.dispose();
    initGraph(false);
  }
  message.success("时间轴已清空");
};

onMounted(() => {
  initGraph();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  graph?.dispose();
});
</script>

<style scoped>
.timeline-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #fff;
}

.toolbar {
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

.graph-container {
  flex: 1;
  overflow: hidden;
}
</style>
