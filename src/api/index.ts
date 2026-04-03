import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// 定义接口响应的数据结构，根据你的后端实际返回结构进行调整
export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

class Request {
  private instance: AxiosInstance;

  constructor(config: AxiosRequestConfig) {
    // 1. 创建 axios 实例
    this.instance = axios.create(config);

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
        // 在发送请求之前做些什么
        // 登录、注册等接口不需要 token
        const noTokenUrls = ['/login', '/register', '/api/login', '/api/register']; // 根据需要添加不需要 token 的白名单
        
        // 获取实际的请求路径
        const requestUrl = config.url || '';
        const isNoTokenUrl = noTokenUrls.some(url => requestUrl.includes(url));
        
        // 调试日志：可以打开查看实际请求的 URL
        console.log('Request URL:', requestUrl, 'isNoTokenUrl:', isNoTokenUrl);
        
        if (!isNoTokenUrl) {
          alert('需要 token');
          const token = localStorage.getItem('token');
          // 如果接口需要 token，但是本地没有 token，可以在这里做额外处理
          // 或者仅仅是带上现有的 token
          if (token && config.headers) {
            // 注意：有些后端的 header 可能是小写的 authorization 或其他的 token 字段
            // 这里使用你后端的规范，常见的有 Bearer Token 或直接传 token
            config.headers['token'] = `Bearer ${token}`;
            // config.headers['token'] = token; // 如果你的后端是这种格式请切换到这行
          }
        }
        return config;
      },
      (error: AxiosError) => {
        // 对请求错误做些什么
        console.error('Request Error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // 对响应数据做点什么
        const res = response.data;
        
        // 这里可以根据你后端的 code 码进行全局的成功/失败处理
        // 假设 200 或 0 是成功状态码
        if (res.code === 200 || res.code === 1 || res.code === 0) {
          return response;
        } else {
          // 处理业务错误，例如弹出提示框（这里仅打印）
          console.error(`Error: ${res.msg}`);
          // 如果是 401 token 失效，可以在这里统一处理登出逻辑
          if (res.code === 401) {
            console.log('Token expired, please login again.');
            // 执行登出操作...
          }
          return Promise.reject(new Error(res.msg || 'Error'));
        }
      },
      (error: AxiosError) => {
        // 对响应错误做点什么 (HTTP 状态码非 2xx)
        if (error.response) {
          const status = error.response.status;
          switch (status) {
            case 400:
              console.error('Bad Request (400)');
              break;
            case 401:
              console.error('Unauthorized (401)');
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
          console.error('Network Error or Request Timeout');
        }
        return null;
      }
    );
  }

  /**
   * 封装核心的 request 方法
   */
  public request<T = any>(config: AxiosRequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      this.instance
        .request<any, AxiosResponse<ApiResponse<T>>>(config)
        .then((res) => {
          resolve(res.data.data); // 直接返回核心的 data 部分
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * 封装 GET 方法
   */
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * 封装 POST 方法
   */
  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * 封装 PUT 方法
   */
  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * 封装 DELETE 方法
   */
  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

// 导出默认实例
const http = new Request({
  // 使用代理路径 '/api' 来代替直接写死目标域名，解决跨域问题
  baseURL: '/api',
  timeout: 60000, // 默认超时时间 60s
});

export default http;
