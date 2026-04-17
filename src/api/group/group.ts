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

//进入群聊
export const enterGroupApi = (groupId:string) => {
  return http.post('/group/enter',null,{params:{groupId}})
}

export interface HistoryResponse {
  id:string,
  groupId?:string,
  senderId:string,
  senderName:string,
  photo:object,
  receiver?:string,
  content:string,
  sendTime:string,
  file?:object
}
//查询群聊历史消息
export const getHistoryMessage = (groupId:string) => {
  return http.post('/group/message/history',null,{params:{groupId}})
}

//查询群成员信息
export const getMembersInfo = (groupId:string) => {
  return http.post('/group/members/info',null,{params:{groupId}})
}

//查询我的群聊
export const getMyGroupList = () => {
  return http.get<any>('/group/my/list');
}


//发送群消息
export const sendMessage = (groupId:string,content:string,file?:object) => {
  return http.post('/group/sendGroupMessage', null,{params:{groupId,content,file}});
}
