import { useTimeoutData } from '@local/ui';
import { useRef } from 'react';
import { useCopyToClipboard } from 'react-use';
import type { BbsButtonProps } from './BbsButton';
import BbsButton from './BbsButton';

type Props = {
  textProviderFunc: () => string | undefined | null;
} & BbsButtonProps;

export default function BbsClipboardButton(props: Props) {
  const { textProviderFunc, disabled, ...restProps } = props;
  const textProviderFn = useRef<any>();
  textProviderFn.current = textProviderFunc;
  const [, copyToClipboard] = useCopyToClipboard();
  const [visibleCopied, setVisibleCopied] = useTimeoutData<boolean>(1000);

  const handleClickCopyButton = () => {
    const text = textProviderFn.current?.();
    if (text && text.length > 0) {
      copyToClipboard(text);
      setVisibleCopied(true);
    }
  };

  const visible = visibleCopied ?? false;
  return (
    <BbsButton
      disabled={disabled || visible}
      variant={visible ? 'text' : 'outlined'}
      style={{ color: visible ? '#888' : undefined }}
      onClick={handleClickCopyButton}
      text={visible ? 'Copied' : '주소복사'}
      {...restProps}
    />
  );
}
