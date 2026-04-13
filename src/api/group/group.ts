import http from "..";

export interface GetGroupListParams {
  groupName?: string;
  page: number;
  pageSize: number;
}
export interface GroupListResponse {
  total: number;
  records: any;
}
// 分页查询群组接口
export const getGroupListApi = (data: GetGroupListParams) => {
  return http.post<GroupListResponse>('/group/pageQueryGroup', data);
}

export interface JoinGroupParams {
  groupId: string;
}
// 申请加入群组接口
export const applyJoinGroupApi = (groupId: string) => {
  return http.post('/group/applyJoinGroup', null, { params: { groupId } });
}

// 查看我发起的申请接口
export const getMyApplyJoinGroupApi = () => {
  return http.get<any>('/group/getMyApplys');
}

// 管理员查看所有待审核申请接口
export const getAllApplyJoinGroupApi = () => {
  return http.get<any>('/group/getCheckApplies');
}

// 管理员审核入群申请接口
export const checkApplyJoinGroupApi = (applyId: string, applyStatus: string) => {
  return http.post('/group/auditApply', null, { params: { applyId, applyStatus } });
}


export interface CreateGroupParams {
  groupName: string;
  userIdList?: string[];
  groupContent?: string;
}
// 创建群组接口
export const createGroupApi = (data: CreateGroupParams) => {
  return http.post('/group/createGroup', data);
}