import React, { useState } from "react";
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
  const [isBookView, setIsBookView] = useState(false);
  const handleFlip = (e) => {
    if (onPageChange) {
      onPageChange(e.data + 1);
    }
  };

  return (
    <HTMLFlipBook
      size="stretch"
      width={400}
      height={600}
      minWidth={315}
      maxWidth={1000}
      maxHeight={1000}
      minHeight={400}
      showCover={true}
      usePortrait={true}
      onChangeOrientation={(e) => {
        const orientation = e.data;
        setIsBookView(orientation === "landscape");
        console.log(
          "Current view:",
          orientation === "landscape" ? "Book" : "Single"
        );
      }}
      style={{}}
      startPage={0}
      drawShadow={true}
      flippingTime={1000}
      startZIndex={0}
      autoSize={true}
      maxShadowOpacity={0.5}
      mobileScrollSupport={true}
      clickEventForward={true}
      useMouseEvents={true}
      swipeDistance={30}
      showPageCorners={true}
      disableFlipByClick={false}
      className={className}
      onFlip={handleFlip}
      onChangeState={onChangeState}
      {...rest}
    >
      {children}
    </HTMLFlipBook>
  );
};

export default FlipBookWrapper;
