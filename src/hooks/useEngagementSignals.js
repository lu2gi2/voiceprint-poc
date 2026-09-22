import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Client-side camera engagement signal observer for HR & Behavioral interviews.
 *
 * Privacy & Ethical Strict Constraints:
 * 1. 100% client-side inference: Zero frames/images are ever saved or transmitted.
 * 2. Raw observations only: NEVER labelled as "confidence" or emotion.
 * 3. 5 FPS sampling (~200ms) for minimal device overhead.
 */
export default function useEngagementSignals({ enabled = true, autoStart = true } = {}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('prompt'); // prompt | granted | denied
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState(null);

  // Live raw evidence observations (never labeled "confidence")
  const [liveObservation, setLiveObservation] = useState({
    faceInFrame: false,
    gazeForward: false,
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);

  // Session accumulation counters
  const metricsRef = useRef({
    totalTicks: 0,
    faceDetectedTicks: 0,
    gazeForwardTicks: 0,
    nosePositions: [], // [{x, y}]
  });

  // Attach video stream safely whenever element mounts
  const attachVideoRef = useCallback((el) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      if (el.srcObject !== streamRef.current) {
        el.srcObject = streamRef.current;
      }
      el.play().catch(() => {});
    }
  }, []);

  // Lazy-load MediaPipe FaceLandmarker
  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    async function initFaceLandmarker() {
      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const fileset = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        if (!isMounted) return;

        const landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.6,
          minFacePresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        if (isMounted) {
          landmarkerRef.current = landmarker;
          setModelReady(true);
        }
      } catch (err) {
        // Fallback: try CPU delegate if WebGL fails
        try {
          const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
          const fileset = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
          );
          if (!isMounted) return;

          const landmarker = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
            minFaceDetectionConfidence: 0.6,
            minFacePresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });

          if (isMounted) {
            landmarkerRef.current = landmarker;
            setModelReady(true);
          }
        } catch (cpuErr) {
          if (isMounted) {
            setError(cpuErr.message);
          }
        }
      }
    }

    initFaceLandmarker();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch {}
        landmarkerRef.current = null;
      }
    };
  }, [enabled]);

  // Start webcam stream and prompt for camera (+ mic) permissions upfront
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
        return streamRef.current;
      }

      // Prompt for camera and microphone together so the user gets prompted once upfront
      let stream;
      try {
        const comboStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } },
          audio: true,
        });
        // We only needed microphone permission granted at the origin level; release the
        // audio track now so the mic indicator doesn't stay permanently active while listening.
        comboStream.getAudioTracks().forEach((track) => track.stop());
        stream = new MediaStream(comboStream.getVideoTracks());
      } catch (comboErr) {
        // Fallback: try video-only if audio device is occupied or unavailable
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } },
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);
      setCameraPermission('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      return stream;
    } catch (err) {
      setCameraPermission('denied');
      setCameraActive(false);
      setError(err.message);
      return null;
    }
  }, []);

  // Stop webcam stream
  const stopCamera = useCallback(() => {
    isTrackingRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setLiveObservation({ faceInFrame: false, gazeForward: false });
  }, []);

  // Keep video element in sync whenever camera becomes active
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  // Automatically initialize and start the camera stream upon mount / enabled
  useEffect(() => {
    if (enabled && autoStart) {
      startCamera();
    }
  }, [enabled, autoStart, startCamera]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const isTrackingRef = useRef(false);

  // Live detection tick loop (~5 FPS = every 200ms)
  useEffect(() => {
    if (!cameraActive || !modelReady) {
      setLiveObservation({ faceInFrame: false, gazeForward: false });
      return;
    }

    const interval = setInterval(() => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      // Ensure Video Readiness: Only execute if videoRef.current && readyState >= 2 (HAVE_CURRENT_DATA)
      if (!video || !landmarker || video.readyState < 2) {
        setLiveObservation({ faceInFrame: false, gazeForward: false });
        return;
      }

      const isTracking = isTrackingRef.current;
      if (isTracking) {
        metricsRef.current.totalTicks += 1;
      }

      try {
        const now = performance.now();
        const results = landmarker.detectForVideo(video, now);

        // Fix Stale State / No-Face Reset: explicitly verify results && results.faceLandmarks && results.faceLandmarks.length > 0
        if (
          !results ||
          !results.faceLandmarks ||
          results.faceLandmarks.length === 0 ||
          !results.faceLandmarks[0] ||
          results.faceLandmarks[0].length < 468
        ) {
          setLiveObservation({ faceInFrame: false, gazeForward: false });
          return;
        }

        const landmarks = results.faceLandmarks[0];

        if (isTracking) {
          metricsRef.current.faceDetectedTicks += 1;

          // Nose tip is landmark 1
          const nose = landmarks[1];
          if (nose) {
            metricsRef.current.nosePositions.push({ x: nose.x, y: nose.y });
          }
        }

        // Coarse gaze ratio comparing iris (468, 473) to inner/outer corners
        // Left eye: inner corner 133, outer corner 33, iris 468
        // Right eye: inner corner 362, outer corner 263, iris 473
        let gazeForward = false;
        const leftIris = landmarks[468];
        const rightIris = landmarks[473];
        const leftInner = landmarks[133];
        const leftOuter = landmarks[33];
        const rightInner = landmarks[362];
        const rightOuter = landmarks[263];

        if (leftIris && rightIris && leftInner && leftOuter && rightInner && rightOuter) {
          const leftWidth = Math.abs(leftInner.x - leftOuter.x);
          const leftDist = Math.abs(leftIris.x - Math.min(leftInner.x, leftOuter.x));
          const leftRatio = leftWidth > 0 ? leftDist / leftWidth : 0.5;

          const rightWidth = Math.abs(rightInner.x - rightOuter.x);
          const rightDist = Math.abs(rightIris.x - Math.min(rightInner.x, rightOuter.x));
          const rightRatio = rightWidth > 0 ? rightDist / rightWidth : 0.5;

          // Gaze forward heuristic: iris is roughly centered between eye corners
          if (leftRatio >= 0.30 && leftRatio <= 0.70 && rightRatio >= 0.30 && rightRatio <= 0.70) {
            if (isTracking) {
              metricsRef.current.gazeForwardTicks += 1;
            }
            gazeForward = true;
          }
        }

        setLiveObservation({ faceInFrame: true, gazeForward });
      } catch {
        // Immediate reset on error: do NOT retain previous frame's truthy value
        setLiveObservation({ faceInFrame: false, gazeForward: false });
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [cameraActive, modelReady]);

  // Start recording ticks during an answer
  const startTracking = useCallback(() => {
    metricsRef.current = {
      totalTicks: 0,
      faceDetectedTicks: 0,
      gazeForwardTicks: 0,
      nosePositions: [],
    };
    isTrackingRef.current = true;
  }, []);

  // Stop recording ticks and compute summary ratios
  const stopTracking = useCallback(() => {
    isTrackingRef.current = false;

    const { totalTicks, faceDetectedTicks, gazeForwardTicks, nosePositions } = metricsRef.current;

    // Face in frame ratio
    const face_in_frame_ratio = totalTicks > 0
      ? Math.round((faceDetectedTicks / totalTicks) * 100) / 100
      : 0;

    // Gaze forward ratio (relative to ticks when face was present)
    const gaze_forward_ratio = faceDetectedTicks > 0
      ? Math.round((gazeForwardTicks / faceDetectedTicks) * 100) / 100
      : 0;

    // Head-pose stability: based on nose tip position displacement
    let head_pose_stability = 1.0;
    if (nosePositions.length > 1) {
      let totalDelta = 0;
      for (let i = 1; i < nosePositions.length; i += 1) {
        const dx = nosePositions[i].x - nosePositions[i - 1].x;
        const dy = nosePositions[i].y - nosePositions[i - 1].y;
        totalDelta += Math.hypot(dx, dy);
      }
      const avgDelta = totalDelta / (nosePositions.length - 1);
      // avgDelta typically 0.001 - 0.05. Scale so normal stillness is ~0.8-1.0
      head_pose_stability = Math.max(0, Math.min(1, Math.round((1 - avgDelta * 18) * 100) / 100));
    } else if (faceDetectedTicks === 0) {
      head_pose_stability = 0;
    }

    return {
      face_in_frame_ratio,
      gaze_forward_ratio,
      head_pose_stability,
    };
  }, []);

  return {
    videoRef,
    attachVideoRef,
    cameraActive,
    cameraPermission,
    modelReady,
    error,
    liveObservation,
    startCamera,
    stopCamera,
    startTracking,
    stopTracking,
  };
}
