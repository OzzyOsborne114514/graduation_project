import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import router from '@/router';

// 定义接口响应的数据结构，根据你的后端实际返回结构进行调整
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 获取 token 的 key
const TOKEN_KEY = 'token';

class Request {
  private instance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    // 1. 创建 axios 实例，在创建时就带上 token
    this.instance = axios.create({
      ...config,
      headers: {
        ...config.headers,
        token: localStorage.getItem(TOKEN_KEY) || '',
      },
    });

    // 2. 配置拦截器
    this.setupInterceptors();
  }

  /**
   * 拦截器配置
   */
  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 每次请求前更新 token（防止 token 被刷新后还是旧的）
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && config.headers) {
          config.headers['token'] = token;
        }
        return config;
      },
      (error: AxiosError) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // 如果响应头中有新 token，更新本地存储
        const newToken = response.headers['token'];
        if (newToken) {
          localStorage.setItem(TOKEN_KEY, newToken);
        }

        const res = response.data;

        // 根据后端 code 判断成功/失败
        if (res.code === 200 || res.code === 1 || res.code === 0) {
          return response;
        } else {
          console.error(`Error: ${res.msg}`);
          // token 失效，统一处理登出
          if (res.code === 401) {
            this.handleTokenExpired();
          }
          return Promise.reject(new Error(res.msg || 'Error'));
        }
      },
      (error: AxiosError) => {
        // HTTP 状态码错误处理
        if (error.response) {
          const status = error.response.status;
          switch (status) {
            case 401:
              console.error('Unauthorized (401)');
              this.handleTokenExpired();
              break;
            case 403:
              console.error('Forbidden (403)');
              break;
            case 404:
              console.error('Not Found (404)');
              break;
            case 500:
              console.error('Internal Server Error (500)');
              break;
            default:
              console.error(`Request failed with status ${status}`);
          }
        } else {
          console.error('Network Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 处理 token 过期
   */
  private handleTokenExpired() {
    // 清除本地存储
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userInfo');

    // 跳转到登录页
    router.push('/login');
  }

  // 封装请求方法
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config).then((res) => res.data.data);
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config).then((res) => res.data.data);
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config).then((res) => res.data.data);
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config).then((res) => res.data.data);
  }
}

// 导出默认实例
const http = new Request({
  baseURL: '/api',
  timeout: 60000,
});

export default http;
