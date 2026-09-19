import MainLayout from '@/layouts/MainLayout';
import PageToScene from '@/scene/PageToScene';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

const RuleTestHome = dynamic(() => import('@/features/RuleTestHome'));

const RuleTest: NextPage = () => {
  return <RuleTestHome />;
};

export default RuleTest;
