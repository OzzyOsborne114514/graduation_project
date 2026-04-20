<template>
  <div class="whiteboard-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <n-button-group>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button
                size="small"
                :type="currentMode === 'select' ? 'primary' : 'default'"
                @click="setMode('select')"
              >
                <template #icon>
                  <n-icon><SelectObject24Regular /></n-icon>
                </template>
              </n-button>
            </template>
            选择
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button
                size="small"
                :type="currentMode === 'pencil' ? 'primary' : 'default'"
                @click="setMode('pencil')"
              >
                <template #icon>
                  <n-icon><DrawShape24Regular /></n-icon>
                </template>
              </n-button>
            </template>
            铅笔
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button
                size="small"
                :type="currentMode === 'spray' ? 'primary' : 'default'"
                @click="setMode('spray')"
              >
                <template #icon>
                  <n-icon><ColorBackground24Regular /></n-icon>
                </template>
              </n-button>
            </template>
            喷枪
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button
                size="small"
                :type="currentMode === 'dash' ? 'primary' : 'default'"
                @click="setMode('dash')"
              >
                <template #icon>
                  <n-icon><LineDashes24Regular /></n-icon>
                </template>
              </n-button>
            </template>
            虚线笔
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button
                size="small"
                :type="currentMode === 'eraser' ? 'primary' : 'default'"
                @click="setMode('eraser')"
              >
                <template #icon>
                  <n-icon><Eraser24Regular /></n-icon>
                </template>
              </n-button>
            </template>
            橡皮擦
          </n-tooltip>
        </n-button-group>

        <n-divider vertical />

        <n-button-group>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button size="small" @click="addShape('rect')">
                <template #icon>
                  <n-icon><Square24Regular /></n-icon>
                </template>
              </n-button>
            </template>
            矩形
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button size="small" @click="addShape('circle')">
                <template #icon>
                  <n-icon><Circle24Regular /></n-icon>
                </template>
              </n-button>
            </template>
            圆形
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button size="small" @click="addShape('triangle')">
                <template #icon>
                  <n-icon><Triangle12Regular /></n-icon>
                </template>
              </n-button>
            </template>
            三角形
          </n-tooltip>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button size="small" @click="addText">
                <template #icon>
                  <n-icon><TextT24Regular /></n-icon>
                </template>
              </n-button>
            </template>
            文本
          </n-tooltip>
        </n-button-group>

        <n-divider vertical />

        <!-- 颜色选择 -->
        <div class="tool-item color-tool">
          <div class="preset-colors">
            <div
              v-for="color in presetColors"
              :key="color"
              class="color-swatch"
              :style="{ backgroundColor: color }"
              :class="{ active: brushColor === color }"
              @click="setBrushColor(color)"
            ></div>
          </div>
          <div class="custom-color-picker-wrapper">
            <n-color-picker
              v-model:value="brushColor"
              :show-alpha="false"
              size="small"
              class="custom-color-picker"
              @update:value="updateBrush"
            />
            <div
              class="color-picker-mask"
              :style="{ backgroundColor: brushColor }"
            ></div>
          </div>
        </div>

        <n-divider vertical />

        <!-- 粗细选择 -->
        <div class="tool-item slider-tool">
          <n-icon size="18" class="tool-icon-small"><Line24Regular /></n-icon>
          <n-slider
            v-model:value="brushWidth"
            :min="1"
            :max="50"
            style="width: 80px"
            @update:value="updateBrush"
          />
          <span class="size-text">{{ brushWidth }}px</span>
        </div>
      </div>

      <div class="toolbar-right">
        <n-button size="small" secondary @click="undo">
          <template #icon>
            <n-icon><ArrowUndo24Regular /></n-icon>
          </template>
          撤销
        </n-button>
        <n-button size="small" secondary @click="redo">
          <template #icon>
            <n-icon><ArrowRedo24Regular /></n-icon>
          </template>
          重做
        </n-button>
        <n-button size="small" type="primary" @click="exportImage">
          <template #icon>
            <n-icon><Save24Regular /></n-icon>
          </template>
          导出图片
        </n-button>
        <n-button size="small" type="error" ghost @click="clearCanvas">
          <template #icon>
            <n-icon><Delete24Regular /></n-icon>
          </template>
          清空
        </n-button>
      </div>
    </div>

    <!-- 画布容器 -->
    <div ref="canvasWrapper" class="canvas-wrapper">
      <canvas id="whiteboard-canvas"></canvas>
    </div>

    <!-- 提示 -->
    <div class="tips">
      <n-tag size="small" type="info">
        当前模式：{{ modeName }} | 提示：按 Delete 键可删除选中元素
      </n-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import {
  NButton,
  NButtonGroup,
  NIcon,
  NTag,
  NDivider,
  NTooltip,
  NColorPicker,
  NSlider,
  useMessage,
} from "naive-ui";
import {
  DrawShape24Regular,
  ColorBackground24Regular,
  LineDashes24Regular,
  Eraser24Regular,
  SelectObject24Regular,
  Square24Regular,
  Circle24Regular,
  Triangle12Regular,
  TextT24Regular,
  Save24Regular,
  Delete24Regular,
  ArrowUndo24Regular,
  ArrowRedo24Regular,
  Line24Regular,
} from "@vicons/fluent";
import * as fabric from "fabric";

