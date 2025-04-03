import mitt from "mitt";

export const eventBus = mitt();

// 定义事件类型，方便使用
export const EventType = {
  REFRESH_SUBMITS: "REFRESH_SUBMITS",
} as const;
