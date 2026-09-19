import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import { phttp } from '@local/util';
import { useRouter } from 'next/router';

export default function Index() {
  const router = useRouter();
  const pdsId = phttp.queryParamAsNumber(router.query?.pdsId, -1);
  const sceneProps =
    pdsId > 0
      ? {
          pdsId,
        }
      : undefined;

  return (
    <MainLayout>
      <PageToScene title={`자료실 ${pdsId > 0 ? '수정' : '등록'}`} sceneProps={sceneProps} />
    </MainLayout>
  );
}