const message = useMessage();
const canvasWrapper = ref<HTMLElement | null>(null);
let canvas: fabric.Canvas | null = null;

// 状态变量
const currentMode = ref<"select" | "pencil" | "spray" | "dash" | "eraser">(
  "pencil",
);
const brushColor = ref("#18a058");
const brushWidth = ref(5);
const presetColors = ["#000000", "#ffffff", "#ff4d4f", "#1890ff"];

const setBrushColor = (color: string) => {
  brushColor.value = color;
  updateBrush();
};

const history = ref<string[]>([]);
const historyIndex = ref(-1);
let isUpdatingHistory = false;

const modeName = computed(() => {
  const modes = {
    select: "选择",
    pencil: "铅笔",
    spray: "喷枪",
    dash: "虚线笔",
    eraser: "橡皮擦",
  };
  return modes[currentMode.value];
});

// 初始化画布
const initCanvas = () => {
  if (!canvasWrapper.value) return;

  const width = canvasWrapper.value.clientWidth;
  const height = canvasWrapper.value.clientHeight;

  canvas = new fabric.Canvas("whiteboard-canvas", {
    width,
    height,
    isDrawingMode: true,
    backgroundColor: "#ffffff",
  });

  // 必须显式初始化 PencilBrush
  canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);

  // 设置默认画笔
  updateBrush();

  // 监听画布变化保存历史
  canvas.on("object:added", saveHistory);
  canvas.on("object:modified", saveHistory);
  canvas.on("object:removed", saveHistory);

  // 监听按键
  window.addEventListener("keydown", handleKeyDown);

  // 初始状态
  saveHistory();
};

// 设置模式
const setMode = (mode: "select" | "pencil" | "spray" | "dash" | "eraser") => {
  currentMode.value = mode;
  if (!canvas) return;

  if (mode === "select") {
    canvas.isDrawingMode = false;
    canvas.selection = true;
  } else if (mode === "pencil") {
    canvas.isDrawingMode = true;
    canvas.selection = false;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    updateBrush();
  } else if (mode === "spray") {
    canvas.isDrawingMode = true;
    canvas.selection = false;
    canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
    updateBrush();
  } else if (mode === "dash") {
    canvas.isDrawingMode = true;
    canvas.selection = false;
    const brush = new fabric.PencilBrush(canvas);
    // 设置虚线样式：实线长度为笔宽的 2 倍，空白长度也为笔宽的 2 倍
    brush.strokeDashArray = [brushWidth.value * 2, brushWidth.value * 2];
    canvas.freeDrawingBrush = brush;
    updateBrush();
  } else if (mode === "eraser") {
    canvas.isDrawingMode = true;
    canvas.selection = false;
    // 使用白色画笔模拟橡皮擦（如果背景是白色）
    // 或者使用 fabric.EraserBrush (如果项目中包含此插件)
    // 这里的实现采用白色画笔作为通用方案
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = "#ffffff";
    canvas.freeDrawingBrush.width = brushWidth.value;
  }
};

// 更新画笔
const updateBrush = () => {
  if (!canvas || !canvas.freeDrawingBrush) return;

  if (["pencil", "spray", "dash"].includes(currentMode.value)) {
    canvas.freeDrawingBrush.color = brushColor.value;
    canvas.freeDrawingBrush.width = brushWidth.value;
    // 当改变笔宽时，同时更新虚线笔的虚线比例
    if (
      currentMode.value === "dash" &&
      canvas.freeDrawingBrush instanceof fabric.PencilBrush
    ) {
      canvas.freeDrawingBrush.strokeDashArray = [
        brushWidth.value * 2,
        brushWidth.value * 2,
      ];
    }
  } else if (currentMode.value === "eraser") {
    canvas.freeDrawingBrush.color = "#ffffff";
    canvas.freeDrawingBrush.width = brushWidth.value;
  }
};

