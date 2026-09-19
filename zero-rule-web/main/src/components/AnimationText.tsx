import { Typography } from '@mui/material';
import { useEffect, useState } from 'react';

type Props = {
  text?: string;
};
export default function AnimatedText(props: Props) {
  const { text } = props;
  const [triggerAnimation, setTriggerAnimation] = useState(0);

  useEffect(() => {
    // 값이 바뀔 때마다 모션 효과 다시 시작
    setTriggerAnimation(Date.now());

    const timeoutId = setTimeout(() => {
      setTriggerAnimation(0);
    }, 500); // 0.5초 후에 모션 끝

    return () => clearTimeout(timeoutId);
  }, [text]);

  return (
    <Typography
      variant="h6"
      color="#000"
      style={{
        transform: triggerAnimation ? 'scale(0.5)' : 'scale(1)',
        transition: 'transform 0.5s ease-in-out',
      }}
    >
      {text}
    </Typography>
  );
}
