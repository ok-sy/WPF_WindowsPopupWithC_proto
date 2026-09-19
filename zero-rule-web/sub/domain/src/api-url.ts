/**
 * API post 요청 url 주소 정의
 * 규칙 : 1.클래스의 이름 camel문법으로 지정
 *        2. 마지막에 URL 붙여서 정의
 *        3. 객체 내부에 변수명은 각 api클래스의 메서드명과 동일하게 작성
 */

/**
 * CLMsgMngApiURL
 */
export const MSG_MNG_API_URL = {
  list: '/apis/msg-mng/list',
  create: '/apis/msg-mng/create',
  update: '/apis/msg-mng/update',
  updateUseYn: '/apis/msg-mng/update-use-yn',
  msgMngFile: '/apis/msg-mng/uploadFile',
  enumList: '/apis/msg-mng/enum-list',
};
/**
 * AuthApiURL
 */
export const AUTH_API_URL = {
  signIn: '/p/api/auth/login',
  signUp: '/p/api/auth/sign-up',
  isAvailableUserId: '/p/api/auth/is-available-user-id',
  signOut: '/api/auth/logout',
};

/** PopupAdminApiURL */
export const POPUP_ADMIN_API_URL = {
  list: '/apis/popup/list',
  info: '/apis/popup/info',
  save: '/apis/popup/save',
  updateActive: '/apis/popup/active',
  questionTemplates: '/apis/popup/question-templates',
  questionTemplate: '/apis/popup/question-template',
};
/**
 * CLCodeApiURL
 */
export const CL_CODE_API_URL = {
  search: '/apis/cloverframework/code/search',
  info: '/apis/cloverframework/code/info',
  create: '/apis/cloverframework/code/create',
  update: '/apis/cloverframework/code/update',
  delete: '/apis/cloverframework/code/delete',
  saveAll: '/apis/cloverframework/code/save-all',
};
/**
 * CLCodeTypeApiURL
 */
export const CL_CODE_TYPE_API_URL = {
  search: '/apis/cloverframework/code-type/search',
  info: '/apis/cloverframework/code-type/info',
  create: '/apis/cloverframework/code-type/create',
  update: '/apis/cloverframework/code-type/update',
  deleteWithCodes: '/apis/cloverframework/code-type/delete',
};
/**
 * CLJobApiURL
 */
export const CL_JOB_API_URL = {
  list: '/apis/cloverframework/job/list',
};
/**
 * CLSystemLogApiURL
 */
export const CL_SYSTEM_LOG_API_URL = {
  jobLogList: '/apis/cloverframework/system-log/job-log-list',
  appLogList: '/apis/cloverframework/system-log/app-log-list',
  auditLogList: '/apis/cloverframework/system-log/audit-log-list',
};
/**
 * CLEtcApiURL
 */
export const CL_ETC_API_URL = {
  errorMetas: '/api/cloverframework/error-meta/list',
};
/**
 * CLNavApiURL
 */
export const CL_NAV_API_URL = {
  createNav: '/apis/cloverframework/nav/create',
  updateNav: '/apis/cloverframework/nav/update',
  navList: '/apis/cloverframework/nav/list',
  deleteNav: '/apis/cloverframework/nav/delete',
  items: '/apis/cloverframework/nav/items',
  sortItems: '/apis/cloverframework/nav/sort-items',
  createPage: '/apis/cloverframework/nav/create-page',
  updatePage: '/apis/cloverframework/nav/update-page',
  deletePage: '/apis/cloverframework/nav/delete-page',
  pages: '/apis/cloverframework/nav/page-list',
  createSection: '/apis/cloverframework/nav/create-section',
  updateSection: '/apis/cloverframework/nav/update-section',
  deleteSection: '/apis/cloverframework/nav/delete-section',
  sectionInfo: '/apis/cloverframework/nav/section-info',
};
/**
 * CLPrivApiURL
 */
export const CL_PRIV_API_URL = {
  privPList: '/apis/cloverframework/privilege/list',
  createPriv: '/apis/cloverframework/privilege/add',
  updatePriv: '/apis/cloverframework/privilege/update',
  deletePriv: '/apis/cloverframework/privilege/delete',
};
/**
 * CLRoleApiURL
 */
