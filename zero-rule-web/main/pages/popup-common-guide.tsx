import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';

/* 주소로 직접 들어올 때의 페이지. 사이드바에서는 scene-router의 '/popup-common-guide' 탭으로 열린다. */
const PopupCommonGuidePage: NextPage = () => {
  return (
    <MainLayout>
      <PageToScene title="PopupcommonComponent 가이드" />
    </MainLayout>
  );
};

export default PopupCommonGuidePage;
