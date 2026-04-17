<template>
  <div class="er-diagram-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <n-button size="small" @click="addTable">
          <template #icon>
            <n-icon><Add24Regular /></n-icon>
          </template>
          添加表
        </n-button>
        <n-button size="small" @click="showRelationModal = true">
          <template #icon>
            <n-icon><Link24Regular /></n-icon>
          </template>
          添加关系
        </n-button>
      </div>
      <div class="toolbar-right">
        <n-button size="small" type="primary" @click="exportImage">
          <template #icon>
            <n-icon><Save24Regular /></n-icon>
          </template>
          导出图片
        </n-button>
        <n-button size="small" type="error" ghost @click="clearDiagram">
          <template #icon>
            <n-icon><Delete24Regular /></n-icon>
          </template>
          清空
        </n-button>
      </div>
    </div>
    <!-- 画布 -->
    <div ref="graphContainer" class="graph-container"></div>
    <!-- 表编辑弹窗 -->
    <n-modal
      v-model:show="showTableModal"
      title="编辑表"
      preset="dialog"
      positive-text="保存"
      negative-text="取消"
      @positive-click="saveTable"
      @negative-click="cancelTableEdit"
    >
      <n-form>
        <n-form-item label="表名">
          <n-input
            v-model:value="editingTable.name"
            placeholder="例如：users"
          />
        </n-form-item>
        <n-form-item label="字段 (每行一个，格式: 字段名 类型 约束)">
          <n-input
            v-model:value="editingTable.fields"
            type="textarea"
            :rows="6"
            placeholder="id INT PRIMARY KEY&#10;name VARCHAR(100) NOT NULL&#10;email VARCHAR(100) UNIQUE"
          />
        </n-form-item>
      </n-form>
    </n-modal>
    <!-- 关系编辑弹窗 -->
    <n-modal
      v-model:show="showRelationModal"
      title="添加关系"
      preset="dialog"
      positive-text="添加"
      negative-text="取消"
      @positive-click="addRelation"
      @negative-click="showRelationModal = false"
    >
      <n-form>
        <n-form-item label="源表">
          <n-select
            v-model:value="newRelation.source"
            :options="tableOptions"
            placeholder="选择源表"
          />
        </n-form-item>
        <n-form-item label="目标表">
          <n-select
            v-model:value="newRelation.target"
            :options="tableOptions"
            placeholder="选择目标表"
          />
        </n-form-item>
        <n-form-item label="关系类型">
          <n-select
            v-model:value="newRelation.type"
            :options="relationTypeOptions"
            placeholder="选择关系类型"
          />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import {
  NButton,
  NIcon,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  useMessage,
} from "naive-ui";
import {
  Add24Regular,
  Link24Regular,
  Save24Regular,
  Delete24Regular,
} from "@vicons/fluent";
import { Graph, Edge, Node } from "@antv/x6";

const message = useMessage();
const graphContainer = ref<HTMLElement | null>(null);
let graph: Graph | null = null;

// 表数据相关类型
interface TableField {
  name: string;
  type: string;
  keyType?: "primary" | "foreign" | "unique";
  ref?: { table: string; field: string };
  defaultValue?: string;
}

interface Table {
  id: string;
  name: string;
  fields: TableField[];
  x: number;
  y: number;
}

