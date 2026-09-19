export const getTruncatedTitle = (text: string, width: number): string => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return text;

  context.font = '16px Arial'; // Set the font size and style to match your TableCell typography
  const ellipsis = '...';
  const ellipsisWidth = context.measureText(ellipsis).width;

  let truncatedText = text;
  let textWidth = context.measureText(text).width;

  while (textWidth > width && truncatedText.length > 0) {
    truncatedText = truncatedText.slice(0, -1);
    textWidth = context.measureText(truncatedText).width + ellipsisWidth;
  }

  return truncatedText;
};
