import { useEffect, useRef, useState } from 'react';
import { useUnmount } from 'react-use';

/**
 * 시간이 지나면 자동으로 사라지는 데이터
 * @param timeoutMs
 * @returns
 */
export function useTimeoutData<T>(timeoutMs: number): [T | null, (t: T | null) => void] {
  const [text, setText] = useState<T | null>(null);
  const [message, setMessage] = useState<T | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useUnmount(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  });

  useEffect(() => {
    if (!text) {
      // 타이머를 종료하지 않는다.
      return;
    }

    // 새로운 메시지가 오면 타이머를 종료한다
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setMessage(text);
    timerRef.current = setTimeout(() => {
      setMessage(null);
      setText(null);
    }, timeoutMs);
    return () => {
      // clearTimeout(timer)
    };
  }, [text, timeoutMs]);
  return [message, setText];
}