const tables = ref<Table[]>([
  {
    id: "table-1",
    name: "users",
    fields: [
      { name: "id", type: "INT", keyType: "primary" },
      { name: "username", type: "VARCHAR(50)", keyType: "unique" },
      { name: "email", type: "VARCHAR(100)" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
    x: 100,
    y: 100,
  },
  {
    id: "table-2",
    name: "orders",
    fields: [
      { name: "id", type: "INT", keyType: "primary" },
      {
        name: "user_id",
        type: "INT",
        keyType: "foreign",
        ref: { table: "table-1", field: "id" },
      },
      { name: "total", type: "DECIMAL(10,2)" },
      { name: "status", type: "VARCHAR(20)" },
    ],
    x: 450,
    y: 100,
  },
]);

// 关系数据
interface Relation {
  id: string;
  source: string;
  target: string;
  type: "1:1" | "1:N" | "N:N";
}

const relations = ref<Relation[]>([
  { id: "rel-1", source: "table-1", target: "table-2", type: "1:N" },
]);

// 弹窗控制
const showTableModal = ref(false);
const showRelationModal = ref(false);

const editingTable = ref({
  id: "",
  name: "",
  fields: "",
  x: 100,
  y: 100,
});
const isEditingTable = ref(false);

const newRelation = ref({
  source: "",
  target: "",
  type: "one-to-many" as const,
});

const relationTypeOptions = [
  { label: "1:1", value: "1:1" },
  { label: "1:N", value: "1:N" },
  { label: "N:N", value: "N:N" },
];

const tableOptions = computed(() =>
  tables.value.map((t) => ({ label: t.name, value: t.id })),
);

// 图标映射
const ICONS: Record<string, string> = {
  primary: "🔑",
  foreign: "🔗",
  unique: "⭐",
};

// 注册自定义元素
const registerElements = () => {
  // 注册自定义边
  if (!Edge.registry.exist("er-relationship")) {
    Graph.registerEdge("er-relationship", {
      inherit: "edge",
      attrs: {
        line: {
          stroke: "#666",
          strokeWidth: 2,
          targetMarker: { name: "classic", size: 8 },
        },
      },
      labels: [
        {
          attrs: {
            text: {
              text: "1:N",
              fill: "#666",
              fontSize: 12,
              fontWeight: "bold",
            },
            rect: { fill: "#fff", stroke: "#666", rx: 3, ry: 3 },
          },
        },
      ],
    });
  }

  // 注册自定义节点
  if (!Node.registry.exist("er-table")) {
    Graph.registerNode("er-table", {
      inherit: "html",
      width: 240,
      height: 300,
      html(node: Node) {
        const data = node.getData() as Table;
        const container = document.createElement("div");
        container.className = "er-table";
        container.style.width = "100%";
        container.style.height = "100%";

        const header = document.createElement("div");
        header.className = "er-table-header";
        header.innerText = data.name;
        container.appendChild(header);

        const fieldsContainer = document.createElement("div");
        fieldsContainer.className = "er-table-fields";

        if (!data.fields || data.fields.length === 0) {
          const empty = document.createElement("div");
          empty.className = "er-table-empty";
          empty.innerText = "No fields";
          fieldsContainer.appendChild(empty);
        } else {
          data.fields.forEach((field, i) => {
            const fieldEl = document.createElement("div");
            fieldEl.className = `er-table-field ${
              i % 2 === 0 ? "even" : "odd"
            } ${field.keyType || ""}`;

            const iconSpan = document.createElement("span");
            iconSpan.className = "er-field-icon";
            iconSpan.innerText = field.keyType ? ICONS[field.keyType] : "";
            fieldEl.appendChild(iconSpan);

            const nameSpan = document.createElement("span");
            nameSpan.className = "er-field-name";
            nameSpan.innerText = field.name;
            fieldEl.appendChild(nameSpan);

            const typeSpan = document.createElement("span");
            typeSpan.className = "er-field-type";
            typeSpan.innerText = field.type;
            fieldEl.appendChild(typeSpan);

            fieldsContainer.appendChild(fieldEl);
          });
        }

        container.appendChild(fieldsContainer);
        return container;
      },
      ports: {
        groups: {
          top: {
            position: "top",
            attrs: {
              circle: { r: 4, magnet: true, stroke: "#1890ff", fill: "#fff" },
            },
          },
          right: {
            position: "right",
            attrs: {
              circle: { r: 4, magnet: true, stroke: "#1890ff", fill: "#fff" },
            },
          },
          bottom: {
            position: "bottom",
            attrs: {
              circle: { r: 4, magnet: true, stroke: "#1890ff", fill: "#fff" },
            },
          },
          left: {
            position: "left",
            attrs: {
              circle: { r: 4, magnet: true, stroke: "#1890ff", fill: "#fff" },
            },
          },
        },
        items: [
          { id: "top", group: "top" },
          { id: "right", group: "right" },
          { id: "bottom", group: "bottom" },
          { id: "left", group: "left" },
        ],
      },
    });
  }
};

// 初始化画布
const initGraph = () => {
  if (!graphContainer.value) return;

  registerElements();

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
      color: "#f8f9fa",
    },
    connecting: {
      snap: true,
      allowBlank: false,
      allowLoop: false,
      allowMulti: false,
      highlight: true,
      router: { name: "manhattan" },
      connector: { name: "rounded", args: { radius: 8 } },
      createEdge() {
        return graph!.createEdge({
          shape: "er-relationship",
          labels: [{ attrs: { text: { text: "1:N" } } }],
        });
      },
      validateMagnet: ({ magnet }) =>
        magnet.getAttribute("port-group") !== null,
    },
    panning: {
      enabled: true,
    },
    mousewheel: {
      enabled: true,
      modifiers: ["ctrl", "meta"],
    },
  });

  // 绑定事件
  graph.on("edge:click", ({ edge, e }) => {
    e.stopPropagation();
    const types: string[] = ["1:1", "1:N", "N:N"];
    const current = (edge.getLabels()[0]?.attrs?.text?.text as string) || "1:1";
    const next = types[(types.indexOf(current) + 1) % types.length];

    edge.setLabels([
      {
        attrs: {
          text: { text: next, fill: "#666", fontSize: 12, fontWeight: "bold" },
          rect: { fill: "#fff", stroke: "#666", rx: 3, ry: 3 },
        },
        position: 0.5,
      },
    ]);
  });

  graph.on("edge:mouseenter", ({ edge }) => {
    edge.attr("line/stroke", "#1890ff");
    edge.attr("line/strokeWidth", 3);
  });

  graph.on("edge:mouseleave", ({ edge }) => {
    edge.attr("line/stroke", "#666");
    edge.attr("line/strokeWidth", 2);
  });

  window.addEventListener("resize", handleResize);
  renderDiagram();
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

