export const openNextPageStorageSetData = (
  url: string,
  widthAndHeight: string,
  sendDataName: string,
  sendData: any,
) => {
  // 새 창 열기
  const data = JSON.stringify(sendData);
  const newWindow = window.open(
    `${url}?sendData=${encodeURIComponent(data)}`,
    '_blank',
    widthAndHeight,
  );
  // 팝업 차단이 활성화되어 있다면 사용자에게 메시지를 보여줄 수 있습니다.
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    alert('팝업 차단이 활성화되어 있습니다. 페이지를 열 수 없습니다.');
  }
};
