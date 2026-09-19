import React from 'react';
import dynamic from 'next/dynamic';

const NotReady = dynamic(() => import('@/components/NotReady'));
const AppLogHome = dynamic(() => import('@/features/AppLogHome'));
const AuditLogHome = dynamic(() => import('@/features/AuditLogHome'));
const CmpGuide = dynamic(() => import('@/features/CmpGuide'));
const CodeHome = dynamic(() => import('@/features/CodeHome'));
const ErrorCodesHome = dynamic(() => import('@/features/ErrorCodesHome'));
const JobLogHome = dynamic(() => import('@/features/JobLogList'));
const JobsHome = dynamic(() => import('@/features/JobList'));
const NavMenusHome = dynamic(() => import('@/features/NavMenusHome'));
const NavPagesHome = dynamic(() => import('@/features/NavPagesHome'));
const PdsEdit = dynamic(() => import('@/features/PdsEdit'));
const PdsHome = dynamic(() => import('@/features/PdsHome'));
const UserMgmtHome = dynamic(() => import('@/features/UserMgmtHome'));
const RoleUserHome = dynamic(() => import('@/features/RoleUserHome'));
const RoleSettingsHome = dynamic(() => import('@/features/RoleSettingsHome'));
const PageApiRoleHome = dynamic(() => import('@/features/PageApiRoleHome'));
const MsgMngHome = dynamic(() => import('@/features/MsgMngHome'));
const MsgMngEnumHome = dynamic(() => import('@/features/MsgMngEnumHome'));
const MainHome = dynamic(() => import('@/features/CloverMainHome'));
const LockMgmtHome = dynamic(() => import('@/features/LockMgmtHome'), { ssr: false });
// rule
const ItemMgmtHome = dynamic(() => import('@/features/ItemMgmtHome'), { ssr: false });
const RuleTestHome = dynamic(() => import('@/features/RuleTestHome'), { ssr: false });
const RuleHome = dynamic(() => import('@/features/RuleHome'), { ssr: false });
const InterfaceMgmtHome = dynamic(() => import('@/features/InterfaceMgmtHome'), { ssr: false });
const RuleDeployHome = dynamic(() => import('@/features/RuleDeployHome'), {
  ssr: false,
});
const EmailTransInfoHome = dynamic(() => import('@/features/EmailTransInfoHome'), { ssr: false });
const RgstPop = dynamic(() => import('@/features/RgstPop'), { ssr: false });

export interface ISceneComponent {
  url: string;
  title: string;
  component: React.ComponentType | React.ReactNode;
}

/**
 * 배열을 받아 키가 url 이고 값이 {url, title, component} 인 객체를 리턴한다
 * reduce가 사용됐기 때문에 한 객체안에 전체 키와 값이 들어감 (배열아님)
 */
function createScenes(
  scenes: Array<[string, string, React.ComponentType]>,
): Record<string, ISceneComponent> {
  return scenes.reduce(
    (acc, cur) => {
      const [url, title, component] = cur;
      acc[url] = { url, title, component };
      return acc;
    },
    {} as Record<string, ISceneComponent>,
  );
}

// TODO 제목에 비어 있는 부분 채워야 함
// 메인 레이아웃 안에 포함할 URL만 추가한다
export const SCENES: Record<string, ISceneComponent> = createScenes([
  ['/code', '코드 조회', CodeHome],
  ['/error-codes', '에러 코드 관리', ErrorCodesHome],
  ['/log/app-logs', '시스템 로그', AppLogHome],
  ['/log/audit-logs', 'AUDIT 로그', AuditLogHome],
  ['/log/job-logs', '잡 로그', JobLogHome],
  ['/log/jobs', '잡 목록', JobsHome],
  ['/nav/list', '메뉴 모음', NavMenusHome],
  ['/nav/pages', '페이지 목록', NavPagesHome],
  ['/pds/list', '자료실', PdsHome],
  ['/pds/edit', '자료실 등록', PdsEdit],
  ['/pds/edit/[pdsId]', '자료실 수정', PdsEdit],
  ['/cmp-guide', 'Component 가이드', CmpGuide],
  ['/role/settings', '권한 설정', RoleSettingsHome],
  ['/role/user', '사용자 권한 관리', RoleUserHome],
  ['/user-mgmt', '사용자관리', UserMgmtHome],
  ['/page-api-role', '페이지 권한', PageApiRoleHome],
  ['/msg-mng', '메시지 관리', MsgMngHome],
  ['/msg-mng-enum', '메시지 코드 관리', MsgMngEnumHome],
  ['/clover-main', '', MainHome],
  ['/lock-mgmt', '락 관리', LockMgmtHome],
  // rule
  ['/item/item-mgmt', '항목관리', ItemMgmtHome],
  ['/rule/rule-test', '룰 테스트', RuleTestHome],
  ['/rule-home', '룰 관리', RuleHome],
  ['/interface-mgmt-home', '인터페이스 정보관리', InterfaceMgmtHome],
  ['/rule-deploy-home', '룰 배포', RuleDeployHome],
  ['/email-trans-info-home', '이메일송수신정보조회', EmailTransInfoHome],
  ['/rgst-pop', '팝업 등록', RgstPop],
]);

// url(키)로 값을 리턴해준다
export const findSceneByUrl = (url: string): ISceneComponent | undefined => {
  if (url.endsWith('/')) {
    url = url.replace(/\/+$/, '');
  }
  const scene = SCENES[url];
  return scene ?? undefined;
};

// url컴포넌트를 받아서 리액트 노드로 변경해준다 기존 자연스럽게 되던거
export const createSceneElement = (
  component: React.ComponentType | React.ReactNode,
  props?: any,
): React.ReactNode | undefined => {
  if (React.isValidElement(component)) {
    return React.cloneElement(component, props);
  }

  const Comp = component as React.ComponentType;
  return <Comp {...props} />;
};