// 渲染 ER 图
const renderDiagram = () => {
  if (!graph) return;

  graph.clearCells();

  // 渲染表节点
  tables.value.forEach((table) => {
    const fieldHeight = 25;
    const headerHeight = 34;
    const padding = 10;
    const height = headerHeight + table.fields.length * fieldHeight + padding;

    const node = graph!.addNode({
      id: table.id,
      shape: "er-table",
      x: table.x,
      y: table.y,
      width: 240,
      height: Math.max(height, 60),
      data: table, // 传递数据给 HTML 渲染器
    });

    // 双击编辑
    node.on("dblclick", () => {
      editingTable.value = {
        id: table.id,
        name: table.name,
        fields: table.fields
          .map(
            (f) =>
              `${f.name} ${f.type}${
                f.keyType ? ` ${f.keyType.toUpperCase()}` : ""
              }`,
          )
          .join("\n"),
        x: table.x,
        y: table.y,
      };
      isEditingTable.value = true;
      showTableModal.value = true;
    });
  });

  // 渲染关系连线
  relations.value.forEach((rel) => {
    const sourceTable = tables.value.find((t) => t.id === rel.source);
    const targetTable = tables.value.find((t) => t.id === rel.target);

    if (sourceTable && targetTable) {
      graph!.addEdge({
        shape: "er-relationship",
        source: { cell: rel.source, port: "right" },
        target: { cell: rel.target, port: "left" },
        data: { type: rel.type },
        labels: [
          {
            attrs: {
              text: {
                text: rel.type,
                fill: "#666",
                fontSize: 12,
                fontWeight: "bold",
              },
              rect: { fill: "#fff", stroke: "#666", rx: 3, ry: 3 },
            },
            position: 0.5,
          },
        ],
      });
    }
  });
};

// 解析字段文本为 TableField 对象
const parseFields = (text: string): TableField[] => {
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.trim().split(/\s+/);
      const name = parts[0];
      const type = parts[1] || "VARCHAR(255)";
      let keyType: TableField["keyType"];

      const rest = parts.slice(2).join(" ").toUpperCase();
      if (rest.includes("PRIMARY")) keyType = "primary";
      else if (rest.includes("FOREIGN")) keyType = "foreign";
      else if (rest.includes("UNIQUE")) keyType = "unique";

      return { name, type, keyType };
    });
};

