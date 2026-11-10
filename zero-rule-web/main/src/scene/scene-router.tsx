/* eslint-disable turbo/no-undeclared-env-vars -- DEV_SCENE_OFF_*는 셸 환경변수가 아니라 next.config.mjs env가 컴파일 때 넣는 상수라 turbo 캐시 키 대상이 아니다. */
import React from 'react';
import dynamic from 'next/dynamic';

/*
 * ■ 개발 서버 화면 묶음 필터(DEV_SCENES)
 * - Turbopack 개발 서버는 페이지를 컴파일할 때 아래 dynamic() 대상 화면까지 모두 컴파일한다. 첫 화면(/)도 등록된 전체 화면을 컴파일해 느려진다.
 * - next.config.mjs가 개발 서버(next dev)에서만 DEV_SCENES(예: popup,pds)에 없는 묶음의 DEV_SCENE_OFF_<묶음>을 '1'로 넣는다.
 *   이 값은 컴파일 때 상수로 바뀌어 꺼진 묶음의 import 자체가 빠진다. next build·DEV_SCENES 미지정이면 모두 '0'이라 모든 화면이 그대로 등록되고 DevSceneOff는 번들에서 빠진다.
 * - 묶음: SYSTEM(코드·메뉴·권한·사용자·메시지·락·컴포넌트 가이드) · LOG · PDS · RULE(항목·룰·인터페이스·이메일) · POPUP. 대시보드(/clover-main)는 항상 켠다.
 * - 화면 추가: 묶음을 정해 `process.env.DEV_SCENE_OFF_<묶음> === '1' ? DevSceneOff : dynamic(...)`로 감싼다. 새 묶음은 next.config.mjs DEV_SCENE_GROUPS에도 추가한다.
 *   조건은 줄마다 직접 써야 한다(변수·객체로 빼면 컴파일 때 상수로 접히지 않아 import가 남는다).
 */
function DevSceneOff() {
  return (
    <div style={{ padding: 24, color: '#666' }}>
      개발 서버 화면 묶음 필터(DEV_SCENES)로 제외된 화면입니다. DEV_SCENES에 이 화면의 묶음을 추가하고 개발 서버를 다시 시작하세요.
    </div>
  );
}

