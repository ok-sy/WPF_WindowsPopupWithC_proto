import { useMainLayoutContext } from '@/layouts/MainLayout/MainLayoutContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

type Props = {
  title: string;
  url?: string;
  sceneProps?: any;
};

/**
 * nextjs의 page를 sceneManager에 제공
 * scene-router.tsx에 컴포넌트를 등록해주세요
 */
export default function PageToScene(props: Props) {
  const { title, url, sceneProps } = props;

  // pathname과 asPath의 차이점
  // pathname=/code, asPath=/code/
  // pathname=/pds/edit/[pdsId] , asPath=/pds/edit/1234
  const { pathname, asPath } = useRouter();
  const { sceneManager } = useMainLayoutContext();

  console.log('<PageToScene/>', { pathname, asPath });

  useEffect(() => {
    sceneManager.addScene(url ?? pathname, sceneProps);
  }, [pathname, sceneManager, sceneProps, url, title]);

  return null;
}
