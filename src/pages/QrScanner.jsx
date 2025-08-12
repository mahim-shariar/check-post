import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import FullScreenCamera from "../components/FullScreenCamera";

const QrScanner = () => {
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [busNumber, setBusNumber] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const soundPlayedRef = useRef(false);

  const busNumberPattern = /^\d{2}-\d{2}-\d{3}$/;

  const startScanner = async () => {
    if (!qrRef.current) {
      console.error("QR container not available.");
      return;
    }

    setCameraError(null);
    setScanSuccess(false);
    soundPlayedRef.current = false;

    try {
      const html5QrCode = new Html5Qrcode(qrRef.current.id);
      html5QrCodeRef.current = html5QrCode;

      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setIsScanning(true);
        setIsInitialized(true);

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 180 },
          },
          (decodedText) => {
            if (busNumberPattern.test(decodedText)) {
              setBusNumber(decodedText);
              setScanSuccess(true);

              if (!soundPlayedRef.current && typeof window !== "undefined") {
                soundPlayedRef.current = true;
                const audio = new Audio("/success-beep.mp3");
                audio.play().catch((e) => console.log("Audio play error:", e));
              }

              stopScanner();
              setShowCamera(true);
            }
          },
          (errorMessage) => {}
        );
      } else {
        setCameraError("No camera found on this device.");
      }
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(
        err.message || "Failed to access camera. Please check permissions."
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn("Stop error:", err.message);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handlePhotoTaken = async (photoData) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return true;
    } catch (error) {
      console.error("Upload error:", error);
      return false;
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    startScanner();
  };

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  if (showCamera) {
    return (
      <FullScreenCamera
        onPhotoTaken={handlePhotoTaken}
        onClose={handleCloseCamera}
        busNumber={busNumber}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <div
        ref={qrRef}
        id="qr-reader"
        className={`w-full h-full bg-black ${
          isInitialized ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80">
          <div className="absolute inset-0 border-2 border-blue-400 rounded-lg opacity-80"></div>

          {[0, 90, 180, 270].map((rotation, i) => (
            <div
              key={i}
              className="absolute w-12 h-12 border-t-4 border-r-4 border-blue-500"
              style={{
                top: i < 2 ? "0" : "auto",
                bottom: i >= 2 ? "0" : "auto",
                left: i === 0 || i === 3 ? "0" : "auto",
                right: i === 1 || i === 2 ? "0" : "auto",
                transform: `rotate(${rotation}deg)`,
                opacity: isScanning ? 1 : 0.5,
                transition: "opacity 0.3s ease",
              }}
            ></div>
          ))}

          {isScanning && (
            <>
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 left-0 right-0 h-px bg-blue-400 opacity-20"
                    style={{
                      top: `${(i * 100) / 20}%`,
                      animation: `scanLine 2s ${i * 0.1}s infinite linear`,
                    }}
                  ></div>
                ))}
              </div>

              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping opacity-75"></div>
              </div>
            </>
          )}
        </div>
      </div>

      {isScanning && (
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="px-4 py-2 bg-black bg-opacity-70 rounded-full text-white text-sm flex items-center">
            <span className="w-2 h-2 mr-2 rounded-full bg-green-500 animate-pulse"></span>
            Scanning...
          </div>
        </div>
      )}

      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-white p-6 rounded-lg max-w-xs text-center">
            <div className="text-red-400 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="mb-4">{cameraError}</p>
            <button
              onClick={startScanner}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scanLine {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        body {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default QrScanner;
