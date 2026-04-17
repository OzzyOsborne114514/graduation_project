<template>
  <div class="flowchart-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <n-button-group>
          <n-button size="small" @click="addNode('start')">
            <template #icon>
              <n-icon><Circle24Regular /></n-icon>
            </template>
            开始
          </n-button>
          <n-button size="small" @click="addNode('process')">
            <template #icon>
              <n-icon><Square24Regular /></n-icon>
            </template>
            流程
          </n-button>
          <n-button size="small" @click="addNode('decision')">
            <template #icon>
              <n-icon><Diamond24Regular /></n-icon>
            </template>
            判断
          </n-button>
          <n-button size="small" @click="addNode('end')">
            <template #icon>
              <n-icon><Circle24Regular /></n-icon>
            </template>
            结束
          </n-button>
        </n-button-group>
      </div>
      <div class="toolbar-right">
        <n-button size="small" type="primary" @click="exportImage">
          <template #icon>
            <n-icon><Save24Regular /></n-icon>
          </template>
          导出图片
        </n-button>
        <n-button size="small" type="error" ghost @click="clearGraph">
          <template #icon>
            <n-icon><Delete24Regular /></n-icon>
          </template>
          清空
        </n-button>
      </div>
    </div>
    <!-- 画布 -->
    <div ref="graphContainer" class="graph-container"></div>
    <!-- 提示信息 -->
    <div class="tips">
      <n-tag size="small" type="info"
        >提示：拖拽节点可移动，拖拽连接点可连线</n-tag
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { NButton, NButtonGroup, NIcon, NTag, useMessage } from "naive-ui";
import {
  Circle24Regular,
  Square24Regular,
  Diamond24Regular,
  Save24Regular,
  Delete24Regular,
} from "@vicons/fluent";
import { Graph } from "@antv/x6";
import html2canvas from "html2canvas";

const message = useMessage();
const graphContainer = ref<HTMLElement | null>(null);
let graph: Graph | null = null;

// 节点计数器
let nodeCount = 0;

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
      connector: {
        name: "rounded",
        args: {
          radius: 8,
        },
      },
      anchor: "center",
      connectionPoint: "anchor",
      allowBlank: false,
      snap: {
        radius: 20,
      },
      createEdge() {
        return graph!.createEdge({
          attrs: {
            line: {
              stroke: "#5b8ff9",
              strokeWidth: 2,
              targetMarker: {
                name: "classic",
                size: 8,
              },
            },
          },
        });
      },
    },
    panning: {
      enabled: true,
      modifiers: "shift",
    },
    mousewheel: {
      enabled: true,
      modifiers: ["ctrl", "meta"],
    },
  });

  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);
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

// 添加节点
const addNode = (type: "start" | "process" | "decision" | "end") => {
  if (!graph) return;

  nodeCount++;
  const x = 100 + Math.random() * 200;
  const y = 100 + Math.random() * 100;

  let nodeConfig: any = {
    id: `node-${Date.now()}`,
    x,
    y,
    attrs: {},
  };

  switch (type) {
    case "start":
    case "end":
      nodeConfig = {
        ...nodeConfig,
        shape: "circle",
        width: 80,
        height: 80,
        attrs: {
          body: {
            fill: type === "start" ? "#52c41a" : "#ff4d4f",
            stroke: "#333",
            strokeWidth: 2,
          },
          label: {
            text: type === "start" ? "开始" : "结束",
            fill: "#fff",
            fontSize: 14,
          },
        },
        ports: {
          groups: {
            top: {
              position: "top",
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: "#5b8ff9",
                  strokeWidth: 1,
                  fill: "#fff",
                },
              },
            },
            bottom: {
              position: "bottom",
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: "#5b8ff9",
                  strokeWidth: 1,
                  fill: "#fff",
                },
              },
            },
            left: {
              position: "left",
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: "#5b8ff9",
                  strokeWidth: 1,
                  fill: "#fff",
                },
              },
            },
            right: {
              position: "right",
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: "#5b8ff9",
                  strokeWidth: 1,
                  fill: "#fff",
                },
              },
            },
          },
          items: [
            { id: "top", group: "top" },
            { id: "bottom", group: "bottom" },
            { id: "left", group: "left" },
            { id: "right", group: "right" },
          ],
        },
      };
      break;
    case "process":
      nodeConfig = {
        ...nodeConfig,
        shape: "rect",
        width: 120,
        height: 60,
        attrs: {
          body: {
            fill: "#5b8ff9",
            stroke: "#333",
            strokeWidth: 2,
            rx: 4,
            ry: 4,
          },
          label: {
            text: `流程 ${nodeCount}`,
            fill: "#fff",
            fontSize: 14,
          },
        },
        ports: {
          groups: {
            top: {
              position: "top",
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: "#5b8ff9",
                  strokeWidth: 1,
                  fill: "#fff",
                },
              },
            },
            bottom: {
              position: "bottom",
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: "#5b8ff9",
                  strokeWidth: 1,
                  fill: "#fff",
                },
              },
            },
            left: {
              position: "left",
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: "#5b8ff9",
                  strokeWidth: 1,
                  fill: "#fff",
                },
              },
            },
            right: {
              position: "right",
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: "#5b8ff9",
                  strokeWidth: 1,
                  fill: "#fff",
                },
              },
            },
          },
          items: [
            { id: "top", group: "top" },
            { id: "bottom", group: "bottom" },
            { id: "left", group: "left" },
            { id: "right", group: "right" },
          ],
        },
      };
      break;
    case "decision":
      nodeConfig = {
        ...nodeConfig,
        shape: "polygon",
        width: 100,
        height: 80,
        points: "50,0 100,40 50,80 0,40",
        attrs: {
          body: {
            fill: "#faad14",
            stroke: "#333",
            strokeWidth: 2,
          },
          label: {
            text: "判断",
            fill: "#fff",
            fontSize: 14,
          },
        },
        ports: {
          groups: {
            top: {
              position: "top",
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: "#5b8ff9",
                  strokeWidth: 1,
                  fill: "#fff",
                },
              },
            },
            bottom: {
              position: "bottom",
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: "#5b8ff9",
                  strokeWidth: 1,
                  fill: "#fff",
                },
              },
            },
            left: {
              position: "left",
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: "#5b8ff9",
                  strokeWidth: 1,
                  fill: "#fff",
                },
              },
            },
            right: {
              position: "right",
              attrs: {
                circle: {
                  r: 4,
                  magnet: true,
                  stroke: "#5b8ff9",
                  strokeWidth: 1,
                  fill: "#fff",
                },
              },
            },
          },
          items: [
            { id: "top", group: "top" },
            { id: "bottom", group: "bottom" },
            { id: "left", group: "left" },
            { id: "right", group: "right" },
          ],
        },
      };
      break;
  }

  graph.addNode(nodeConfig);
  message.success(
    `已添加${
      type === "start"
        ? "开始"
        : type === "end"
        ? "结束"
        : type === "process"
        ? "流程"
        : "判断"
    }节点`,
  );
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
    link.download = `流程图.png`;
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

// 清空画布
const clearGraph = () => {
  if (!graph) return;

  graph.clearCells();
  nodeCount = 0;
  message.success("画布已清空");
};

onMounted(() => {
  initGraph();
  // 添加示例节点
  setTimeout(() => {
    if (graph) {
      addNode("start");
    }
  }, 100);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  graph?.dispose();
});
</script>

<style scoped>
.flowchart-container {
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

.tips {
  padding: 8px 16px;
  border-top: 1px solid #e8e8e8;
  background-color: #fafafa;
  text-align: center;
}
</style>
