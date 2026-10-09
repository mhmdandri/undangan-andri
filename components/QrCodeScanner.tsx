"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";
import {
  BsArrowRepeat,
  BsImage,
  BsLightbulb,
  BsLightbulbOff,
  BsExclamationCircle,
} from "react-icons/bs";
import { motion } from "motion/react";

interface QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  isPaused?: boolean;
  onError?: (errMessage: string) => void;
}

export default function QrCodeScanner({
  onScan,
  isPaused = false,
  onError,
}: QrCodeScannerProps) {
  const scannerId = "qr-code-reader-box";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isStoppingRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);

  // Keep latest callbacks in refs so startScanner doesn't depend on them
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  }, [onScan, onError]);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>("");
  const isPausedRef = useRef<boolean>(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Track last scanned payload and timestamp to prevent duplicate frame processing
  const lastScanRef = useRef<{ text: string; time: number }>({ text: "", time: 0 });

  // Stop scanner safely
  const stopScanner = useCallback(async () => {
    if (isStoppingRef.current) return;
    if (scannerRef.current) {
      isStoppingRef.current = true;
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn("Failed to stop scanner cleanly", err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
        isStoppingRef.current = false;
      }
    }
  }, []);

  // Start scanner with specific camera or default environment camera
  const startScanner = useCallback(
    async (cameraId?: string) => {
      if (isStartingRef.current) return;
      isStartingRef.current = true;
      setCameraError("");

      // Ensure previous scanner instance is stopped first
      await stopScanner();

      // Guard: Make sure container exists in DOM and is mounted
      const container = document.getElementById(scannerId);
      if (!container) {
        isStartingRef.current = false;
        return;
      }

      try {
        const scanner = new Html5Qrcode(scannerId, { verbose: false });
        scannerRef.current = scanner;

        // Query available cameras
        try {
          const deviceList = await Html5Qrcode.getCameras();
          if (deviceList && deviceList.length > 0) {
            setCameras(deviceList);
          }
        } catch {
          // Ignore camera enumerate errors
        }

        const config: Html5QrcodeCameraScanConfig = {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const boxSize = Math.max(180, Math.floor(minEdge * 0.72));
            return { width: boxSize, height: boxSize };
          },
          aspectRatio: 1.0,
        };

        const cameraConfig = cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: "environment" };

        // Double check container presence right before calling start()
        if (!document.getElementById(scannerId)) {
          isStartingRef.current = false;
          return;
        }

        await scanner.start(
          cameraConfig,
          config,
          (decodedText) => {
            if (isPausedRef.current) return;

            const now = Date.now();
            // Prevent duplicate trigger of the exact same code within 2 seconds
            if (
              decodedText === lastScanRef.current.text &&
              now - lastScanRef.current.time < 2000
            ) {
              return;
            }

            lastScanRef.current = { text: decodedText, time: now };
            onScanRef.current?.(decodedText);
          },
          () => {
            // Frame parse failure is normal while searching for QR code
          }
        );

        setIsScanning(true);

        // Check if torch/flashlight is supported
        try {
          const track = scanner.getRunningTrackCapabilities() as
            | (MediaTrackCapabilities & { torch?: boolean })
            | undefined;
          if (track && "torch" in track && Boolean(track.torch)) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }
      } catch (err: unknown) {
        // If container disappeared during start (component unmounted), suppress error
        if (!document.getElementById(scannerId)) {
          isStartingRef.current = false;
          return;
        }
        console.error("Camera start error:", err);
        const errMsg =
          err instanceof Error
            ? err.message
            : "Gagal mengakses kamera. Pastikan izin kamera telah diberikan.";
        setCameraError(errMsg);
        onErrorRef.current?.(errMsg);
        setIsScanning(false);
      } finally {
        isStartingRef.current = false;
      }
    },
    [stopScanner]
  );

  // Initialize camera once on mount
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) {
        startScanner();
      }
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  // Switch to next camera
  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await startScanner(cameras[nextIndex].id);
  };

  // Toggle flashlight
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !isTorchOn;
      await (
        scannerRef.current as unknown as {
          applyVideoConstraints: (constraints: unknown) => Promise<void>;
        }
      ).applyVideoConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn("Torch toggle failed", err);
    }
  };

  // File upload scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCameraError("");
      const tempScanner =
        scannerRef.current || new Html5Qrcode(scannerId, { verbose: false });
      const decodedText = await tempScanner.scanFile(file, true);
      if (decodedText) {
        onScanRef.current?.(decodedText);
      }
    } catch {
      setCameraError(
        "Tidak menemukan QR Code pada gambar yang dipilih. Coba foto yang lebih jelas."
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden File Input for Image QR Scan */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Viewfinder Viewport Container */}
      <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden bg-black/60 border border-white/20 shadow-2xl flex items-center justify-center">
        {/* html5-qrcode video target element */}
        <div
          id={scannerId}
          className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
        />

        {/* Viewfinder Overlay Graphic with Corner Accents */}
        {isScanning && !cameraError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* Darkened vignette around target box */}
            <div className="relative w-[72%] h-[72%] border border-white/30 rounded-xl overflow-hidden">
              {/* 4 Glowing Corner Markers */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-3 border-l-3 border-amber-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-3 border-r-3 border-amber-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-3 border-l-3 border-amber-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-3 border-r-3 border-amber-400 rounded-br-lg" />

              {/* Animated Laser Scanning Beam */}
              <motion.div
                animate={{
                  y: ["0%", "100%", "0%"],
                  opacity: [0.3, 0.9, 0.3],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-full h-0.5 bg-linear-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#fbbf24]"
              />
            </div>
          </div>
        )}

        {/* Camera Permission / Error Fallback Screen */}
        {cameraError && (
          <div className="absolute inset-0 bg-black/90 p-5 flex flex-col items-center justify-center text-center space-y-3 z-10">
            <BsExclamationCircle className="text-3xl text-amber-400 shrink-0" />
            <p className="text-xs text-white/90 leading-relaxed font-medium">
              {cameraError}
            </p>
            <div className="flex flex-col gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => startScanner()}
                className="py-2 px-3 rounded-lg bg-amber-400 text-black text-xs font-semibold hover:brightness-105 transition cursor-pointer"
              >
                Coba Buka Kamera Lagi
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition cursor-pointer"
              >
                Pilih Foto QR dari Galeri
              </button>
            </div>
          </div>
        )}

        {/* Loading / Starting Camera Screen */}
        {!isScanning && !cameraError && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center space-y-2.5 z-10">
            <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-white/70">Menghubungkan kamera...</p>
          </div>
        )}
      </div>

      {/* Floating Viewfinder Helper Text */}
      <div className="mt-3 text-center">
        <p className="text-xs text-white/90 font-medium">
          Arahkan kamera ke QR Code tamu
        </p>
        <p className="text-[10px] text-white/50 mt-0.5">
          Scan dari email, screenshot tiket, atau kertas undangan
        </p>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
        {/* Switch Camera Button (if multiple cameras) */}
        {cameras.length > 1 && (
          <button
            type="button"
            onClick={handleSwitchCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium transition cursor-pointer"
            title="Ganti Kamera"
          >
            <BsArrowRepeat className="text-xs" />
            <span>Ganti Kamera</span>
          </button>
        )}

        {/* Torch Button */}
        {hasTorch && (
          <button
            type="button"
            onClick={handleToggleTorch}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition cursor-pointer ${
              isTorchOn
                ? "bg-amber-400 text-black border-amber-400 font-semibold shadow-sm"
                : "bg-white/10 hover:bg-white/20 border-white/15 text-white"
            }`}
            title="Senter"
          >
            {isTorchOn ? (
              <BsLightbulb className="text-xs" />
            ) : (
              <BsLightbulbOff className="text-xs" />
            )}
            <span>{isTorchOn ? "Flash On" : "Flash"}</span>
          </button>
        )}

        {/* Upload Image Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium transition cursor-pointer"
          title="Upload Foto QR"
        >
          <BsImage className="text-xs" />
          <span>Upload Foto QR</span>
        </button>
      </div>
    </div>
  );
}