// 添加表
const addTable = () => {
  editingTable.value = {
    id: `table-${Date.now()}`,
    name: "",
    fields: "id INT PRIMARY KEY\n",
    x: 100 + Math.random() * 200,
    y: 100 + Math.random() * 100,
  };
  isEditingTable.value = false;
  showTableModal.value = true;
};

// 保存表
const saveTable = () => {
  if (!editingTable.value.name) {
    message.warning("请填写表名");
    return false;
  }

  const tableData: Table = {
    id: editingTable.value.id,
    name: editingTable.value.name,
    fields: parseFields(editingTable.value.fields),
    x: editingTable.value.x,
    y: editingTable.value.y,
  };

  if (isEditingTable.value) {
    const index = tables.value.findIndex((t) => t.id === tableData.id);
    if (index > -1) {
      tables.value[index] = tableData;
    }
  } else {
    tables.value.push(tableData);
  }

  renderDiagram();
  message.success(isEditingTable.value ? "表已更新" : "表已添加");
  return true;
};

// 取消表编辑
const cancelTableEdit = () => {
  showTableModal.value = false;
};

// 添加关系
const addRelation = () => {
  if (!newRelation.value.source || !newRelation.value.target) {
    message.warning("请选择源表和目标表");
    return false;
  }

  if (newRelation.value.source === newRelation.value.target) {
    message.warning("源表和目标表不能相同");
    return false;
  }

  relations.value.push({
    id: `rel-${Date.now()}`,
    source: newRelation.value.source,
    target: newRelation.value.target,
    type: newRelation.value.type,
  });

  renderDiagram();
  message.success("关系已添加");

  // 重置
  newRelation.value = {
    source: "",
    target: "",
    type: "one-to-many",
  };
  showRelationModal.value = false;
  return true;
};

// 导出图片
const exportImage = async () => {
  if (!graph) return;

  try {
    const dataUri = await graph.toPNG({
      padding: 20,
      backgroundColor: "#f5f5f5",
    });
    const link = document.createElement("a");
    link.download = `ERD图.png`;
    link.href = dataUri;
    link.click();
    message.success("图片导出成功");
  } catch (error) {
    message.error("导出失败");
  }
};

// 清空图表
const clearDiagram = () => {
  tables.value = [];
  relations.value = [];
  renderDiagram();
  message.success("图表已清空");
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
.er-diagram-container {
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

/* ER Table Styles from 参考.txt */
:deep(.er-table) {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border: 2px solid #5b8ff9;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  transition: all 0.3s ease;
  overflow: hidden;
}

:deep(.er-table:hover) {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

:deep(.er-table-header) {
  background: linear-gradient(135deg, #5b8ff9 0%, #3469e1 100%);
  color: white;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 13px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

:deep(.er-table-fields) {
  flex: 1;
  overflow: hidden;
}

:deep(.er-table-empty) {
  padding: 20px;
  text-align: center;
  color: #999;
  font-style: italic;
}

:deep(.er-table-field) {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 11px;
  border-bottom: 1px solid #e8e8e8;
  transition: background-color 0.2s ease;
}

:deep(.er-table-field:hover) {
  background-color: #f5f5f5;
}

:deep(.er-table-field.even) {
  background-color: #fafafa;
}

:deep(.er-table-field:last-child) {
  border-bottom: none;
}

:deep(.er-table-field.primary) {
  background-color: #e6f7ff;
}

:deep(.er-table-field.foreign) {
  background-color: #fff7e6;
}

:deep(.er-table-field.unique) {
  background-color: #f6ffed;
}

:deep(.er-field-icon) {
  margin-right: 4px;
  font-size: 10px;
}

:deep(.er-field-name) {
  flex: 1;
  font-weight: 500;
  color: #262626;
}

:deep(.er-field-type) {
  color: #666;
  font-family: "Monaco", "Menlo", monospace;
  font-size: 10px;
}

/* Port Styles */
:deep(.x6-port-body) {
  opacity: 0;
  transition: opacity 0.2s ease;
}

:deep(.x6-node:hover .x6-port-body) {
  opacity: 1;
}

:deep(.x6-port-body circle) {
  fill: #fff;
  stroke: #5b8ff9;
  stroke-width: 2;
  cursor: crosshair;
}
</style>
