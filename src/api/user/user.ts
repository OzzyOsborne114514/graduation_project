import http from '../index';

// ========================
// 定义接口的数据类型
// ========================

/**
 * 登录请求参数
 */
export interface LoginParams {
  telephone: string;
  password?: string;
  rememberMe?: boolean;
}

/**
 * 登录响应数据 (对应 data 字段)
 */
export interface LoginResponse {
  id: number;
  firstName: string;
  lastName: string;
  token: string;
}

// ========================
// 定义 API 请求方法
// ========================

/**
 * 用户登录接口
 * @param data 登录参数
 */
export const loginApi = (data: LoginParams) => {
  return http.post<LoginResponse>('/user/login', data);
};


export interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  telephone: string;
  photo: any;
}

/**
 * 获取用户信息接口
 */
export const getUserInfoApi = () => {
  return http.get<UserInfo>('/user/getCurrentUserData');
}

export interface RegisterParams {
  name: string;
  telephone: string;
  password: string;
  gender: string;
}

/**
 * 注册接口
 * @param data 注册参数
 */
export const registerApi = (data: RegisterParams) => {
  return http.post<UserInfo>('/user/register', data);
}