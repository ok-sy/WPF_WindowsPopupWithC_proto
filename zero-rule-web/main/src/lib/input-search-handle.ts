import { isEnterKeyEvent } from '@local/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
type Props<T> = {
  onSubmitData: (data: T) => void;
  reset?: T;
  spaceNotReset?: boolean;
};
/**
 * 검색 공통 함수 모듈입니다.(input타입 전용)
 * 제너릭 타입으로 동적 검색데이터 타입을 지정하여
 * 검색의 value 값과 변경값을 컨트롤하며,
 * 검색에 버튼과 엔터키 이벤드 함수 적용
 * @autor codingsb
 * @param onSubmitData: 검색 버튼 클릭시 함수에서 넘어오는 데이터 전달
 * @param reset: 초기화할 경우 기본 디폴트 데이터 적용
 * @returns
 * input 컴포넌트의 값 데이터 객체 : inputValues
 * input 컴포넌트의 값 변경 : handleChangeInput
 * 검색 버튼 클릭 함수 : handleClickSearchBtn
 * 엔터키 검색 함수 : handleKeyDownEnter
 * 리셋 버튼 클릭 함수 : handleClickReset
 */
export function InputSearchHandle<T>(props: Props<T>) {
  const onSubmitDataFnRef = useRef<Props<T>['onSubmitData']>();
  onSubmitDataFnRef.current = props.onSubmitData;
  const spaceNotResetFnRef = useRef<Props<T>['spaceNotReset']>();
  spaceNotResetFnRef.current = props.spaceNotReset;
  // 검색조건 입력 값들
  // 검색 입력 값이 바뀔때마다 변경하기 위해 사용
  const [inputValues, setInputValues] = useState<T>();
  const inputValuesFnRef = useRef<T>();
  inputValuesFnRef.current = inputValues;
  // pendingSubmitToken이 변경되면 검색한다. 0일때는 무시
  // 검색을 하기위해 사용
  const [pendingSubmitToken, setPendingSubmitToken] = useState<number>(0);
  // 검색 조건 입력값 갱신
  const updateInput = useCallback((part: Partial<T>) => {
    setInputValues((p) => ({ ...p, ...part }) as T);
  }, []);

  // input 컴포넌트의 값 변경
  const handleChangeInput = (field: keyof T) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    updateInput({ [field]: value } as T);
    // 검색중인 값이 없을 경우 리셋
    if (spaceNotResetFnRef.current !== true && value.length === 0) {
      setPendingSubmitToken(Date.now());
    }
  };

  // 검색 버튼 클릭
  const handleClickSearchBtn = () => {
    setPendingSubmitToken(Date.now());
  };

  // input 컴포넌트에서 엔터키를 누르면 검색한다
  const handleKeyDownEnter = (e: React.KeyboardEvent) => {
    if (isEnterKeyEvent(e)) {
      setPendingSubmitToken(Date.now());
    }
  };

  // 리셋 버튼 클릭
  const handleClickReset = () => {
    setInputValues(props.reset);
    setPendingSubmitToken(Date.now());
  };

  // pendingSubmitToken값이 변경되었을때 onSubmitData로 데이터 전달
  useEffect(() => {
    if (pendingSubmitToken > 0) {
      onSubmitDataFnRef.current?.(inputValuesFnRef.current as T);
    }
  }, [pendingSubmitToken, inputValuesFnRef, onSubmitDataFnRef]);

  const setInputValuesSetting = useCallback((data: T) => {
    setInputValues(data);
  }, []);

  return {
    inputValues,
    setInputValuesSetting,
    handleChangeInput,
    handleClickSearchBtn,
    handleKeyDownEnter,
    handleClickReset,
  };
}
