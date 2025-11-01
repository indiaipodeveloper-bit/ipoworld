import React from "react";
import HTMLFlipBook from "react-pageflip";

const FlipBookWrapper = ({
  currentPage,
  onPageChange,
  children,
  onFlip,
  onChangeOrientation,
  onChangeState,
  className = "",
  ...rest
}) => {
  const handleFlip = (e) => {
    if (onPageChange) {
      onPageChange(e.data + 1);
    }
  };

  return (
    <HTMLFlipBook
      size="stretch"
      height={600}
      width={600}
      minWidth={400}
      maxWidth={1200}
      minHeight={400}
      maxHeight={1200}
      style={{}}
      startPage={0}
      drawShadow={true}
      flippingTime={1000}
      usePortrait={true}
      startZIndex={0}
      autoSize={true}
      maxShadowOpacity={0.5}
      showCover={true}
      mobileScrollSupport={true}
      clickEventForward={true}
      useMouseEvents={true}
      swipeDistance={30}
      showPageCorners={true}
      disableFlipByClick={false}
      className={className}
      onFlip={handleFlip}
      onChangeOrientation={onChangeOrientation}
      onChangeState={onChangeState}
      {...rest}
    >
      {children}
    </HTMLFlipBook>
  );
};

export default FlipBookWrapper;
