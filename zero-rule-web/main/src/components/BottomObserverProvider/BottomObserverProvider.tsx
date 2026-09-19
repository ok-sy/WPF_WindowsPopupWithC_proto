import { useMainLayoutContext } from '@/layouts/MainLayout/MainLayoutContext';
import Bottombar from '@/layouts/MainLayout/components/Bottombar';
import errorHandleStore from '@local/domain/src/ErrorHandleStore';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import { useObservable } from 'react-use';

type Props = { isSidebarOpen: boolean };
const BottomErrorObserveProvider = observer((props: Props) => {
  const { isSidebarOpen } = props;
  const { clearError, error } = errorHandleStore;
  const { sceneManager } = useMainLayoutContext();
  const currentPage = useObservable(sceneManager.observeCurrentSceneOrNull(), null);

  const errorData = useMemo(() => {
    if (!error) {
      return null;
    }
    return error;
  }, [error]);
  const pageIdtest = useMemo(() => {
    if (!error) {
      return;
    }
    if (!currentPage) {
      return;
    }
    if (error && currentPage) {
      return currentPage.pageKey;
    }
    return currentPage.pageKey;
  }, [error, currentPage]);

  return (
    <Bottombar
      pId={pageIdtest}
      isSidebarOpen={isSidebarOpen}
      error={errorData}
      clearError={clearError}
    />
  );
});

export default BottomErrorObserveProvider;
