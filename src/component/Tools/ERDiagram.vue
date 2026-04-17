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
import { Graph } from "@antv/x6";

const message = useMessage();
const graphContainer = ref<HTMLElement | null>(null);
let graph: Graph | null = null;

// 表数据
interface Table {
  id: string;
  name: string;
  fields: string[];
  x: number;
  y: number;
}

const tables = ref<Table[]>([
  {
    id: "table-1",
    name: "users",
    fields: [
      "id INT PK",
      "username VARCHAR(50)",
      "email VARCHAR(100)",
      "created_at TIMESTAMP",
    ],
    x: 100,
    y: 100,
  },
  {
    id: "table-2",
    name: "orders",
    fields: [
      "id INT PK",
      "user_id INT FK",
      "total DECIMAL(10,2)",
      "status VARCHAR(20)",
    ],
    x: 400,
    y: 100,
  },
]);

// 关系数据
interface Relation {
  id: string;
  source: string;
  target: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
}

const relations = ref<Relation[]>([
  { id: "rel-1", source: "table-1", target: "table-2", type: "one-to-many" },
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
  { label: "一对一", value: "one-to-one" },
  { label: "一对多", value: "one-to-many" },
  { label: "多对多", value: "many-to-many" },
];

const tableOptions = computed(() =>
  tables.value.map((t) => ({ label: t.name, value: t.id })),
);

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
      router: "orth",
      connector: "rounded",
      anchor: "center",
      connectionPoint: "anchor",
      allowBlank: false,
      createEdge() {
        return graph!.createEdge({
          attrs: {
            line: {
              stroke: "#666",
              strokeWidth: 2,
              targetMarker: {
                name: "classic",
                size: 8,
              },
            },
          },
          label: {
            attrs: {
              text: {
                text: "1:N",
                fill: "#666",
                fontSize: 12,
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
    const fieldText = table.fields.join("\n");
    const height = 40 + table.fields.length * 25;

    const node = graph!.addNode({
      id: table.id,
      shape: "rect",
      x: table.x,
      y: table.y,
      width: 180,
      height: height,
      markup: [
        {
          tagName: "rect",
          selector: "body",
        },
        {
          tagName: "rect",
          selector: "headerBg",
        },
        {
          tagName: "text",
          selector: "header",
        },
        {
          tagName: "line",
          selector: "divider",
        },
        {
          tagName: "text",
          selector: "fields",
        },
      ],
      attrs: {
        body: {
          fill: "#fff",
          stroke: "#5b8ff9",
          strokeWidth: 2,
          rx: 4,
        },
        headerBg: {
          fill: "#5b8ff9",
          width: 180,
          height: 30,
        },
        header: {
          text: table.name,
          fill: "#fff",
          fontSize: 14,
          fontWeight: "bold",
          x: 90,
          y: 20,
          textAnchor: "middle",
        },
        divider: {
          x1: 0,
          y1: 30,
          x2: 180,
          y2: 30,
          stroke: "#5b8ff9",
          strokeWidth: 1,
        },
        fields: {
          text: fieldText,
          fill: "#333",
          fontSize: 12,
          x: 10,
          y: 50,
        },
      },
    });

    // 双击编辑
    node.on("dblclick", () => {
      editingTable.value = {
        id: table.id,
        name: table.name,
        fields: table.fields.join("\n"),
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
      let labelText = "1:N";
      if (rel.type === "one-to-one") labelText = "1:1";
      if (rel.type === "many-to-many") labelText = "N:M";

      graph!.addEdge({
        source: rel.source,
        target: rel.target,
        attrs: {
          line: {
            stroke: "#666",
            strokeWidth: 2,
            targetMarker: {
              name: "classic",
              size: 8,
            },
          },
        },
        labels: [
          {
            attrs: {
              text: {
                text: labelText,
                fill: "#666",
                fontSize: 12,
              },
            },
          },
        ],
      });
    }
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
    fields: editingTable.value.fields.split("\n").filter((f) => f.trim()),
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
</style>
