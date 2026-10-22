/**
 * ■ 데이터를 실어 새 창 열기
 * - in : url(string) 열 주소 · widthAndHeight(string) window.open 창 기능 문자열 · sendDataName(string) 데이터 이름(현재 사용 안 함) · sendData(any) 전달 데이터
 * - out: 없음 · 팝업 차단 시 alert 표시
 * - sendData를 JSON 문자열로 만들어 sendData 쿼리 파라미터로 붙인 뒤 새 창(_blank)으로 연다.
 */
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
