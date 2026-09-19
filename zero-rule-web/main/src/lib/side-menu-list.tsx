import { navigation } from '@local/ui';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import DescriptionIcon from '@mui/icons-material/Description';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import HomeIcon from '@mui/icons-material/Home';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import MonitorIcon from '@mui/icons-material/Monitor';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';

export const menuManager = navigation.configureSideMenus([
  {
    type: 'menu',
    icon: <HomeIcon />,
    title: "Today's FDS",
    href: '/todays-fds',
  },
  {
    type: 'section',
    icon: <MonitorIcon />,
    title: 'REVIEWER',
    submenus: [
      {
        type: 'menu',
        title: 'REVIEW SCREEN',
        href: '/review-screen',
      },
      {
        type: 'menu',
        title: 'REVIEWER별 처리현황 조회',
        href: '/review-process',
      },

      {
        type: 'menu',
        title: '가맹점 REVIEW',
        href: '/franchise-review',
      },
    ],
  },
  {
    type: 'section',
    icon: <FolderOutlinedIcon />,
    title: '룰 관리 ',
    submenus: [
      {
        type: 'menu',
        title: 'RULE 관리',
        href: '/rule-mgmt',
      },
      {
        type: 'menu',
        title: '인터페이스 정보 관리',
        href: '/interface-info-mgmt',
      },

      {
        type: 'menu',
        title: '비승인 룰 관리',
        href: '/disapproval-rule-mgmt',
      },
      {
        type: 'menu',
        title: '비승인 트리거 관리',
        href: '/disapproval-trigger-mgmt',
      },
      {
        type: 'menu',
        title: 'RULE TEMPLATE 관리',
        href: '/rule-template',
      },
      {
        type: 'menu',
        title: 'TEST RULE 조회',
        href: '/test-rule-search',
      },
      {
        type: 'menu',
        title: 'FDS LIST 관리',
        href: '/fds-list-template',
      },
      {
        type: 'menu',
        title: 'PAD RULE 조회',
        href: '/pad-rule-search',
      },
      {
        type: 'menu',
        title: 'EAI RULE ALERT',
        href: '/eai-rule-alert',
      },
      {
        type: 'menu',
        title: 'EAI RULE ERROR',
        href: '/eai-rule-error',
      },
      {
        type: 'menu',
        title: 'RULE 결과 관리',
        href: '/rule-result-mgmt',
      },
    ],
  },
  {
    type: 'section',
    icon: <MonitorIcon />,
    title: 'ALERT 관리',
    submenus: [
      {
        type: 'menu',
        title: '개발중',
        href: '/alert-inquiry',
      },
    ],
  },
  {
    type: 'section',
    icon: <DescriptionIcon />,
    title: '업무 관리',
    submenus: [
      {
        type: 'menu',
        title: '사용자 관리',
        href: '/user-mgmt',
      },
      {
        type: 'menu',
        title: 'BL 관리',
        href: '/bl-mgmt',
      },
      {
        type: 'menu',
        title: '권한 정의',
        href: '/perm-define',
      },
      {
        type: 'menu',
        title: '공통 코드',
        href: '/code',
      },
    ],
  },
  {
    type: 'section',
    icon: <ViewQuiltIcon />,
    title: '환경설정',
    submenus: [
      {
        type: 'menu',
        title: '설정',
        href: '/system-setting',
      },
    ],
  },
  {
    type: 'section',
    icon: <NoteAltIcon />,
    title: '선거절 관리',
    submenus: [
      {
        type: 'menu',
        title: '개발중',
        href: '/first-reject',
      },
    ],
  },

  {
    type: 'section',
    icon: <SettingsIcon />,
    title: 'MENU',
    submenus: [
      {
        type: 'menu',
        title: 'Nav 관리',
        href: '/nav/list',
      },
      {
        type: 'menu',
        title: '페이지 목록',
        href: '/nav/pages',
      },
    ],
  },
  {
    type: 'menu',
    icon: <HelpOutlineOutlinedIcon />,
    title: '도움말',
    href: '/help',
  },

  {
    type: 'menu',
    icon: <FilePresentIcon />,
    title: '자료실',
    href: '/pds/list',
  },
  {
    type: 'menu',
    icon: <FilePresentIcon />,
    title: 'Component 가이드',
    href: '/cmp-guide',
  },
  {
    type: 'menu',
    icon: <FilePresentIcon />,
    title: '에러 코드 관리',
    href: '/error-codes',
  },
  {
    type: 'section',
    icon: <AssignmentIcon />,
    title: '로그 관리',
    submenus: [
      {
        type: 'menu',
        title: 'AUDIT 로그',
        href: '/log/audit-logs',
      },
      {
        type: 'menu',
        title: 'Job 로그',
        href: '/log/jobs',
        match: (path) => path === '/log/jobs' || path === '/log/job-logs',
      },
      {
        type: 'menu',
        title: '시스템 로그',
        href: '/log/app-logs',
      },
    ],
  },
]);
