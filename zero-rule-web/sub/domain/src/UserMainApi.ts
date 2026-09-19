import type { ErrorResponseInterceptor, ResponseInterceptor } from '..';
import { ApiHelper } from '..';
import { errorToMessage } from './errors/error-messages';
import log from './log';
import { AuthApi } from './user-apis/AuthApi';
import { CLApiPageApi } from './user-apis/CLApiPageApi';
import { CLCodeApi } from './user-apis/CLCodeApi';
import { CLCodeTypeApi } from './user-apis/CLCodeTypeApi';
import { CLEtcApi } from './user-apis/CLEtcApi';
import { CLJobApi } from './user-apis/CLJobApi';
import { CLMsgMngApi } from './user-apis/CLMsgMngApi';
import { CLNavApi } from './user-apis/CLNavApi';
import { CLPrivApi } from './user-apis/CLPrivApi';
import { CLRoleApi } from './user-apis/CLRoleApi';
import { CLRoleUserApi } from './user-apis/CLRoleUserApi';
import { CLSystemLogApi } from './user-apis/CLSystemLogApi';
import { EmailTransInfoApi } from './user-apis/EmailTransInfoApi';
import { GridApi } from './user-apis/GridApi';
import { InterfaceApi } from './user-apis/InterfaceApi';
import { ItemMgmtApi } from './user-apis/ItemMgmtApi';
import { LayoutApi } from './user-apis/LayoutApi';
import { LockApi } from './user-apis/LockApi';
import { PdsApi } from './user-apis/PdsApi';
import { PopupAdminApi } from './user-apis/PopupAdminApi';
import { ProfileApi } from './user-apis/ProfileApi';
import { RuleApi } from './user-apis/RuleApi';
import { TeamApi } from './user-apis/TeamApi';
import { UserApi } from './user-apis/UserApi';
import { UserManageApi } from './user-apis/UserManageApi';

export class UserMainApi {
  helper: ApiHelper;
  // begin clover framework apis
  clCode: CLCodeApi;
  clCodeType: CLCodeTypeApi;
  clJob: CLJobApi;
  clSystemLog: CLSystemLogApi;
  clEtc: CLEtcApi;
  clNav: CLNavApi;
  clPriv: CLPrivApi;
  clRole: CLRoleApi;
  clRoleUser: CLRoleUserApi;
  clPageApi: CLApiPageApi;
  clMsgMngApi: CLMsgMngApi;
  // end clover framework apis
  auth: AuthApi;
  pds: PdsApi;
  user: UserApi;
  userManage: UserManageApi;
  team: TeamApi;
  profile: ProfileApi;
  rule: RuleApi;
  interface: InterfaceApi;
  itemMgmt: ItemMgmtApi;
  lock: LockApi;
  popupAdmin: PopupAdminApi;
  // 테스트
  layout: LayoutApi;
  grid: GridApi;
  emailTransInfo: EmailTransInfoApi;

  constructor(
    public apiBaseURL: string,
    createApiHeader: () => Record<string, string>,
    responseInterceptor: ResponseInterceptor,
    errorResponseInterceptor: ErrorResponseInterceptor,
    debug = false,
  ) {
    log.debug('create Api for ', apiBaseURL);

    // create helper
    const helper = new ApiHelper(
      apiBaseURL,
      createApiHeader,

      responseInterceptor,
      errorResponseInterceptor,
      errorToMessage,
      debug,
    );

    this.helper = helper;

    // begin clover framework apis
    this.clCode = new CLCodeApi(helper);
    this.clCodeType = new CLCodeTypeApi(helper);
    this.clJob = new CLJobApi(helper);
    this.clSystemLog = new CLSystemLogApi(helper);
    this.clEtc = new CLEtcApi(helper);
    this.clNav = new CLNavApi(helper);
    this.clPriv = new CLPrivApi(helper);
    this.clRole = new CLRoleApi(helper);
    this.clRoleUser = new CLRoleUserApi(helper);
    this.clPageApi = new CLApiPageApi(helper);
    this.clMsgMngApi = new CLMsgMngApi(helper);
    // end clover framework apis

    this.auth = new AuthApi(helper);
    this.pds = new PdsApi(helper);
    this.user = new UserApi(helper);
    this.userManage = new UserManageApi(helper);
    this.team = new TeamApi(helper);
    this.profile = new ProfileApi(helper);
    this.rule = new RuleApi(helper);
    this.interface = new InterfaceApi(helper);
    this.itemMgmt = new ItemMgmtApi(helper);
    this.lock = new LockApi(helper);
    this.popupAdmin = new PopupAdminApi(helper);
    // 테스트
    this.layout = new LayoutApi(helper);
    this.grid = new GridApi(helper);
    this.emailTransInfo = new EmailTransInfoApi(helper);
  }
}
