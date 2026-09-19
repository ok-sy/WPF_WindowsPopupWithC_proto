import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

const PwdMustChange = dynamic(() => import('@/features/PwdMustChange'));

const Index: NextPage = () => {
  return <PwdMustChange />;
};

export default Index;
