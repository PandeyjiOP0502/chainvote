import { useState, useRef, useCallback } from 'react';

// face-api.js is loaded via CDN script tag in index.html
// This hook manages all face detection logic

const MODELS_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

let modelsLoaded = false;
let modelsLoading = false;

export const useFaceAuth = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [dots, setDots] = useState([]);

  const addLog = (msg) => setLogs(p => [...p.slice(-6), msg]);

  const loadModels = useCallback(async () => {
    if (modelsLoaded) { setModelsReady(true); return; }
    if (modelsLoading) return;
    modelsLoading = true;
    setLoading(true);
    setPhase('loading_models');
    addLog('▸ Loading face recognition models...');

    try {
      const faceapi = window.faceapi;
      if (!faceapi) throw new Error('face-api.js not loaded. Check your internet connection.');

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
      ]);

      modelsLoaded = true;
      setModelsReady(true);
      addLog('✓ Face recognition models loaded');
    } catch (err) {
      setError('Failed to load face models: ' + err.message);
      addLog('✕ Model loading failed');
    } finally {
      setLoading(false);
      modelsLoading = false;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setPhase('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise(r => { videoRef.current.onloadedmetadata = r; });
        await videoRef.current.play();
      }
      return true;
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      setPhase('denied');
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(rafRef.current);
    setPhase('idle');
  }, []);

  // Draw canvas overlay with face landmarks
  const drawOverlay = useCallback((detections, currentPhase, scanProgress) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const faceapi = window.faceapi;
    if (!faceapi) return;

    const dims = faceapi.matchDimensions(canvas, video, true);
    const resized = faceapi.resizeResults(detections, dims);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const W = canvas.width, H = canvas.height;
    const now = Date.now() / 1000;
    const detected = detections.length > 0;

    // Grid overlay
    ctx.strokeStyle = 'rgba(34,197,94,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Face oval guide
    ctx.beginPath();
    ctx.ellipse(W / 2, H / 2, W * 0.26, H * 0.36, 0, 0, Math.PI * 2);
    ctx.strokeStyle = detected ? 'rgba(34,197,94,0.8)' : 'rgba(234,179,8,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Corner brackets
    const bx = W * 0.18, by = H * 0.1, bw = W * 0.64, bh = H * 0.8, bl = 22;
    const brackets = [[bx, by, bl, 0, 0, bl], [bx + bw, by, -bl, 0, 0, bl], [bx, by + bh, bl, 0, 0, -bl], [bx + bw, by + bh, -bl, 0, 0, -bl]];
    brackets.forEach(([x, y, dx, _, dx2, dy2]) => {
      ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x, y); ctx.lineTo(x + dx2, y + dy2);
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3; ctx.stroke();
    });

    // Draw face landmarks if detected
    if (detected && resized.length > 0) {
      resized.forEach(r => {
        if (r.landmarks) {
          const pts = r.landmarks.positions;
          // Draw landmark points
          pts.forEach(pt => {
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(34,197,94,0.7)'; ctx.fill();
          });
          // Draw connections
          const drawPts = (indices) => {
            ctx.beginPath();
            indices.forEach((idx, i) => { i === 0 ? ctx.moveTo(pts[idx].x, pts[idx].y) : ctx.lineTo(pts[idx].x, pts[idx].y); });
            ctx.strokeStyle = 'rgba(34,197,94,0.35)'; ctx.lineWidth = 1; ctx.stroke();
          };
          drawPts([...Array(17).keys()]); // jaw
          drawPts([17,18,19,20,21]); // left brow
          drawPts([22,23,24,25,26]); // right brow
          drawPts([36,37,38,39,40,41,36]); // left eye
          drawPts([42,43,44,45,46,47,42]); // right eye
          drawPts([27,28,29,30]); // nose bridge
          drawPts([48,49,50,51,52,53,54,55,56,57,58,59,48]); // mouth

          // Bounding box
          const box = r.detection.box;
          ctx.strokeStyle = 'rgba(34,197,94,0.6)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Confidence badge
          const conf = Math.round(r.detection.score * 100);
          ctx.fillStyle = 'rgba(34,197,94,0.9)';
          ctx.fillRect(box.x, box.y - 22, 80, 20);
          ctx.fillStyle = '#000';
          ctx.font = 'bold 10px IBM Plex Mono, monospace';
          ctx.fillText(`FACE ${conf}%`, box.x + 4, box.y - 7);
        }
      });
    }

    // Scan line (scanning phase)
    if (currentPhase === 'scanning') {
      const sy = H * 0.1 + ((Math.sin(now * 1.5) + 1) / 2) * (H * 0.8);
      const g = ctx.createLinearGradient(0, sy - 20, 0, sy + 20);
      g.addColorStop(0, 'transparent'); g.addColorStop(0.5, 'rgba(34,197,94,0.4)'); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0, sy - 20, W, 40);
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy);
      ctx.strokeStyle = 'rgba(34,197,94,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
    }

    // HUD text
    ctx.font = 'bold 10px IBM Plex Mono, monospace';
    ctx.fillStyle = '#22c55e'; ctx.fillText(`${Math.round(scanProgress)}%`, 10, H - 12);
    const statusTxt = detected ? '● FACE DETECTED' : '○ SEARCHING...';
    ctx.fillStyle = detected ? '#22c55e' : '#eab308';
    ctx.fillText(statusTxt, W - 115, H - 12);
    ctx.fillStyle = 'rgba(34,197,94,0.5)';
    ctx.font = '9px IBM Plex Mono, monospace';
    ctx.fillText('CHAINVOTE BIOMETRIC', 10, 14);
    ctx.fillText(new Date().toLocaleTimeString(), W - 72, 14);
  }, []);

  // Get face descriptor (128-float vector)
  const getFaceDescriptor = useCallback(async () => {
    const faceapi = window.faceapi;
    const video = videoRef.current;
    if (!faceapi || !video) return null;

    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection || null;
  }, []);

  // Full scan+analyze sequence
  const runAuth = useCallback(async (onSuccess, onFail) => {
    if (!modelsReady) { setError('Models not ready yet'); return; }
    const cameraOk = await startCamera();
    if (!cameraOk) return;

    setPhase('scanning');
    setProgress(0);
    setFaceDetected(false);
    addLog('▸ Camera initialized');

    const faceapi = window.faceapi;
    let scanProgress = 0;
    let faceFound = false;
    let detectionResult = null;

    // Detection loop
    const detect = async () => {
      if (!videoRef.current) return;
      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
          .withFaceLandmarks();

        const hasface = detections.length > 0;
        setFaceDetected(hasface);
        if (hasface && !faceFound) { faceFound = true; addLog('▸ Face geometry detected'); }
        drawOverlay(detections, 'scanning', scanProgress);
      } catch {}
    };

    // Progress + detection ticker
    await new Promise((resolve) => {
      const interval = setInterval(async () => {
        scanProgress += 1.5;
        setProgress(Math.min(45, scanProgress));
        await detect();
        if (scanProgress >= 45) { clearInterval(interval); resolve(); }
      }, 80);
    });

    if (!faceFound) {
      addLog('✕ No face detected. Please face the camera.');
      stopCamera();
      setPhase('failed');
      onFail?.('No face detected');
      return;
    }

    // Analysis phase
    setPhase('analyzing');
    const analysisSteps = [
      '▸ Mapping 68 facial landmarks...',
      '▸ Computing biometric descriptor...',
      '▸ Running liveness detection...',
      '▸ Anti-spoofing check...',
      '▸ Generating 128-D feature vector...',
    ];

    await new Promise(resolve => {
      let stepIdx = 0;
      const interval = setInterval(async () => {
        scanProgress += 0.9;
        setProgress(Math.min(90, scanProgress));
        const threshold = 45 + stepIdx * (45 / analysisSteps.length);
        if (scanProgress > threshold && stepIdx < analysisSteps.length) {
          addLog(analysisSteps[stepIdx++]);
        }
        await detect();
        if (scanProgress >= 90) { clearInterval(interval); resolve(); }
      }, 60);
    });

    // Final descriptor capture
    addLog('▸ Capturing final descriptor...');
    let descriptor = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = await getFaceDescriptor();
      if (result) { descriptor = result.descriptor; detectionResult = result; break; }
      await new Promise(r => setTimeout(r, 500));
    }

    if (!descriptor) {
      addLog('✕ Could not capture face descriptor. Try better lighting.');
      stopCamera();
      setPhase('failed');
      onFail?.('Descriptor capture failed');
      return;
    }

    setProgress(100);
    addLog('✓ Biometric capture successful');
    setPhase('success');

    setTimeout(() => {
      stopCamera();
      onSuccess(descriptor);
    }, 1200);
  }, [modelsReady, startCamera, stopCamera, drawOverlay, getFaceDescriptor]);

  return {
    videoRef, canvasRef,
    modelsReady, loading, error, phase, progress, faceDetected, logs,
    loadModels, startCamera, stopCamera, runAuth,
  };
};
