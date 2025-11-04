import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?worker";
import FlipBookWrapper from "./Flipper";
import Lottie from "react-lottie";
import animationData from "../../assets/animation.json";
import { FaLongArrowAltLeft, FaLongArrowAltRight } from "react-icons/fa";

const animationDefaultOptions = {
  loop: true,
  autoplay: true,
  animationData,
};
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

// Configuration
const CACHE_SIZE = 20;
const PRELOAD_AHEAD = 5;
const RENDER_SCALE = 1.5;

export default function PdfViewer({ url }) {
  const [pdf, setPdf] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1);
  const [renderedPages, setRenderedPages] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [pageDimensions, setPageDimensions] = useState(true);

  const scaleref = useRef(null);
  const renderingQueue = useRef(new Set());
  const isInitialLoad = useRef(true);
  const pageRefs = useRef(new Map());

  // Load PDF document
  useEffect(() => {
    if(!!pageNum){
      console.log("true")
    }
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const doc = await pdfjsLib.getDocument(url).promise;
        setPdf(doc);
        setTotalPages(doc.numPages);

        // Get first page dimensions for consistent sizing
        const firstPage = await doc.getPage(1);
        const viewport = firstPage.getViewport({ scale: RENDER_SCALE });
        setPageDimensions({
          width: viewport.width,
          height: viewport.height,
        });
      } catch (error) {
        console.error("Error loading PDF:", error);
        setIsLoading(false);
      }
    };
    loadPdf();
  }, []);

  useEffect(() => {
    if (scaleref.current) {
      scaleref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [totalPages]);

  const renderPage = useCallback(
    async (pageNumber) => {
      if (!pdf || renderingQueue.current.has(pageNumber)) {
        return null;
      }

      if (pageRefs.current.has(pageNumber)) {
        return pageRefs.current.get(pageNumber);
      }

      try {
        renderingQueue.current.add(pageNumber);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", {
          alpha: false,
          willReadFrequently: false,
        });

        if (!ctx) {
          renderingQueue.current.delete(pageNumber);
          return null;
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise;

        const imageData = canvas.toDataURL("image/jpeg", 0.85);
        pageRefs.current.set(pageNumber, imageData);
        renderingQueue.current.delete(pageNumber);
        return imageData;
      } catch (error) {
        console.error(`Error rendering page ${pageNumber}:`, error);
        renderingQueue.current.delete(pageNumber);
        return null;
      }
    },
    [pdf]
  );

  const preRenderInitialPages = useCallback(async () => {
    if (!pdf) return;
    const pagesToRender = Math.min(10, totalPages);
    const newPages = new Map();

    for (let i = 1; i <= pagesToRender; i++) {
      const imageData = await renderPage(i);
      if (imageData) {
        newPages.set(i, imageData);
      }
    }

    setRenderedPages(newPages);
    setIsLoading(false);
    isInitialLoad.current = false;
  }, [pdf, totalPages, renderPage]);

  // Preload pages around current page
  const preloadPages = useCallback(
    async (centerPage) => {
      if (!pdf) return;
      const start = Math.max(1, centerPage - 2);
      const end = Math.min(totalPages, centerPage + PRELOAD_AHEAD);
      const newPages = new Map(renderedPages);
      let hasNewPages = false;

      for (let i = start; i <= end; i++) {
        if (!pageRefs.current.has(i) && !renderingQueue.current.has(i)) {
          const imageData = await renderPage(i);
          if (imageData) {
            newPages.set(i, imageData);
            hasNewPages = true;
          }
        }
      }

      if (hasNewPages) {
        setRenderedPages(newPages);
      }
    },
    [pdf, totalPages, renderedPages, renderPage]
  );

  // Clean up old pages from memory
  const cleanupCache = useCallback(
    (centerPage) => {
      if (renderedPages.size <= CACHE_SIZE) return;
      const newCache = new Map();
      const start = Math.max(1, centerPage - CACHE_SIZE / 2);
      const end = Math.min(totalPages, centerPage + CACHE_SIZE / 2);

      for (let i = start; i <= end; i++) {
        const pageData = pageRefs.current.get(i);
        if (pageData) {
          newCache.set(i, pageData);
        }
      }

      setRenderedPages(newCache);
    },
    [totalPages, renderedPages.size]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (page) => {
      setPageNum(page);
      preloadPages(page);
      if (renderedPages.size > CACHE_SIZE) {
        cleanupCache(page);
      }
    },
    [preloadPages, cleanupCache, renderedPages.size]
  );

  useEffect(() => {
    if (pdf && isInitialLoad.current) {
      preRenderInitialPages();
    }
  }, [pdf, preRenderInitialPages]);

  const zoomIn = () => setScale((s) => Math.min(s + 0.1, 1.2));
  const zoomOut = () => setScale((s) => Math.max(s - 0.1, 0.5));

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-700 dark:text-gray-600">
            Pages {pageNum} / {totalPages || "…"}
          </span>
          <span className="text-xs text-gray-500">
            ({renderedPages.size} cached)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="px-2 py-1 flex justify-center items-center cursor-pointer z-50 bg-[#3661fd] text-white rounded-sm `"
          >
            −
          </button>
          <span className="text-gray-700 dark:text-gray-500">
            {(scale * 100).toFixed(0)}%
          </span>
          <button
            onClick={zoomIn}
            className="px-2 py-1 z-50 flex justify-center items-center cursor-pointer bg-[#3661fd] text-white rounded-sm "
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={scaleref}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
        className="flex justify-center items-center w-full"
      >
        {isLoading ? (
          <div className="flex justify-center text-center items-center py-8">
            <span className="text-gray-600">
              <Lottie
                className=""
                isClickToPauseDisabled={true}
                height={300}
                width={300}
                options={animationDefaultOptions}
              />
            </span>
          </div>
        ) : (
          <>
            <div
              className={`transition-opacity duration-700 ease-in-out ${
                pageNum <= 1 ? "opacity-100 flex" : "opacity-0 hidden"
              } text-white bg-black/70 transition-all duration-300 text-lg lg:text-xl text-center top-1/4 w-1/3 z-50 my-5 mx-auto fixed font-extrabold gap-x-10 justify-center items-center rounded-lg backdrop-blur-sm p-4`}
            >
              <FaLongArrowAltLeft />
              <p>Click or Swipe to Read</p>
              <FaLongArrowAltRight />
            </div>
            <FlipBookWrapper
              singlePage={true}
              className={`w-full ${
                pageNum <= 1 && "md:-translate-x-full bg-red-500" 
              } mb-20 overflow-hidden transition-all duration-500`}
              currentPage={pageNum}
              onPageChange={handlePageChange}
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNumber) => {
                  const imageData = pageRefs.current.get(pageNumber);
                  return (
                    <div
                      key={pageNumber}
                      className="w-full h-full flex overflow-hidden bg-white"
                      style={{
                        width: pageDimensions?.width || "auto",
                        height: pageDimensions?.height || "auto",
                      }}
                    >
                      {imageData ? (
                        <div
                          style={{ backgroundImage: `url(${imageData})` }}
                          className="h-full w-full bg-no-repeat m-auto bg-center overflow-auto bg-contain object-cover"
                        ></div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-gray-500">
                            Loading page {pageNumber}...
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </FlipBookWrapper>
          </>
        )}
      </div>
    </div>
  );
}
