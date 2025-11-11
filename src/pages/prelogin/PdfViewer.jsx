import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import FlipBookWrapper from "./Flipper";
import Lottie from "react-lottie";
import animationData from "../../assets/animation.json";
import {
  FaLongArrowAltLeft,
  FaLongArrowAltRight,
  FaMinus,
} from "react-icons/fa";
import { TiPlus } from "react-icons/ti";

const animationDefaultOptions = {
  loop: true,
  autoplay: true,
  animationData,
};
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs";
// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.mjs",
//   import.meta.url
// ).toString();

const CACHE_SIZE = 15;
const PRELOAD_AHEAD = 3;
const RENDER_SCALE = 1.5;
const JPEG_QUALITY = 0.7;

export default function PdfViewer({ url }) {
  const [pdf, setPdf] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1);
  const [renderedPages, setRenderedPages] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [pageDimensions, setPageDimensions] = useState(true);
  const [initial, setinitial] = useState(true);
  const [searchPageNum, setsearchPageNum] = useState("");

  const scaleref = useRef(null);
  const renderingQueue = useRef(new Set());
  const isInitialLoad = useRef(true);
  const pageRefs = useRef(new Map());
  const pageChangeTimer = useRef(null);

  // Load PDF document
  useEffect(() => {
    if (!!pageNum) {
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
    return () => {
      if (doc) {
        doc.destroy();
      }
    };
  }, [url]);

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

        // Check if we've navigated far away - cancel render
        if (Math.abs(pageNumber - pageNum) > PRELOAD_AHEAD + 3) {
          renderingQueue.current.delete(pageNumber);
          return null;
        }

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

        // Clean up canvas explicitly
        canvas.width = 0;
        canvas.height = 0;

        return imageData;
      } catch (error) {
        console.error(`Error rendering page ${pageNumber}:`, error);
        renderingQueue.current.delete(pageNumber);
        return null;
      }
    },
    [pdf, pageNum]
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
      if (pageRefs.current.size <= CACHE_SIZE) return;

      const start = Math.max(1, centerPage - CACHE_SIZE / 2);
      const end = Math.min(totalPages, centerPage + CACHE_SIZE / 2);

      // Remove pages outside the cache range from pageRefs
      const keysToDelete = [];
      pageRefs.current.forEach((_, pageNum) => {
        if (pageNum < start || pageNum > end) {
          keysToDelete.push(pageNum);
        }
      });

      keysToDelete.forEach((key) => {
        pageRefs.current.delete(key);
      });

      // Update renderedPages state
      const newCache = new Map();
      for (let i = start; i <= end; i++) {
        const pageData = pageRefs.current.get(i);
        if (pageData) {
          newCache.set(i, pageData);
        }
      }

      setRenderedPages(newCache);
    },
    [totalPages]
  );

  const handlePageChange = useCallback(
    (page) => {
      setPageNum(page);
      setinitial(false);

      // Debounce preloading and cleanup to prevent rapid fire issues
      if (pageChangeTimer.current) {
        clearTimeout(pageChangeTimer.current);
      }

      pageChangeTimer.current = setTimeout(() => {
        preloadPages(page);
        if (pageRefs.current.size > CACHE_SIZE) {
          cleanupCache(page);
        }
      }, 100);
    },
    [preloadPages, cleanupCache]
  );

  useEffect(() => {
    if (pdf && isInitialLoad.current) {
      preRenderInitialPages();
    }
  }, [pdf, preRenderInitialPages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pageChangeTimer.current) {
        clearTimeout(pageChangeTimer.current);
      }
      pageRefs.current.clear();
      renderingQueue.current.clear();
    };
  }, []);

  const zoomIn = () => setScale((s) => Math.min(s + 0.1, 1.2));
  const zoomOut = () => setScale((s) => Math.max(s - 0.1, 0.5));

  return (
    <>
      <div className="py-4">
        <div className="flex justify-between items-center px-5 mb-4 gap-2">
          {/* <div className="w-1/4 ">
          <input type="text"  placeholder="Search Page Number..." className="w-full p-5 h-[40px] outline-none border-none bg-blue-100 bg-gray-20 rounded-md" />

          </div> */}
          <div className="flex items-center w-full mr-10 justify-end  gap-2">
            <button
              onClick={zoomOut}
              className="flex text-2xl h-[40px] w-[40px] justify-center items-center rounded-full  cursor-pointer z-50 bg-[#3661fd] text-white"
            >
              <FaMinus className="text-2xl" />
            </button>
            <span className="text-gray-700 font-bold dark:text-gray-700">
              {(scale * 100).toFixed(0)}%
            </span>
            <button
              onClick={zoomIn}
              className="flex text-xl h-[40px] w-[40px] justify-center items-center rounded-full  cursor-pointer z-50 bg-[#3661fd] text-white"
            >
              <TiPlus className="text-2xl" />
            </button>
          </div>
        </div>

        <div
          ref={scaleref}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
          className="flex justify-center  items-center w-full"
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
                className={`transition-opacity outline-none border-none duration-700 ease-in-out ${
                  pageNum <= 1 ? "opacity-100 flex" : "opacity-0 hidden"
                } text-white bg-black/70 transition-all duration-300 text-md lg:text-xl text-center bottom-1/3 w-auto text-xs z-50 mx-auto fixed font-extrabold gap-x-10 justify-center items-center rounded-lg backdrop-blur-sm p-4`}
              >
                <FaLongArrowAltLeft />
                <p>Click or Swipe to Read</p>
                <FaLongArrowAltRight />
              </div>
              <div
                className={`h-full  outline-none border-none mx-auto flex w-full transition-all duration-300`}
              >
                <FlipBookWrapper
                  singlePage={true}
                  className={`
                  w-full outline-none   mdx:-mx-0 border-none 
                  ${pageNum <= 1 ? "mdx:-mx-[25%]" : "mdx:-mx-0"}
                    overflow-hidden transition-all m-auto duration-500`}
                  currentPage={pageNum}
                  onPageChange={handlePageChange}
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNumber) => {
                      const imageData = pageRefs.current.get(pageNumber);
                      return (
                        <div
                          key={pageNumber}
                          className="w-full h-full outline-none border-none flex overflow-hidden bg-transparent"
                          style={{
                            width: pageDimensions?.width || "auto",
                            height: pageDimensions?.height || "auto",
                          }}
                        >
                          {imageData ? (
                            <div
                              style={{ backgroundImage: `url(${imageData})` }}
                              className="h-full w-full outline-none border-none bg-no-repeat m-auto bg-center  bg-contain object-cover"
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
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex m-auto  justify-center text-lg items-center gap-2">
        <span className="text-gray-700 dark:text-gray-600 font-semibold">
          Pages {pageNum} / {totalPages || "…"}
        </span>
      </div>
    </>
  );
}
