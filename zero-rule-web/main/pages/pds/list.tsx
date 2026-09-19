import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import { phttp } from '@local/util';
import { useRouter } from 'next/router';

export default function Index() {
  const router = useRouter();
  const pdsId = phttp.queryParamAsNumber(router.query?.pdsId, -1);

  // pdsId 파라미터를 넘기면 목록 조회에서 팝업을 띄움
  const sceneProps = {
    pdsId: pdsId > 0 ? pdsId : undefined,
  };

  return (
    <MainLayout title="자료실">
      <PageToScene title="자료실" sceneProps={sceneProps} />
    </MainLayout>
  );
}
