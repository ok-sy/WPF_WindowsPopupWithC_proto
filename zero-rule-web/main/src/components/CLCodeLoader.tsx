import { useApi } from '@/provider';
import type { CLCode } from '@local/domain';
import { useEffect, useState } from 'react';

/**
 * 공통 코드의 타입을 받아
 * 해당 코드목록에 데이터를 retrun
 */
export default function CLCodeLoader(codeType: string) {
  const api = useApi();
  const [codeData, setCodeData] = useState<CLCode[]>();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const codeApi = await api.clCode.search({
          rowsPerPage: 9999,
          pageNumber: 0,
          codeType: codeType,
        });
        setCodeData(codeApi.body.pagerData.elements);
      } catch (error) {
        console.error('Error fetching team data:', error);
      }
    };

    fetchData(); // 컴포넌트가 마운트될 때 한 번만 데이터를 가져오도록 함
  }, [api, codeType]); // 빈 배열을 넣어 한 번만 호출하도록 함
  if (!codeData) return;
  return codeData;
}
