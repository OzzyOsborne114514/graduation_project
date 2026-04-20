import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type MessageCallback = (data: any) => void;

class SocketService {
  private client: Client | null = null;
  private url: string;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private callbacks: Map<string, MessageCallback[]> = new Map();
  private isConnected = false;

  constructor(url: string) {
    // 如果是 ws:// 开头，且准备使用 SockJS，建议换成 http:// 或 https://
    this.url = url.replace(/^ws/, 'http');
  }

  /**
   * 连接 WebSocket (STOMP over SockJS)
   */
  connect(token: string) {
    if (this.client?.active) return;

    const socketUrl = this.url.includes('?') 
      ? `${this.url}&token=${token}` 
      : `${this.url}?token=${token}`;

    this.client = new Client({
      // 使用 webSocketFactory 来集成 SockJS
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        token: token,
      },
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // 如果 brokerURL 是 ws:// 开头的，直接连接
    // 如果需要支持 SockJS，可以设置 webSocketFactory

    this.client.onConnect = (frame) => {
      console.log('STOMP Connected:', frame);
      this.isConnected = true;
      // 重新订阅之前的目的地
      this.reSubscribeAll();
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP Error:', frame.headers['message']);
      console.error('STOMP Details:', frame.body);
    };

    this.client.onWebSocketClose = () => {
      console.log('STOMP WebSocket Closed');
      this.isConnected = false;
    };

    this.client.activate();
  }

  /**
   * 订阅目的地
   */
  subscribe(destination: string, callback: MessageCallback) {
    // 记录回调
    if (!this.callbacks.has(destination)) {
      this.callbacks.set(destination, []);
    }
    this.callbacks.get(destination)?.push(callback);

    // 如果已连接，立即订阅
    if (this.isConnected && this.client) {
      this.doSubscribe(destination);
    }
  }

  /**
   * 内部执行订阅
   */
  private doSubscribe(destination: string) {
    if (!this.client || this.subscriptions.has(destination)) return;

    const sub = this.client.subscribe(destination, (message: IMessage) => {
      try {
        // 解决大数字精度丢失问题：在解析 JSON 前，将大数字（16位以上）替换为字符串
        const rawBody = message.body;
        const normalizedBody = rawBody.replace(/([^\\]":\s*)(\d{16,})/g, '$1"$2"');
        const data = JSON.parse(normalizedBody);
        
        const callbacks = this.callbacks.get(destination);
        if (callbacks) {
          callbacks.forEach(cb => cb(data));
        }
      } catch (e) {
        console.error(`Error parsing message from ${destination}:`, e);
      }
    });

    this.subscriptions.set(destination, sub);
  }

  /**
   * 重新订阅所有已注册的目的地
   */
  private reSubscribeAll() {
    this.callbacks.forEach((_, destination) => {
      this.doSubscribe(destination);
    });
  }

  /**
   * 取消订阅
   */
  unsubscribe(destination: string, callback?: MessageCallback) {
    if (callback) {
      const list = this.callbacks.get(destination);
      if (list) {
        const index = list.indexOf(callback);
        if (index > -1) {
          list.splice(index, 1);
        }
        if (list.length === 0) {
          this.callbacks.delete(destination);
          this.realUnsubscribe(destination);
        }
      }
    } else {
      this.callbacks.delete(destination);
      this.realUnsubscribe(destination);
    }
  }

  private realUnsubscribe(destination: string) {
    const sub = this.subscriptions.get(destination);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  /**
   * 发送消息
   */
  send(destination: string, body: any) {
    if (this.client?.connected) {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
      });
    } else {
      console.error('STOMP is not connected');
    }
  }

  /**
   * 关闭连接
   */
  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
      this.subscriptions.clear();
      this.callbacks.clear();
    }
  }

  // 兼容旧代码的 emit/on 方法，但建议使用 subscribe
  on(destination: string, callback: MessageCallback) {
    this.subscribe(destination, callback);
  }

  off(destination: string, callback: MessageCallback) {
    this.unsubscribe(destination, callback);
  }
}

// 单例模式导出
const socketService = new SocketService('http://localhost:8081/ws');
export default socketService;
