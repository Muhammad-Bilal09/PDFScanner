import { Paths } from "expo-file-system";
import {
    downloadAsync,
    EncodingType,
    getInfoAsync,
    readAsStringAsync,
    writeAsStringAsync,
} from "expo-file-system/legacy";

const documentDirectory = Paths.document.uri.endsWith("/")
  ? Paths.document.uri
  : Paths.document.uri + "/";
const cacheDirectory = Paths.cache.uri.endsWith("/")
  ? Paths.cache.uri
  : Paths.cache.uri + "/";

export interface Point {
  x: number; // Normalized coordinate between 0 and 1
  y: number; // Normalized coordinate between 0 and 1
}

export interface EdgeDetectionResult {
  points: Point[];
  width: number;
  height: number;
}

// CDNs for online loading and initial downloading
const OPENCV_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/opencv.js/4.5.4/opencv.js";

// Local paths to save files for offline availability
export const OPENCV_LOCAL_PATH = documentDirectory + "opencv_v4.5.4.js";

// Active listeners and task registration map
type TaskCallback = {
  resolve: (data: any) => void;
  reject: (err: any) => void;
};
const pendingTasks = new Map<string, TaskCallback>();
let webViewRef: any = null;
let isProcessorReady = false;
const readyCallbacks: (() => void)[] = [];

/**
 * Register the WebView ref to enable message passing.
 */
export function registerWebView(ref: any) {
  webViewRef = ref;
}

/**
 * Set the processor ready state.
 */
export function setProcessorReady(ready: boolean) {
  isProcessorReady = ready;
  if (ready) {
    console.log("[Processor] Image engine is ready and active.");
    readyCallbacks.forEach((cb) => cb());
    readyCallbacks.length = 0;
  }
}

/**
 * Wait until OpenCV is loaded in the WebView.
 */
export function waitTaskEngineReady(): Promise<void> {
  return new Promise((resolve) => {
    if (isProcessorReady) {
      resolve();
    } else {
      readyCallbacks.push(resolve);
    }
  });
}

/**
 * Handle incoming postMessage from WebView.
 */
export function handleWebViewMessage(eventDataString: string) {
  try {
    const event = JSON.parse(eventDataString);
    const { taskId, type, data, error } = event;

    if (type === "ENGINE_READY") {
      setProcessorReady(true);
      return;
    }

    const task = pendingTasks.get(taskId);
    if (!task) return;

    if (type === "ERROR" || error) {
      task.reject(new Error(error || "WebView processing error"));
    } else {
      task.resolve(data);
    }
    pendingTasks.delete(taskId);
  } catch (err) {
    console.error("[Processor] Error parsing message from WebView:", err);
  }
}

/**
 * Check and download OpenCV.js for offline mode.
 */
export async function downloadOfflineLibraries(
  onProgress?: (val: number) => void,
): Promise<void> {
  try {
    const cvInfo = await getInfoAsync(OPENCV_LOCAL_PATH);

    if (!cvInfo.exists) {
      console.log(
        "[Processor] Downloading OpenCV.js locally for offline support...",
      );
      onProgress?.(0.1);
      await downloadAsync(OPENCV_CDN, OPENCV_LOCAL_PATH);
      console.log("[Processor] OpenCV.js downloaded.");
    }

    onProgress?.(1.0);
    console.log("[Processor] Offline libraries are ready.");
  } catch (err) {
    console.error("[Processor] Offline asset pre-download failed:", err);
  }
}

/**
 * Send a structured request to the WebView and await the result via a Promise.
 */
