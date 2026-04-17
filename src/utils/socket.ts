type MessageCallback = (data: any) => void;

class SocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private callbacks: Map<string, MessageCallback[]> = new Map();
  private reconnectTimer: number | null = null;
  private maxReconnectAttempts = 5;
  private reconnectAttempts = 0;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * 连接 WebSocket
   */
  connect(token: string) {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    // 后端 WebSocket 地址，带上 token 鉴权
    const fullUrl = `${this.url}?token=${token}`;
    this.socket = new WebSocket(fullUrl);

    this.socket.onopen = () => {
      console.log('WebSocket Connected');
      this.reconnectAttempts = 0;
      if (this.reconnectTimer) {
        clearInterval(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // 根据消息类型触发回调，这里假设后端消息体有 type 字段，或者统一处理
        this.emit('message', data);
      } catch (e) {
        console.error('WebSocket parse error:', e);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket Closed');
      this.reconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };
  }

  /**
   * 重连机制
   */
  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket max reconnect attempts reached');
      return;
    }

    if (this.reconnectTimer) return;

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectAttempts++;
      const token = localStorage.getItem('token');
      if (token) {
        this.connect(token);
      }
      this.reconnectTimer = null;
    }, 3000);
  }

  /**
   * 发送消息
   */
  send(data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not open');
    }
  }

  /**
   * 监听消息
   */
  on(event: string, callback: MessageCallback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)?.push(callback);
  }

  /**
   * 移除监听
   */
  off(event: string, callback: MessageCallback) {
    const list = this.callbacks.get(event);
    if (list) {
      const index = list.indexOf(callback);
      if (index > -1) {
        list.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any) {
    const list = this.callbacks.get(event);
    if (list) {
      list.forEach(cb => cb(data));
    }
  }

  /**
   * 关闭连接
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// 单例模式导出，端口根据用户描述设为 8081
const socketService = new SocketService('ws://localhost:8081/ws');
export default socketService;
