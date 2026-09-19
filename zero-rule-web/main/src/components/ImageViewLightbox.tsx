import { LightboxImageOpenedEvent } from '@/custom-events';
import { pnumber } from '@cp949/pjs';
import { useEffect, useMemo, useState } from 'react';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';

export type ImageViewLightboxProps = {
  open: boolean;
  imageUrls: string[];
  startIndex: number;
  disableEscKeydown?: boolean;
  onClose: () => void;
};

type ImageItem = {
  url: string;
  prev?: string;
  next?: string;
};

/**
 * 이미지 URL목록을 링크드리스트로 만든다
 */
const makeLinkedList = (urls: string[]): ImageItem[] => {
  const list: ImageItem[] = [];
  const total = urls.length;
  for (let i = 0; i < total; i++) {
    list.push({
      url: urls[i],
      prev: i - 1 >= 0 ? urls[i - 1] : undefined,
      next: i + 1 < total ? urls[i + 1] : undefined,
    });
  }
  return list;
};

export default function ImageViewLightbox(props: ImageViewLightboxProps) {
  const { open, onClose, disableEscKeydown = false, imageUrls = [], startIndex = 0 } = props;
  const [slidingIndex, setSlidingIndex] = useState(() => startIndex);
  const imageItems = useMemo(() => makeLinkedList(imageUrls), [imageUrls]);

  useEffect(() => {
    LightboxImageOpenedEvent.send({ opened: true });
    return () => {
      LightboxImageOpenedEvent.send({ opened: false });
    };
  }, []);

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (open) {
      if (!imageUrls || imageUrls.length === 0) {
        onClose();
      }
    }
  }, [open, onClose, imageUrls]);

  const handleMoveNextRequest = () => {
    setSlidingIndex(pnumber.clamp(slidingIndex + 1, 0, imageItems.length - 1));
  };

  const handleMovePrevRequest = () => {
    setSlidingIndex(pnumber.clamp(slidingIndex - 1, 0, imageItems.length - 1));
  };

  useEffect(() => {
    if (disableEscKeydown) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [disableEscKeydown, onClose]);

  if (!open) {
    return null;
  }

  const currentItem: ImageItem = imageItems[slidingIndex];
  const pageNumText =
    imageItems.length > 1 ? `${slidingIndex + 1} / ${imageItems.length}` : undefined;
  return (
    currentItem && (
      <Lightbox
        mainSrc={currentItem.url}
        prevSrc={currentItem.prev}
        nextSrc={currentItem.next}
        onMoveNextRequest={handleMoveNextRequest}
        onMovePrevRequest={handleMovePrevRequest}
        imageCaption={pageNumText}
        onCloseRequest={handleClose}
        reactModalStyle={{ overlay: { zIndex: 1500 } }}
      />
    )
  );
}