const NotReady = dynamic(() => import('@/components/NotReady'));
const AppLogHome = process.env.DEV_SCENE_OFF_LOG === '1' ? DevSceneOff : dynamic(() => import('@/features/AppLogHome'));
const AuditLogHome = process.env.DEV_SCENE_OFF_LOG === '1' ? DevSceneOff : dynamic(() => import('@/features/AuditLogHome'));
const CmpGuide = process.env.DEV_SCENE_OFF_SYSTEM === '1' ? DevSceneOff : dynamic(() => import('@/features/CmpGuide'));
const CodeHome = process.env.DEV_SCENE_OFF_SYSTEM === '1' ? DevSceneOff : dynamic(() => import('@/features/CodeHome'));
const ErrorCodesHome = process.env.DEV_SCENE_OFF_SYSTEM === '1' ? DevSceneOff : dynamic(() => import('@/features/ErrorCodesHome'));
const JobLogHome = process.env.DEV_SCENE_OFF_LOG === '1' ? DevSceneOff : dynamic(() => import('@/features/JobLogList'));
const JobsHome = process.env.DEV_SCENE_OFF_LOG === '1' ? DevSceneOff : dynamic(() => import('@/features/JobList'));
const NavMenusHome = process.env.DEV_SCENE_OFF_SYSTEM === '1' ? DevSceneOff : dynamic(() => import('@/features/NavMenusHome'));
const NavPagesHome = process.env.DEV_SCENE_OFF_SYSTEM === '1' ? DevSceneOff : dynamic(() => import('@/features/NavPagesHome'));
const PdsEdit = process.env.DEV_SCENE_OFF_PDS === '1' ? DevSceneOff : dynamic(() => import('@/features/PdsEdit'));
const PdsHome = process.env.DEV_SCENE_OFF_PDS === '1' ? DevSceneOff : dynamic(() => import('@/features/PdsHome'));
const UserMgmtHome = process.env.DEV_SCENE_OFF_SYSTEM === '1' ? DevSceneOff : dynamic(() => import('@/features/UserMgmtHome'));
const RoleUserHome = process.env.DEV_SCENE_OFF_SYSTEM === '1' ? DevSceneOff : dynamic(() => import('@/features/RoleUserHome'));
const RoleSettingsHome = process.env.DEV_SCENE_OFF_SYSTEM === '1' ? DevSceneOff : dynamic(() => import('@/features/RoleSettingsHome'));
const PageApiRoleHome = process.env.DEV_SCENE_OFF_SYSTEM === '1' ? DevSceneOff : dynamic(() => import('@/features/PageApiRoleHome'));
const MsgMngHome = process.env.DEV_SCENE_OFF_SYSTEM === '1' ? DevSceneOff : dynamic(() => import('@/features/MsgMngHome'));
const MsgMngEnumHome = process.env.DEV_SCENE_OFF_SYSTEM === '1' ? DevSceneOff : dynamic(() => import('@/features/MsgMngEnumHome'));
const MainHome = dynamic(() => import('@/features/CloverMainHome'));
const LockMgmtHome = process.env.DEV_SCENE_OFF_SYSTEM === '1' ? DevSceneOff : dynamic(() => import('@/features/LockMgmtHome'), { ssr: false });
// rule
const ItemMgmtHome = process.env.DEV_SCENE_OFF_RULE === '1' ? DevSceneOff : dynamic(() => import('@/features/ItemMgmtHome'), { ssr: false });
const RuleTestHome = process.env.DEV_SCENE_OFF_RULE === '1' ? DevSceneOff : dynamic(() => import('@/features/RuleTestHome'), { ssr: false });
const RuleHome = process.env.DEV_SCENE_OFF_RULE === '1' ? DevSceneOff : dynamic(() => import('@/features/RuleHome'), { ssr: false });
const InterfaceMgmtHome = process.env.DEV_SCENE_OFF_RULE === '1' ? DevSceneOff : dynamic(() => import('@/features/InterfaceMgmtHome'), { ssr: false });
const RuleDeployHome = process.env.DEV_SCENE_OFF_RULE === '1' ? DevSceneOff : dynamic(() => import('@/features/RuleDeployHome'), {
  ssr: false,
});
const EmailTransInfoHome = process.env.DEV_SCENE_OFF_RULE === '1' ? DevSceneOff : dynamic(() => import('@/features/EmailTransInfoHome'), { ssr: false });
const RgstPop = process.env.DEV_SCENE_OFF_POPUP === '1' ? DevSceneOff : dynamic(() => import('@/features/RgstPop'), { ssr: false });
// POL-14-01 : 공통 프론트 경계 — 공통 팝업 컴포넌트 샘플(서버 없이 목록→편집→우측/모달 미리보기). 기존 '/rgst-pop' 경로는 그대로 둔다.
const PopupListSample = process.env.DEV_SCENE_OFF_POPUP === '1' ? DevSceneOff : dynamic(() => import('@/features/PopupcommonComponent/sample/PopupListSample'), { ssr: false });
const IS063M02Sample = process.env.DEV_SCENE_OFF_POPUP === '1' ? DevSceneOff : dynamic(() => import('@/features/PopupcommonComponent/sample/IS063M02Sample'), { ssr: false });
// POL-14-01 : 공통 프론트 경계 — 공통 컴포넌트 사용 안내·변경 공지 화면. 사이드바 메뉴는 db/oracle/20_popup_common_guide_menu_oracle.sql.
const PopupCommonGuide = process.env.DEV_SCENE_OFF_POPUP === '1' ? DevSceneOff : dynamic(() => import('@/features/PopupcommonComponent/guide/PopupCommonGuide'), { ssr: false });

export interface ISceneComponent {
  url: string;
  title: string;
  component: React.ComponentType | React.ReactNode;
}

/**
 * ■ 화면 목록 객체 생성
 * - in : scenes(Array<[url, title, component]>) 화면 정의 배열
 * - out: Record<string, ISceneComponent> url을 키로 한 화면 객체
 * - 배열을 받아 키가 url 이고 값이 {url, title, component} 인 객체를 리턴한다
 * - reduce가 사용됐기 때문에 한 객체안에 전체 키와 값이 들어감 (배열아님)
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
  ['/popup-common-sample', '팝업 공통 컴포넌트 샘플', PopupListSample],
  ['/popup-common-sample/is063m02', '컨텐츠 등록 샘플(IS063M02)', IS063M02Sample],
  ['/popup-common-guide', 'PopupcommonComponent 가이드', PopupCommonGuide],
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