export const CL_ROLE_API_URL = {
  rolePages: '/apis/cloverframework/role/pages',
  roles: '/apis/cloverframework/role/list',
  roleInfo: '/apis/cloverframework/role/info',
  createRole: '/apis/cloverframework/role/create-role',
  updateRole: '/apis/cloverframework/role/update-role',
  deleteRole: '/apis/cloverframework/role/delete',
  saveRolePage: '/apis/cloverframework/role/update-role-page',
  grantAllRolePage: '/apis/cloverframework/role/grant-all-role-page',
  revokeAllRolePage: '/apis/cloverframework/role/revoke-all-role-page',
};
/**
 * CLRoleUserApiURL
 */
export const CL_ROLE_USER_API_URL = {
  roleList: '/apis/cloverframework/role-user/role-list',
  privList: '/apis/cloverframework/role-user/priv-list',
  grantPriv: '/apis/cloverframework/role-user/grant-priv',
  revokePriv: '/apis/cloverframework/role-user/revoke-priv',
  grantRole: '/apis/cloverframework/role-user/grant-role',
  revokeRole: '/apis/cloverframework/role-user/revoke-role',
  userListByRole: '/apis/cloverframework/role-user/role-granted-users',
  userListByPriv: '/apis/cloverframework/role-user/priv-granted-users',
};
/**
 * CLApiPageApiURL
 */
export const CL_API_PAGE_API_URL = {
  pageApiList: '/apis/cloverframework/pageApi/list',
  pageApiUpdate: '/apis/cloverframework/pageApi/update',
};
/**
 * PdsApiURL
 */
export const PDS_API_URL = {
  create: '/api/pds/create',
  update: '/api/pds/update',
  list: '/api/pds/list',
  info: '/api/pds/info/', // + pdsId(동적)
  delete: '/api/pds/delete/', // + pdsId(동적)
  renameFile: '/api/pds/update-file-name/', // + fileId(동적)
  uploadTempFile: '/api/pds/upload',
};
/**
 * UserApiURL
 */
export const USER_API_URL = {
  updatePassword: '/api/user/update-pwd',
};
/**
 * UserManageApiURL
 */
export const USER_MANAGE_API_URL = {
  list: '/apis/user-manage/list',
  info: '/apis/user-manage/info',
  create: '/apis/user-manage/create',
  update: '/apis/user-manage/update',
  updatePassword: '/apis/user-manage/initpw',
};
/**
 * TeamApiURL
 */
export const TEAM_API_URL = {
  list: '/apis/team/list',
  create: '/apis/team/create',
  info: '/apis/team/info',
  update: '/apis/team/update',
  teamForUser: '/apis/team/user-list',
};
/**
 * ProfileApiURL
 */
export const PROFILE_API_URL = {
  profileMe: '/api/auth/profile-me',
};
/**
 * RuleTmplApiURL
 */
export const RULE_TMPL_API_URL = {
  list: '/apis/ruleTmpl/list',
  info: '/apis/ruleTmpl/info',
  create: '/apis/ruleTmpl/create',
  update: '/apis/ruleTmpl/update',
  delete: '/apis/ruleTmpl/delete',
};
/**
 * RuleApiURL
 */
export const RULE_API_URL = {
  ruleInsert: '/apis/rule/insert',
  ruleUpdate: '/apis/rule/update',
  ruleList: '/apis/rule/list',
  ruleDetailInfo: '/apis/rule/detail/info',
  varList: '/apis/rule/varl/list',
  actnList: '/apis/rule/actn/list',
  actnInfo: '/apis/rule/actn/info',
  actnCreate: '/apis/rule/actn/create',
  actnUpdate: '/apis/rule/actn/update',
  actnDelete: '/apis/rule/actn/delete',
  actnDtlList: '/apis/rule/actn-dtl/list',
  actnDtlInfo: '/apis/rule/actn-dtl/info',
  actnDtlCreate: '/apis/rule/actn-dtl/create',
  actnDtlUpdate: '/apis/rule/actn-dtl/update',
  actnDtlDelete: '/apis/rule/actn-dtl/delete',
  ruleApply: '/apis/rule/apply',
  ruleDelete: '/apis/rule/delete',
  ruleTblInfo: '/apis/rule/tbl/info',
};

/**
 * TrxInfoApiUrl
 */
export const TRX_INFO_API_URL = {
  trxLinfoList: '/apis/trxInfo/list',
  info: '/apis/trxInfo/info',
  create: '/apis/trxInfo/create',
  update: '/apis/trxInfo/update',
  delete: '/apis/trxInfo/delete',
};
