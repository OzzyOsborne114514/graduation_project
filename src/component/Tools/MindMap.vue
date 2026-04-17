<template>
  <div class="mindmap-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <n-button size="small" @click="addChildNode">
          <template #icon>
            <n-icon><Add24Regular /></n-icon>
          </template>
          添加子节点
        </n-button>
        <n-button size="small" @click="addSiblingNode">
          <template #icon>
            <n-icon><AddCircle24Regular /></n-icon>
          </template>
          添加兄弟节点
        </n-button>
        <n-button size="small" type="error" ghost @click="deleteNode">
          <template #icon>
            <n-icon><Delete24Regular /></n-icon>
          </template>
          删除节点
        </n-button>
      </div>
      <div class="toolbar-right">
        <n-button size="small" type="primary" @click="exportImage">
          <template #icon>
            <n-icon><Save24Regular /></n-icon>
          </template>
          导出图片
        </n-button>
        <n-button size="small" @click="resetLayout">
          <template #icon>
            <n-icon><ArrowReset24Regular /></n-icon>
          </template>
          重置布局
        </n-button>
      </div>
    </div>
    <!-- 画布 -->
    <div ref="graphContainer" class="graph-container"></div>
    <!-- 节点编辑弹窗 -->
    <n-modal
      v-model:show="showModal"
      title="编辑节点"
      preset="dialog"
      positive-text="保存"
      negative-text="取消"
      @positive-click="saveNode"
      @negative-click="cancelEdit"
    >
      <n-form>
        <n-form-item label="节点内容">
          <n-input
            v-model:value="editingNode.text"
            placeholder="输入节点内容"
          />
        </n-form-item>
        <n-form-item label="背景颜色">
          <n-color-picker v-model:value="editingNode.color" />
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
} from "naive-ui";
import {
  Add24Regular,
  AddCircle24Regular,
  Save24Regular,
  Delete24Regular,
  ArrowReset24Regular,
} from "@vicons/fluent";
import { Graph } from "@antv/x6";
import html2canvas from "html2canvas";

const message = useMessage();
const graphContainer = ref<HTMLElement | null>(null);
let graph: Graph | null = null;

// 节点数据
interface MindNode {
  id: string;
  text: string;
  color: string;
  parentId: string | null;
  x: number;
  y: number;
  level: number;
}

const nodes = ref<MindNode[]>([
  {
    id: "root",
    text: "中心主题",
    color: "#ff6b6b",
    parentId: null,
    x: 80,
    y: 300,
    level: 0,
  },
  {
    id: "node-1",
    text: "分支 1",
    color: "#4ecdc4",
    parentId: "root",
    x: 280,
    y: 200,
    level: 1,
  },
  {
    id: "node-2",
    text: "分支 2",
    color: "#45b7d1",
    parentId: "root",
    x: 280,
    y: 400,
    level: 1,
  },
  {
    id: "node-3",
    text: "子分支 1-1",
    color: "#96ceb4",
    parentId: "node-1",
    x: 480,
    y: 150,
    level: 2,
  },
  {
    id: "node-4",
    text: "子分支 1-2",
    color: "#96ceb4",
    parentId: "node-1",
    x: 480,
    y: 250,
    level: 2,
  },
  {
    id: "node-5",
    text: "子分支 2-1",
    color: "#feca57",
    parentId: "node-2",
    x: 480,
    y: 450,
    level: 2,
  },
]);

const selectedNodeId = ref<string | null>(null);
const showModal = ref(false);
const editingNode = ref({
  id: "",
  text: "",
  color: "#5b8ff9",
});

// 颜色选项
const colorOptions = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#feca57",
  "#ff9ff3",
  "#54a0ff",
];

