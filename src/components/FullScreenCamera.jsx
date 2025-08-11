import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import {
  FaCamera,
  FaRedo,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";

const FullScreenCamera = () => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  const capture = () => {
    if (!webcamRef.current) return;

    setFlashEffect(true);
    setTimeout(() => {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
      setFlashEffect(false);
    }, 200);
  };

  const retake = () => {
    setImgSrc(null);
  };

  const savePhoto = () => {
    // Add your save logic here
    console.log("Photo saved:", imgSrc);
  };

  const handleError = () => {
    setPermissionError(true);
  };

  const handleLoad = () => {
    setPermissionError(false);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Flash Effect */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white animate-flash"></div>
      )}

      {/* Camera Preview */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt="Captured"
          className="w-full h-full object-cover"
        />
      ) : (
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }}
          className="w-full h-full object-cover"
          onUserMediaError={handleError}
          onUserMedia={handleLoad}
        />
      )}

      {/* Error Message */}
      {permissionError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white p-4 text-center">
          <div className="bg-red-500 rounded-full p-4 mb-4">
            <FaExclamationTriangle className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold mb-2">Camera Access Required</h2>
          <p className="mb-4 text-gray-300">
            Please enable camera permissions in your browser settings
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
          >
            Reload & Allow
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        {imgSrc ? (
          <div className="flex gap-6 bg-black bg-opacity-40 backdrop-blur-sm rounded-full p-3">
            {/* Retake Button */}
            <button
              onClick={retake}
              className="flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-4 transition-all"
              aria-label="Retake photo"
            >
              <FaRedo className="text-black text-xl" />
            </button>

            {/* Save/Confirm Button */}
            <button
              onClick={savePhoto}
              className="flex items-center justify-center bg-green-500 hover:bg-green-600 rounded-full p-4 transition-all"
              aria-label="Save photo"
            >
              <FaCheck className="text-white text-xl" />
            </button>
          </div>
        ) : (
          <button
            onClick={capture}
            disabled={permissionError}
            className={`relative h-16 w-16 rounded-full border-4 border-white ${
              permissionError ? "bg-gray-500" : "bg-red-500 hover:bg-red-600"
            } shadow-lg transition-all flex items-center justify-center`}
            aria-label="Take photo"
          >
            <FaCamera className="text-white text-xl" />
          </button>
        )}
      </div>

      {/* Flash animation style */}
      <style jsx global>{`
        @keyframes flash {
          0% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
          }
        }
        .animate-flash {
          animation: flash 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FullScreenCamera;
