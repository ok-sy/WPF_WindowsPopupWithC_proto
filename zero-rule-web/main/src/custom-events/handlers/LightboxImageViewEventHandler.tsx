import type { ImageViewLightboxProps } from '@/components/ImageViewLightbox';
import ImageViewLightbox from '@/components/ImageViewLightbox';
import { useCallback, useEffect, useState } from 'react';

type DialogId = 'ImageViewLightbox';

export default function LightboxImageViewEventHandler() {
  const [imageViewDialogProps, setImageViewDialogProps] = useState<ImageViewLightboxProps>();
  const [dialogId, setDialogId] = useState<DialogId>();

  const handleCloseDialog = useCallback(() => {
    setDialogId(undefined);
    setImageViewDialogProps(undefined);
  }, []);

  const openImageViewer = useCallback(
    (imageUrl: string) => {
      setDialogId('ImageViewLightbox');
      setImageViewDialogProps({
        open: true,
        imageUrls: [imageUrl],
        startIndex: 0,
        onClose: handleCloseDialog,
      });
    },
    [handleCloseDialog],
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!event.target) return;
      const { target } = event;
      if ((target as any)['tagName'] !== 'IMG') return;
      if (event.defaultPrevented) return;
      const img = target as HTMLImageElement;
      if (img.closest('div.lightbox-parent')) {
        openImageViewer(img.src);
      } else {
        if (!img.matches('.lightbox')) return;
        const imageUrl = img.dataset['lightboxUrl'] ?? img.src;
        openImageViewer(imageUrl);
      }
    };
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
    };
  }, [openImageViewer]);

  if (dialogId === 'ImageViewLightbox' && imageViewDialogProps) {
    return <ImageViewLightbox {...imageViewDialogProps} />;
  }
  return null;
}