// 初始化画布
const initGraph = () => {
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
    connecting: {
      router: "manhattan",
      connector: "rounded",
      anchor: "center",
      connectionPoint: "anchor",
      allowBlank: false,
      createEdge() {
        return graph!.createEdge({
          attrs: {
            line: {
              stroke: "#999",
              strokeWidth: 2,
              targetMarker: {
                name: "classic",
                size: 6,
              },
            },
          },
        });
      },
    },
    panning: {
      enabled: true,
    },
    mousewheel: {
      enabled: true,
      modifiers: ["ctrl", "meta"],
    },
    selecting: {
      enabled: true,
      multiple: false,
    },
    interacting: {
      nodeMovable: true,
    },
  });

  // 监听节点选择
  graph.on("node:click", ({ node }) => {
    selectedNodeId.value = node.id;
    // 清除其他节点的选中状态
    nodes.value.forEach((n) => {
      const graphNode = graph!.getCellById(n.id);
      if (graphNode) {
        graphNode.attr(
          "body/stroke",
          n.id === node.id ? "#333" : "transparent",
        );
        graphNode.attr("body/strokeWidth", n.id === node.id ? 3 : 0);
      }
    });
  });

  // 监听节点移动，更新位置数据
  graph.on("node:moved", ({ node }) => {
    const nodeData = nodes.value.find((n) => n.id === node.id);
    if (nodeData) {
      const position = node.getPosition();
      nodeData.x = position.x;
      nodeData.y = position.y;
    }
  });

  // 双击编辑
  graph.on("node:dblclick", ({ node }) => {
    const nodeData = nodes.value.find((n) => n.id === node.id);
    if (nodeData) {
      editingNode.value = {
        id: nodeData.id,
        text: nodeData.text,
        color: nodeData.color,
      };
      showModal.value = true;
    }
  });

  window.addEventListener("resize", handleResize);
  // 初始渲染，不重新计算布局，使用默认位置
  renderMindMap(false);
};

// 处理窗口大小变化
const handleResize = () => {
  if (graph && graphContainer.value) {
    graph.resize(
      graphContainer.value.clientWidth,
      graphContainer.value.clientHeight,
    );
  }
};

// 计算节点位置（简单的树形布局）
const calculateLayout = () => {
  const root = nodes.value.find((n) => n.parentId === null);
  if (!root) return;

  const levelWidth = 200;
  const nodeHeight = 60;

  // 按层级分组
  const levelMap = new Map<number, MindNode[]>();
  nodes.value.forEach((node) => {
    if (!levelMap.has(node.level)) {
      levelMap.set(node.level, []);
    }
    levelMap.get(node.level)!.push(node);
  });

  // 计算位置
  const containerWidth = graphContainer.value?.clientWidth || 800;
  const containerHeight = graphContainer.value?.clientHeight || 600;

  // 根节点居中
  root.x = containerWidth / 2 - 60;
  root.y = containerHeight / 2 - 20;

  // 计算子节点位置
  const calculateChildrenPosition = (parentNode: MindNode, startY: number) => {
    const children = nodes.value.filter((n) => n.parentId === parentNode.id);
    if (children.length === 0) return startY;

    const totalHeight =
      children.length * nodeHeight + (children.length - 1) * 20;
    let currentY = parentNode.y - totalHeight / 2 + nodeHeight / 2;

    children.forEach((child, index) => {
      child.x =
        parentNode.x + (child.level % 2 === 1 ? levelWidth : -levelWidth);
      child.y = currentY;
      currentY = calculateChildrenPosition(child, currentY + nodeHeight + 20);
    });

    return currentY;
  };

  calculateChildrenPosition(root, root.y);
};

// 添加单个节点到画布
const addNodeToGraph = (node: MindNode) => {
  if (!graph) return;

  const isSelected = node.id === selectedNodeId.value;
  graph.addNode({
    id: node.id,
    shape: "rect",
    x: node.x,
    y: node.y,
    width: 120,
    height: 40,
    attrs: {
      body: {
        fill: node.color,
        stroke: isSelected ? "#333" : "transparent",
        strokeWidth: isSelected ? 3 : 0,
        rx: 20,
        ry: 20,
        cursor: "pointer",
      },
      label: {
        text: node.text,
        fill: "#fff",
        fontSize: 13,
        fontWeight: "bold",
      },
    },
  });
};

// 添加单个连线到画布
const addEdgeToGraph = (node: MindNode) => {
  if (!graph || !node.parentId) return;

  graph.addEdge({
    source: node.parentId,
    target: node.id,
    attrs: {
      line: {
        stroke: "#999",
        strokeWidth: 2,
        targetMarker: {
          name: "classic",
          size: 6,
        },
      },
    },
  });
};

// 渲染思维导图
const renderMindMap = (recalculate = true) => {
  if (!graph) return;

  graph.clearCells();
  if (recalculate) {
    calculateLayout();
  }

  // 渲染节点
  nodes.value.forEach((node) => {
    const isSelected = node.id === selectedNodeId.value;
    const graphNode = graph!.addNode({
      id: node.id,
      shape: "rect",
      x: node.x,
      y: node.y,
      width: 120,
      height: 40,
      attrs: {
        body: {
          fill: node.color,
          stroke: isSelected ? "#333" : "transparent",
          strokeWidth: isSelected ? 3 : 0,
          rx: 20,
          ry: 20,
          cursor: "pointer",
        },
        label: {
          text: node.text,
          fill: "#fff",
          fontSize: 13,
          fontWeight: "bold",
        },
      },
    });
  });

  // 渲染连线
  nodes.value.forEach((node) => {
    if (node.parentId) {
      graph!.addEdge({
        source: node.parentId,
        target: node.id,
        attrs: {
          line: {
            stroke: "#999",
            strokeWidth: 2,
            targetMarker: {
              name: "classic",
              size: 6,
            },
          },
        },
      });
    }
  });
};