function sendTaskToWebView<T>(type: string, payload: any): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isProcessorReady) {
        await new Promise<void>((res, rej) => {
          const timeout = setTimeout(() => {
            rej(new Error("Image processing engine initialization timed out."));
          }, 5000);

          readyCallbacks.push(() => {
            clearTimeout(timeout);
            res();
          });
        });
      }
    } catch (e: any) {
      return reject(
        new Error(
          e.message || "Image processing engine is loading. Please try again.",
        ),
      );
    }

    if (!webViewRef) {
      return reject(
        new Error(
          "WebView processor not registered. Make sure GlobalProcessor is mounted in RootLayout.",
        ),
      );
    }

    const taskId = `task_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    // Set a timeout for the task execution itself (e.g. 8 seconds)
    const taskTimeout = setTimeout(() => {
      pendingTasks.delete(taskId);
      reject(new Error("Image processing operation timed out."));
    }, 8000);

    pendingTasks.set(taskId, {
      resolve: (data) => {
        clearTimeout(taskTimeout);
        resolve(data);
      },
      reject: (err) => {
        clearTimeout(taskTimeout);
        reject(err);
      },
    });

    const message = JSON.stringify({ taskId, type, payload });
    webViewRef.postMessage(message);
  });
}

/**
 * Public high-level image manipulation and scanning APIs.
 */
export const ImageProcessor = {
  /**
   * Run edge detection algorithm on an image.
   * @returns List of 4 normalized corner coordinates + image resolution.
   */
  async detectEdges(imageUri: string): Promise<EdgeDetectionResult> {
    const base64 = await readAsStringAsync(imageUri, {
      encoding: EncodingType.Base64,
    });
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    return sendTaskToWebView<EdgeDetectionResult>("DETECT_EDGES", {
      imageBase64: dataUrl,
    });
  },

  /**
   * Warp perspective of coordinates and apply image filters.
   * @returns Path to the newly saved warped image file.
   */
  async warpAndEnhance(
    imageUri: string,
    corners: Point[],
    filter: string,
  ): Promise<string> {
    try {
      const base64 = await readAsStringAsync(imageUri, {
        encoding: EncodingType.Base64,
      });
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      const result = await sendTaskToWebView<{ image: string }>(
        "WARP_PERSPECTIVE",
        {
          imageBase64: dataUrl,
          corners,
          filter,
        },
      );

      // Strip out the dataURL header to save as file
      const cleanBase64 = result.image.replace(/^data:image\/jpeg;base64,/, "");
      const filename = `processed_${Date.now()}_${Math.floor(Math.random() * 100)}.jpg`;
      const newUri = cacheDirectory + filename;
      await writeAsStringAsync(newUri, cleanBase64, {
        encoding: EncodingType.Base64,
      });

      return newUri;
    } catch (e) {
      console.warn(
        "[Processor] warpAndEnhance failed, falling back to original image:",
        e,
      );
      // Fallback: return the original image URI so the document is still saved
      return imageUri;
    }
  },

  /**
   * Adjust brightness, contrast, saturation, and sharpness of an image.
   * @returns Path to the newly saved adjusted image file.
   */
  async adjustImage(
    imageUri: string,
    params: {
      brightness: number;
      contrast: number;
      saturation: number;
      sharpness: number;
    },
  ): Promise<string> {
    try {
      const base64 = await readAsStringAsync(imageUri, {
        encoding: EncodingType.Base64,
      });
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      const result = await sendTaskToWebView<{ image: string }>(
        "ADJUST_IMAGE",
        {
          imageBase64: dataUrl,
          ...params,
        },
      );

      const cleanBase64 = result.image.replace(/^data:image\/jpeg;base64,/, "");
      const filename = `adjusted_${Date.now()}_${Math.floor(Math.random() * 100)}.jpg`;
      const newUri = cacheDirectory + filename;
      await writeAsStringAsync(newUri, cleanBase64, {
        encoding: EncodingType.Base64,
      });

      return newUri;
    } catch (e) {
      console.warn("[Processor] adjustImage failed:", e);
      return imageUri;
    }
  },
};

/**
 * Generate HTML loaded into the WebView.
 */
export async function getProcessorHtml(): Promise<string> {
  // Check if we can inject offline libraries
  let opencvScript = `<script src="${OPENCV_CDN}"></script>`;

  try {
    const cvInfo = await getInfoAsync(OPENCV_LOCAL_PATH);
    if (cvInfo.exists) {
      const cvCode = await readAsStringAsync(OPENCV_LOCAL_PATH);
      opencvScript = `<script>\n${cvCode}\n</script>`;
      console.log("[Processor] Embedded offline OpenCV.js in HTML");
    }
  } catch (e) {
    console.warn("[Processor] Could not load offline OpenCV.js code", e);
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Document Scanner Processor</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: sans-serif; background: #000; color: #fff; margin: 0; padding: 12px; }
    canvas { max-width: 100%; border: 1px solid #333; display: none; }
  </style>
  ${opencvScript}
</head>
<body>
  <h3>Computer Vision Engine</h3>
  <canvas id="canvasInput"></canvas>
  <canvas id="canvasOutput"></canvas>

  <script>
    // Communication helper
    function sendResponse(taskId, type, data, error = null) {
      const response = JSON.stringify({ taskId, type, data, error });
      window.ReactNativeWebView.postMessage(response);
    }

    // Sort quadrilateral corners: TopLeft, TopRight, BottomRight, BottomLeft
    function sortPoints(pts) {
      let sorted = new Array(4);
      let sums = pts.map(p => p.x + p.y);
      let diffs = pts.map(p => p.y - p.x);

      let tlIndex = sums.indexOf(Math.min(...sums));
      let brIndex = sums.indexOf(Math.max(...sums));
      let trIndex = diffs.indexOf(Math.min(...diffs));
      let blIndex = diffs.indexOf(Math.max(...diffs));

      // Resolve indexing conflicts
      if (tlIndex === trIndex || tlIndex === brIndex || tlIndex === blIndex || 
          trIndex === brIndex || trIndex === blIndex || brIndex === blIndex) {
        let ptsCopy = [...pts];
        ptsCopy.sort((a, b) => a.y - b.y);
        let top = ptsCopy.slice(0, 2).sort((a, b) => a.x - b.x);
        let bottom = ptsCopy.slice(2, 4).sort((a, b) => b.x - a.x);
        return [top[0], top[1], bottom[0], bottom[1]];
      }

      sorted[0] = pts[tlIndex];
      sorted[1] = pts[trIndex];
      sorted[2] = pts[brIndex];
      sorted[3] = pts[blIndex];
      return sorted;
    }

    // Apply OpenCV Filters
    function applyFilter(warped, filter) {
      let out = new cv.Mat();
      
      if (filter === 'original') {
        warped.copyTo(out);
      } else if (filter === 'grayscale' || filter === 'gray') {
        cv.cvtColor(warped, out, cv.COLOR_RGBA2GRAY);
        cv.equalizeHist(out, out);
        cv.cvtColor(out, out, cv.COLOR_GRAY2RGBA); // maintain RGBA shape
      } else if (filter === 'bw' || filter === 'blackwhite') {
        cv.cvtColor(warped, out, cv.COLOR_RGBA2GRAY);
        cv.adaptiveThreshold(out, out, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 15, 10);
        cv.cvtColor(out, out, cv.COLOR_GRAY2RGBA);
      } else if (filter === 'magic' || filter === 'magic_color') {
        // High-pass illumination divide for whitening background while retaining vivid colors
        let gray = new cv.Mat();
        cv.cvtColor(warped, gray, cv.COLOR_RGBA2GRAY);
        let blurred = new cv.Mat();
        cv.GaussianBlur(gray, blurred, new cv.Size(51, 51), 0);
        
        out = new cv.Mat(warped.rows, warped.cols, warped.type());
        for (let r = 0; r < warped.rows; r++) {
          for (let c = 0; c < warped.cols; c++) {
            let bVal = blurred.ucharAt(r, c);
            if (bVal === 0) bVal = 1;
            
            let pIndex = (r * warped.cols + c) * 4;
            let R = warped.data[pIndex];
            let G = warped.data[pIndex + 1];
            let B = warped.data[pIndex + 2];
            let A = warped.data[pIndex + 3];

            out.data[pIndex] = Math.min(255, Math.floor((R / bVal) * 255));
            out.data[pIndex + 1] = Math.min(255, Math.floor((G / bVal) * 255));
            out.data[pIndex + 2] = Math.min(255, Math.floor((B / bVal) * 255));
            out.data[pIndex + 3] = A;
          }
        }
        cv.convertScaleAbs(out, out, 1.15, -15);
        gray.delete(); blurred.delete();
      } else if (filter === 'auto') {
        // Equalize contrast and scale brightness slightly
        out = new cv.Mat();
        cv.convertScaleAbs(warped, out, 1.1, 5);
      } else if (filter === 'document') {
        // Contrast enhancement & edge sharpening for high readability
        let gray = new cv.Mat();
        cv.cvtColor(warped, gray, cv.COLOR_RGBA2GRAY);
        let blurred = new cv.Mat();
        cv.GaussianBlur(gray, blurred, new cv.Size(25, 25), 0);

        out = new cv.Mat(warped.rows, warped.cols, warped.type());
        for (let r = 0; r < warped.rows; r++) {
          for (let c = 0; c < warped.cols; c++) {
            let bVal = blurred.ucharAt(r, c);
            if (bVal === 0) bVal = 1;
            
            let pIndex = (r * warped.cols + c) * 4;
            let R = warped.data[pIndex];
            let G = warped.data[pIndex + 1];
            let B = warped.data[pIndex + 2];
            let A = warped.data[pIndex + 3];

            let newR = Math.min(255, Math.floor((R / bVal) * 255 * 0.98));
            let newG = Math.min(255, Math.floor((G / bVal) * 255 * 0.98));
            let newB = Math.min(255, Math.floor((B / bVal) * 255 * 0.98));

            let intensity = (newR + newG + newB) / 3;
            if (intensity < 130) {
              newR = Math.max(0, newR - 35);
              newG = Math.max(0, newG - 35);
              newB = Math.max(0, newB - 35);
            }

            out.data[pIndex] = newR;
            out.data[pIndex + 1] = newG;
            out.data[pIndex + 2] = newB;
            out.data[pIndex + 3] = A;
          }
        }
        gray.delete(); blurred.delete();
      } else if (filter === 'color') {
        out = new cv.Mat();
        cv.convertScaleAbs(warped, out, 1.25, 5);
      } else if (filter === 'high_contrast') {
        out = new cv.Mat();
        cv.convertScaleAbs(warped, out, 1.4, -20);
      } else if (filter === 'receipt') {
        // Receipt Mode: high threshold whitening and dark text reinforcement
        let gray = new cv.Mat();
        cv.cvtColor(warped, gray, cv.COLOR_RGBA2GRAY);
        let blurred = new cv.Mat();
        cv.GaussianBlur(gray, blurred, new cv.Size(15, 15), 0);

        out = new cv.Mat(warped.rows, warped.cols, warped.type());
        for (let r = 0; r < warped.rows; r++) {
          for (let c = 0; c < warped.cols; c++) {
            let bVal = blurred.ucharAt(r, c);
            if (bVal === 0) bVal = 1;
            
            let pIndex = (r * warped.cols + c) * 4;
            let R = warped.data[pIndex];
            let G = warped.data[pIndex + 1];
            let B = warped.data[pIndex + 2];
            let A = warped.data[pIndex + 3];

            let newR = Math.min(255, Math.floor((R / bVal) * 255));
            let newG = Math.min(255, Math.floor((G / bVal) * 255));
            let newB = Math.min(255, Math.floor((B / bVal) * 255));

            let intensity = (newR + newG + newB) / 3;
            if (intensity < 180) {
              newR = Math.max(0, newR - 80);
              newG = Math.max(0, newG - 80);
              newB = Math.max(0, newB - 80);
            }

            out.data[pIndex] = newR;
            out.data[pIndex + 1] = newG;
            out.data[pIndex + 2] = newB;
            out.data[pIndex + 3] = A;
          }
        }
        gray.delete(); blurred.delete();
      } else {
        warped.copyTo(out);
      }
      return out;
    }

    // Main Router for message handling
    window.addEventListener('message', function(event) {
      try {
        const payload = JSON.parse(event.data);
        const { taskId, type, payload: params } = payload;

        if (type === 'DETECT_EDGES') {
          const img = new Image();
          img.onload = function() {
            try {
              if (typeof cv === 'undefined' || !cv.imread) {
                const points = [
                  { x: 0.15, y: 0.15 },
                  { x: 0.85, y: 0.15 },
                  { x: 0.85, y: 0.85 },
                  { x: 0.15, y: 0.85 }
                ];
                sendResponse(taskId, 'EDGES_DETECTED', { points, width: img.width, height: img.height });
                return;
              }

              const canvas = document.getElementById('canvasInput');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);

              const src = cv.imread(canvas);
              const gray = new cv.Mat();
              cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
              cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
              cv.Canny(gray, gray, 75, 200, 3, false);

              // Dilate edges
              const M = cv.Mat.ones(3, 3, cv.CV_8U);
              cv.dilate(gray, gray, M);

              const contours = new cv.MatVector();
              const hierarchy = new cv.Mat();
              cv.findContours(gray, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

              let maxArea = 0;
              let maxContourIndex = -1;
              const approx = new cv.Mat();

              for (let i = 0; i < contours.size(); ++i) {
                const cnt = contours.get(i);
                const area = cv.contourArea(cnt);
                if (area > img.width * img.height * 0.05) {
                  const peri = cv.arcLength(cnt, true);
                  cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
                  if (approx.rows === 4 && area > maxArea) {
                    maxArea = area;
                    maxContourIndex = i;
                  }
                }
              }

              let points = [];
              if (maxContourIndex !== -1) {
                const cnt = contours.get(maxContourIndex);
                const peri = cv.arcLength(cnt, true);
                cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
                for (let i = 0; i < 4; i++) {
                  points.push({
                    x: approx.data32S[i * 2],
                    y: approx.data32S[i * 2 + 1]
                  });
                }
              }

              // Cleanup
              src.delete(); gray.delete(); M.delete(); contours.delete(); hierarchy.delete(); approx.delete();

              if (points.length === 4) {
                points = sortPoints(points);
                points = points.map(p => ({ x: p.x / img.width, y: p.y / img.height }));
              } else {
                points = [
                  { x: 0.15, y: 0.15 },
                  { x: 0.85, y: 0.15 },
                  { x: 0.85, y: 0.85 },
                  { x: 0.15, y: 0.85 }
                ];
              }

              sendResponse(taskId, 'EDGES_DETECTED', { points, width: img.width, height: img.height });
            } catch (err) {
              sendResponse(taskId, 'ERROR', null, err.message);
            }
          };
          img.onerror = function() {
            sendResponse(taskId, 'ERROR', null, 'Failed to load input image.');
          };
          img.src = params.imageBase64;
        } 
        
        else if (type === 'WARP_PERSPECTIVE') {
          const img = new Image();
          img.onload = function() {
            try {
              if (typeof cv === 'undefined' || !cv.imread) {
                const canvasOut = document.getElementById('canvasOutput');
                const ctxOut = canvasOut.getContext('2d');
                canvasOut.width = img.width;
                canvasOut.height = img.height;
                ctxOut.drawImage(img, 0, 0);
                const resultBase64 = canvasOut.toDataURL('image/jpeg', 0.85);
                sendResponse(taskId, 'WARPED_COMPLETED', { image: resultBase64 });
                return;
              }

      const canvasIn = document.getElementById('canvasInput');
              const ctxIn = canvasIn.getContext('2d');
              canvasIn.width = img.width;
              canvasIn.height = img.height;
              ctxIn.drawImage(img, 0, 0);

              const src = cv.imread(canvasIn);

              let corners = params.corners;
              if (!Array.isArray(corners) || corners.length < 4) {
                corners = [
                  { x: 0, y: 0 },
                  { x: 1, y: 0 },
                  { x: 1, y: 1 },
                  { x: 0, y: 1 },
                ];
              }

              const tl = { x: corners[0].x * img.width, y: corners[0].y * img.height };
              const tr = { x: corners[1].x * img.width, y: corners[1].y * img.height };
              const br = { x: corners[2].x * img.width, y: corners[2].y * img.height };
              const bl = { x: corners[3].x * img.width, y: corners[3].y * img.height };

              const widthA = Math.hypot(br.x - bl.x, br.y - bl.y);
              const widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y);
              const maxWidth = Math.max(widthA, widthB);

              const heightA = Math.hypot(tr.x - br.x, tr.y - br.y);
              const heightB = Math.hypot(tl.x - bl.x, tl.y - bl.y);
              const maxHeight = Math.max(heightA, heightB);

              const srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
              const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, maxWidth, 0, maxWidth, maxHeight, 0, maxHeight]);

              const M = cv.getPerspectiveTransform(srcCoords, dstCoords);
              const warped = new cv.Mat();
              cv.warpPerspective(src, warped, M, new cv.Size(maxWidth, maxHeight), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

              const enhanced = applyFilter(warped, params.filter);

              const canvasOut = document.getElementById('canvasOutput');
              cv.imshow(canvasOut, enhanced);

              const resultBase64 = canvasOut.toDataURL('image/jpeg', 0.85);

              // Cleanup
              src.delete(); srcCoords.delete(); dstCoords.delete(); M.delete(); warped.delete(); enhanced.delete();

              sendResponse(taskId, 'WARPED_COMPLETED', { image: resultBase64 });
            } catch (err) {
              console.warn('[Processor] OpenCV warp failed, using canvas fallback:', err);
              const fallbackResult = warpPerspectiveCanvas(img, params.corners, params.filter);
              sendResponse(taskId, 'WARPED_COMPLETED', { image: fallbackResult });
            }
          };
          img.src = params.imageBase64;
        } 
        
        else if (type === 'ADJUST_IMAGE') {
          const img = new Image();
          img.onload = function() {
            try {
              if (typeof cv === 'undefined' || !cv.imread) {
                const resultBase64 = adjustImageCanvas(img, params);
                sendResponse(taskId, 'ADJUST_COMPLETED', { image: resultBase64 });
                return;
              }

              const canvasIn = document.getElementById('canvasInput');
              const ctxIn = canvasIn.getContext('2d');
              canvasIn.width = img.width;
              canvasIn.height = img.height;
              ctxIn.drawImage(img, 0, 0);

              let src = cv.imread(canvasIn);
              let dst = new cv.Mat();

              // Adjust Brightness & Contrast
              const brightness = params.brightness || 0;
              const contrast = params.contrast || 0;
              const alpha = 1 + (contrast / 100);
              const beta = brightness;
              
              cv.convertScaleAbs(src, dst, alpha, beta);

              // Adjust Saturation
              const saturation = params.saturation || 0;
              if (saturation !== 0) {
                let hsv = new cv.Mat();
                cv.cvtColor(dst, hsv, cv.COLOR_RGBA2RGB);
                cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
                
                let channels = new cv.MatVector();
                cv.split(hsv, channels);
                
                let S = channels.get(1);
                const satScale = 1 + (saturation / 100);
                S.convertTo(S, -1, satScale, 0);
                
                cv.merge(channels, hsv);
                cv.cvtColor(hsv, dst, cv.COLOR_HSV2RGB);
                cv.cvtColor(dst, dst, cv.COLOR_RGB2RGBA);
                
                hsv.delete(); channels.delete(); S.delete();
              }

              // Adjust Sharpness
              const sharpness = params.sharpness || 0;
              if (sharpness > 0) {
                let blurred = new cv.Mat();
                const ksize = new cv.Size(5, 5);
                cv.GaussianBlur(dst, blurred, ksize, 0);
                
                const amount = sharpness / 50;
                cv.addWeighted(dst, 1 + amount, blurred, -amount, 0, dst);
                blurred.delete();
              }

              const canvasOut = document.getElementById('canvasOutput');
              cv.imshow(canvasOut, dst);

              const resultBase64 = canvasOut.toDataURL('image/jpeg', 0.85);

              src.delete(); dst.delete();

              sendResponse(taskId, 'ADJUST_COMPLETED', { image: resultBase64 });
            } catch (err) {
              console.warn('[Processor] OpenCV adjust failed, using canvas fallback:', err);
              const fallbackResult = adjustImageCanvas(img, params);
              sendResponse(taskId, 'ADJUST_COMPLETED', { image: fallbackResult });
            }
          };
          img.src = params.imageBase64;
        }
      } catch (err) {
        console.error('[WebView Processor] Global execution error:', err);
      }
    });

    // Pure JS Canvas Fallback Functions for Offline Operation
    function warpPerspectiveCanvas(img, corners, filter) {
      var canvasIn = document.getElementById('canvasInput');
      var ctxIn = canvasIn.getContext('2d');
      canvasIn.width = img.width;
      canvasIn.height = img.height;
      ctxIn.drawImage(img, 0, 0);

      var srcImgData = ctxIn.getImageData(0, 0, img.width, img.height);
      var srcData = srcImgData.data;

      var cornersArr = Array.isArray(corners) && corners.length >= 4 ? corners : [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }
      ];

      var tl = { x: cornersArr[0].x * img.width, y: cornersArr[0].y * img.height };
      var tr = { x: cornersArr[1].x * img.width, y: cornersArr[1].y * img.height };
      var br = { x: cornersArr[2].x * img.width, y: cornersArr[2].y * img.height };
      var bl = { x: cornersArr[3].x * img.width, y: cornersArr[3].y * img.height };

      var widthA = Math.hypot(br.x - bl.x, br.y - bl.y);
      var widthB = Math.hypot(tr.x - tl.x, tr.y - tl.y);
      var outW = Math.max(10, Math.round(Math.max(widthA, widthB)));

      var heightA = Math.hypot(tr.x - br.x, tr.y - br.y);
      var heightB = Math.hypot(tl.x - bl.x, tl.y - bl.y);
      var outH = Math.max(10, Math.round(Math.max(heightA, heightB)));

      var canvasOut = document.getElementById('canvasOutput');
      canvasOut.width = outW;
      canvasOut.height = outH;
      var ctxOut = canvasOut.getContext('2d');
      var dstImgData = ctxOut.createImageData(outW, outH);
      var dstData = dstImgData.data;

      var imgW = img.width;
      var imgH = img.height;

      for (var y = 0; y < outH; y++) {
        var v = y / (outH - 1 || 1);
        for (var x = 0; x < outW; x++) {
          var u = x / (outW - 1 || 1);
          
          var topX = tl.x + u * (tr.x - tl.x);
          var topY = tl.y + u * (tr.y - tl.y);
          var botX = bl.x + u * (br.x - bl.x);
          var botY = bl.y + u * (br.y - bl.y);

          var srcX = Math.max(0, Math.min(imgW - 1, topX + v * (botX - topX)));
          var srcY = Math.max(0, Math.min(imgH - 1, topY + v * (botY - topY)));

          var x0 = Math.floor(srcX);
          var y0 = Math.floor(srcY);
          var x1 = Math.min(imgW - 1, x0 + 1);
          var y1 = Math.min(imgH - 1, y0 + 1);

          var dx = srcX - x0;
          var dy = srcY - y0;

          var idx00 = (y0 * imgW + x0) * 4;
          var idx10 = (y0 * imgW + x1) * 4;
          var idx01 = (y1 * imgW + x0) * 4;
          var idx11 = (y1 * imgW + x1) * 4;

          var dstIdx = (y * outW + x) * 4;

          dstData[dstIdx]     = Math.round((1 - dx) * (1 - dy) * srcData[idx00]     + dx * (1 - dy) * srcData[idx10]     + (1 - dx) * dy * srcData[idx01]     + dx * dy * srcData[idx11]);
          dstData[dstIdx + 1] = Math.round((1 - dx) * (1 - dy) * srcData[idx00 + 1] + dx * (1 - dy) * srcData[idx10 + 1] + (1 - dx) * dy * srcData[idx01 + 1] + dx * dy * srcData[idx11 + 1]);
          dstData[dstIdx + 2] = Math.round((1 - dx) * (1 - dy) * srcData[idx00 + 2] + dx * (1 - dy) * srcData[idx10 + 2] + (1 - dx) * dy * srcData[idx01 + 2] + dx * dy * srcData[idx11 + 2]);
          dstData[dstIdx + 3] = 255;
        }
      }

      ctxOut.putImageData(dstImgData, 0, 0);
      applyFilterCanvas(ctxOut, outW, outH, filter);
      return canvasOut.toDataURL('image/jpeg', 0.85);
    }

    function applyFilterCanvas(ctxOut, width, height, filter) {
      if (!filter || filter === 'original') return;
      var imgData = ctxOut.getImageData(0, 0, width, height);
      var data = imgData.data;

      if (filter === 'grayscale' || filter === 'gray') {
        for (var i = 0; i < data.length; i += 4) {
          var g = Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
          data[i] = g; data[i+1] = g; data[i+2] = g;
        }
      } else if (filter === 'bw' || filter === 'blackwhite') {
        var sum = 0;
        for (var i = 0; i < data.length; i += 4) {
          sum += (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
        }
        var thresh = (sum / (data.length / 4)) * 0.95;
        for (var i = 0; i < data.length; i += 4) {
          var g = (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
          var val = g > thresh ? 255 : 0;
          data[i] = val; data[i+1] = val; data[i+2] = val;
        }
      } else if (filter === 'magic' || filter === 'magic_color' || filter === 'document') {
        for (var i = 0; i < data.length; i += 4) {
          var r = data[i], g = data[i+1], b = data[i+2];
          var lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > 135) {
            r = Math.min(255, r * 1.15 + 20);
            g = Math.min(255, g * 1.15 + 20);
            b = Math.min(255, b * 1.15 + 20);
          } else {
            r = Math.max(0, r * 0.85);
            g = Math.max(0, g * 0.85);
            b = Math.max(0, b * 0.85);
          }
          data[i] = r; data[i+1] = g; data[i+2] = b;
        }
      } else if (filter === 'color') {
        for (var i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.floor(data[i] * 1.12));
          data[i+1] = Math.min(255, Math.floor(data[i+1] * 1.12));
          data[i+2] = Math.min(255, Math.floor(data[i+2] * 1.12));
        }
      } else if (filter === 'high_contrast') {
        for (var i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, Math.floor((data[i] - 128) * 1.4 + 128)));
          data[i+1] = Math.min(255, Math.max(0, Math.floor((data[i+1] - 128) * 1.4 + 128)));
          data[i+2] = Math.min(255, Math.max(0, Math.floor((data[i+2] - 128) * 1.4 + 128)));
        }
      } else if (filter === 'receipt') {
        for (var i = 0; i < data.length; i += 4) {
          var lum = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
          var val = lum > 160 ? 255 : Math.max(0, lum - 40);
          data[i] = val; data[i+1] = val; data[i+2] = val;
        }
      } else if (filter === 'auto') {
        for (var i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, Math.floor((data[i] - 128) * 1.1 + 133)));
          data[i+1] = Math.min(255, Math.max(0, Math.floor((data[i+1] - 128) * 1.1 + 133)));
          data[i+2] = Math.min(255, Math.max(0, Math.floor((data[i+2] - 128) * 1.1 + 133)));
        }
      }

      ctxOut.putImageData(imgData, 0, 0);
    }

    function adjustImageCanvas(img, params) {
      var canvasIn = document.getElementById('canvasInput');
      var ctxIn = canvasIn.getContext('2d');
      canvasIn.width = img.width;
      canvasIn.height = img.height;
      ctxIn.drawImage(img, 0, 0);

      var imgData = ctxIn.getImageData(0, 0, img.width, img.height);
      var data = imgData.data;

      var brightness = params.brightness || 0;
      var contrast = params.contrast || 0;
      var saturation = params.saturation || 0;
      var sharpness = params.sharpness || 0;

      var alpha = 1 + (contrast / 100);
      var beta = brightness;
      var satScale = 1 + (saturation / 100);

      for (var i = 0; i < data.length; i += 4) {
        var r = data[i], g = data[i+1], b = data[i+2];

        // Brightness + Contrast
        r = Math.min(255, Math.max(0, Math.floor(alpha * (r - 128) + 128 + beta)));
        g = Math.min(255, Math.max(0, Math.floor(alpha * (g - 128) + 128 + beta)));
        b = Math.min(255, Math.max(0, Math.floor(alpha * (b - 128) + 128 + beta)));

        // Saturation
        if (saturation !== 0) {
          var gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = Math.min(255, Math.max(0, Math.floor(gray + (r - gray) * satScale)));
          g = Math.min(255, Math.max(0, Math.floor(gray + (g - gray) * satScale)));
          b = Math.min(255, Math.max(0, Math.floor(gray + (b - gray) * satScale)));
        }

        data[i] = r; data[i+1] = g; data[i+2] = b;
      }

      // Sharpness (3x3 kernel convolution)
      if (sharpness > 0) {
        var width = img.width;
        var height = img.height;
        var factor = (sharpness / 100) * 0.8;
        var copy = new Uint8ClampedArray(data);

        for (var y = 1; y < height - 1; y++) {
          for (var x = 1; x < width - 1; x++) {
            var idx = (y * width + x) * 4;
            for (var c = 0; c < 3; c++) {
              var center = copy[idx + c];
              var neighbors = copy[((y - 1) * width + x) * 4 + c] +
                              copy[((y + 1) * width + x) * 4 + c] +
                              copy[(y * width + (x - 1)) * 4 + c] +
                              copy[(y * width + (x + 1)) * 4 + c];
              var sharpVal = center + factor * (4 * center - neighbors);
              data[idx + c] = Math.min(255, Math.max(0, Math.round(sharpVal)));
            }
          }
        }
      }

      var canvasOut = document.getElementById('canvasOutput');
      canvasOut.width = img.width;
      canvasOut.height = img.height;
      var ctxOut = canvasOut.getContext('2d');
      ctxOut.putImageData(imgData, 0, 0);
      return canvasOut.toDataURL('image/jpeg', 0.85);
    }

    // Check if OpenCV is loaded and signal RN
    let cvReadyAttempts = 0;
    function checkOpenCVReady() {
      if (typeof cv !== 'undefined' && cv.Mat) {
        sendResponse('init', 'ENGINE_READY', null);
      } else if (cvReadyAttempts > 5) {
        // Signal ready anyway so offline canvas fallbacks activate without timing out
        sendResponse('init', 'ENGINE_READY', null);
      } else {
        cvReadyAttempts++;
        setTimeout(checkOpenCVReady, 100);
      }
    }

    setTimeout(checkOpenCVReady, 100);
  </script>
</body>
</html>
  `;
}