// 添加图形
const addShape = (type: "rect" | "circle" | "triangle") => {
  if (!canvas) return;
  setMode("select");

  let shape;
  const commonProps = {
    left: 100,
    top: 100,
    fill: brushColor.value,
    stroke: "#000000",
    strokeWidth: 1,
  };

  if (type === "rect") {
    shape = new fabric.Rect({
      ...commonProps,
      width: 100,
      height: 100,
    });
  } else if (type === "circle") {
    shape = new fabric.Circle({
      ...commonProps,
      radius: 50,
    });
  } else if (type === "triangle") {
    shape = new fabric.Triangle({
      ...commonProps,
      width: 100,
      height: 100,
    });
  }

  if (shape) {
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  }
};

// 添加文本
const addText = () => {
  if (!canvas) return;
  setMode("select");

  const text = new fabric.IText("双击编辑文字", {
    left: 100,
    top: 100,
    fontSize: 20,
    fill: brushColor.value,
  });

  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.renderAll();
};

// 历史记录
const saveHistory = () => {
  if (isUpdatingHistory || !canvas) return;

  const json = JSON.stringify(canvas.toJSON());

  // 如果当前不在历史末尾，删除后面的历史
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }

  history.value.push(json);
  historyIndex.value++;

  // 限制历史长度
  if (history.value.length > 50) {
    history.value.shift();
    historyIndex.value--;
  }
};

const undo = async () => {
  if (historyIndex.value <= 0 || !canvas) return;

  isUpdatingHistory = true;
  historyIndex.value--;
  const json = history.value[historyIndex.value];
  // Fabric 7 uses loadFromJSON as an async function
  await canvas.loadFromJSON(JSON.parse(json));
  canvas.renderAll();
  isUpdatingHistory = false;
};

const redo = async () => {
  if (historyIndex.value >= history.value.length - 1 || !canvas) return;

  isUpdatingHistory = true;
  historyIndex.value++;
  const json = history.value[historyIndex.value];
  // Fabric 7 uses loadFromJSON as an async function
  await canvas.loadFromJSON(JSON.parse(json));
  canvas.renderAll();
  isUpdatingHistory = false;
};

// 其他功能
const clearCanvas = () => {
  if (!canvas) return;
  canvas.clear();
  canvas.backgroundColor = "#ffffff";
  canvas.renderAll();
  saveHistory();
};

const exportImage = () => {
  if (!canvas) return;
  const dataURL = canvas.toDataURL({
    format: "png",
    quality: 1,
  });
  const link = document.createElement("a");
  link.download = "whiteboard.png";
  link.href = dataURL;
  link.click();
  message.success("导出成功");
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!canvas) return;
  if (e.key === "Delete" || e.key === "Backspace") {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      canvas.remove(...activeObjects);
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }
};

// 窗口调整
const handleResize = () => {
  if (!canvas || !canvasWrapper.value) return;
  canvas.setWidth(canvasWrapper.value.clientWidth);
  canvas.setHeight(canvasWrapper.value.clientHeight);
  canvas.renderAll();
};

onMounted(() => {
  initCanvas();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("keydown", handleKeyDown);
  if (canvas) {
    canvas.dispose();
  }
});
</script>

<style scoped>
.whiteboard-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.toolbar {
  height: 50px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 4px;
}

.color-tool {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preset-colors {
  display: flex;
  gap: 6px;
  align-items: center;
}

.color-swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}

.color-swatch:hover {
  transform: scale(1.2);
}

.color-swatch.active {
  border-color: #1890ff;
  transform: scale(1.1);
}

.custom-color-picker-wrapper {
  width: 24px;
  height: 24px;
  overflow: hidden;
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}

.custom-color-picker {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  opacity: 0; /* 完全透明但可点击 */
  z-index: 2;
}

.color-picker-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 让点击穿透到下面的 picker */
  z-index: 1;
}

:deep(.n-color-picker-trigger) {
  border: none !important;
}

.slider-tool {
  display: flex;
  align-items: center;
  gap: 10px;
}

.size-text {
  font-size: 12px;
  color: #666;
  min-width: 32px;
}

.label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.tool-icon-small {
  color: #666;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  margin: 16px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.tips {
  padding: 8px 16px;
  background: white;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}
</style>