// 添加子节点
const addChildNode = () => {
  if (!selectedNodeId.value) {
    message.warning("请先选择一个节点");
    return;
  }

  const parentNode = nodes.value.find((n) => n.id === selectedNodeId.value);
  if (!parentNode) return;

  // 计算新节点位置（在父节点右侧）
  const levelWidth = 200;
  const nodeHeight = 60;
  const children = nodes.value.filter(
    (n) => n.parentId === selectedNodeId.value,
  );
  const offsetY = ((children.length - 1) * (nodeHeight + 20)) / 2;

  const newNode: MindNode = {
    id: `node-${Date.now()}`,
    text: "新节点",
    color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
    parentId: selectedNodeId.value,
    x: parentNode.x + levelWidth,
    y: parentNode.y + offsetY,
    level: parentNode.level + 1,
  };

  nodes.value.push(newNode);

  // 只添加新节点和连线，不重新渲染整个图
  addNodeToGraph(newNode);
  addEdgeToGraph(newNode);

  message.success("子节点已添加");
};

// 添加兄弟节点
const addSiblingNode = () => {
  if (!selectedNodeId.value) {
    message.warning("请先选择一个节点");
    return;
  }

  const currentNode = nodes.value.find((n) => n.id === selectedNodeId.value);
  if (!currentNode || !currentNode.parentId) {
    message.warning("根节点不能添加兄弟节点");
    return;
  }

  const nodeHeight = 60;
  const siblings = nodes.value.filter(
    (n) => n.parentId === currentNode.parentId,
  );
  const offsetY = siblings.length * (nodeHeight + 20);

  const newNode: MindNode = {
    id: `node-${Date.now()}`,
    text: "新节点",
    color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
    parentId: currentNode.parentId,
    x: currentNode.x,
    y: currentNode.y + offsetY,
    level: currentNode.level,
  };

  nodes.value.push(newNode);

  // 只添加新节点和连线，不重新渲染整个图
  addNodeToGraph(newNode);
  addEdgeToGraph(newNode);

  message.success("兄弟节点已添加");
};

// 删除节点
const deleteNode = () => {
  if (!selectedNodeId.value) {
    message.warning("请先选择一个节点");
    return;
  }

  if (selectedNodeId.value === "root") {
    message.warning("不能删除根节点");
    return;
  }

  // 递归删除子节点
  const deleteNodeRecursive = (nodeId: string) => {
    const children = nodes.value.filter((n) => n.parentId === nodeId);
    children.forEach((child) => deleteNodeRecursive(child.id));
    const index = nodes.value.findIndex((n) => n.id === nodeId);
    if (index > -1) {
      nodes.value.splice(index, 1);
    }
  };

  deleteNodeRecursive(selectedNodeId.value);
  selectedNodeId.value = null;
  // 删除后重新渲染，但不重新计算布局
  renderMindMap(false);
  message.success("节点已删除");
};

// 保存节点
const saveNode = () => {
  if (!editingNode.value.text) {
    message.warning("请输入节点内容");
    return false;
  }

  const node = nodes.value.find((n) => n.id === editingNode.value.id);
  if (node) {
    node.text = editingNode.value.text;
    node.color = editingNode.value.color;
    // 更新节点外观，不重新渲染整个图
    const graphNode = graph!.getCellById(node.id);
    if (graphNode) {
      graphNode.attr("body/fill", node.color);
      graphNode.attr("label/text", node.text);
    }
    message.success("节点已更新");
  }
  return true;
};

// 取消编辑
const cancelEdit = () => {
  showModal.value = false;
};

// 重置布局
const resetLayout = () => {
  nodes.value = [
    {
      id: "root",
      text: "中心主题",
      color: "#ff6b6b",
      parentId: null,
      x: 400,
      y: 300,
      level: 0,
    },
  ];
  selectedNodeId.value = null;
  renderMindMap();
  message.success("布局已重置");
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
    link.download = `思维导图.png`;
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

onMounted(() => {
  initGraph();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  graph?.dispose();
});
</script>

<style scoped>
.mindmap-container {
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
