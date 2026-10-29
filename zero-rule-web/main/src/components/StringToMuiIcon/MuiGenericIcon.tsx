import type * as icons from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import Adb from '@mui/icons-material/Adb';
import AirportShuttle from '@mui/icons-material/AirportShuttle';
import Assignment from '@mui/icons-material/Assignment';
import AutoAwesomeMosaic from '@mui/icons-material/AutoAwesomeMosaic';
import Autorenew from '@mui/icons-material/Autorenew';
import Call from '@mui/icons-material/Call';
import Cloud from '@mui/icons-material/Cloud';
import Description from '@mui/icons-material/Description';
import Diamond from '@mui/icons-material/Diamond';
import Drafts from '@mui/icons-material/Drafts';
import Email from '@mui/icons-material/Email';
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import FilePresent from '@mui/icons-material/FilePresent';
import FolderOutlined from '@mui/icons-material/FolderOutlined';
import GppGood from '@mui/icons-material/GppGood';
import HealthAndSafety from '@mui/icons-material/HealthAndSafety';
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined';
import Home from '@mui/icons-material/Home';
import Instagram from '@mui/icons-material/Instagram';
import LaptopChromebook from '@mui/icons-material/LaptopChromebook';
import LocalPolice from '@mui/icons-material/LocalPolice';
import ManageSearch from '@mui/icons-material/ManageSearch';
import Monitor from '@mui/icons-material/Monitor';
import NoteAlt from '@mui/icons-material/NoteAlt';
import People from '@mui/icons-material/People';
import Person from '@mui/icons-material/Person';
import Settings from '@mui/icons-material/Settings';
import ViewQuilt from '@mui/icons-material/ViewQuilt';
import Work from '@mui/icons-material/Work';
import ZoomIn from '@mui/icons-material/ZoomIn';

export type IconNames = keyof typeof icons;

/**
 * 메뉴·페이지 아이콘 이름 → MUI 아이콘 컴포넌트.
 * - 이전의 `import * as icons from '@mui/icons-material'`은 아이콘 1만여 개 모듈을 사이드바가 있는 모든 화면 컴파일에 포함시켜
 *   개발 서버 첫 컴파일을 크게 늦췄다. 실제로 쓰는 이름만 개별 경로로 import한다.
 * - 등록 기준: 아이콘 선택 목록(IconSelectPaper/icon-collection의 DEFAULT_ICON_LIST) + DB 메뉴 아이콘
 *   (CLOVER_PAGE_SECTION.icon·CLOVER_PAGE.icon, 원격 개발 DB 2026-10-29 조회: 선택 목록 밖 값은 LocalPolice).
 * - 아이콘 추가: import 한 줄과 아래 항목 하나를 넣는다. 선택 화면에 노출하려면 DEFAULT_ICON_LIST에도 추가한다.
 * - 등록되지 않은 이름은 아무것도 그리지 않는다(이전에는 undefined 컴포넌트를 렌더링해 화면 오류).
 */
const MENU_ICONS: Partial<Record<IconNames, SvgIconComponent>> = {
  Adb,
  AirportShuttle,
  Assignment,
  AutoAwesomeMosaic,
  Autorenew,
  Call,
  Cloud,
  Description,
  Diamond,
  Drafts,
  Email,
  FavoriteBorder,
  FilePresent,
  FolderOutlined,
  GppGood,
  HealthAndSafety,
  HelpOutlineOutlined,
  Home,
  Instagram,
  LaptopChromebook,
  LocalPolice,
  ManageSearch,
  Monitor,
  NoteAlt,
  People,
  Person,
  Settings,
  ViewQuilt,
  Work,
  ZoomIn,
};

interface IGenericIconProps {
  iconName: IconNames;
}
export const MuiGenericIcon = ({ iconName }: IGenericIconProps): JSX.Element | null => {
  const Icon = MENU_ICONS[iconName];
  if (!Icon) return null;
  return <Icon />;
};
