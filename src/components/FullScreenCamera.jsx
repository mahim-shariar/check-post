import React, { useState } from "react";
import { Camera } from "react-html5-camera-photo";
import "react-html5-camera-photo/build/css/index.css";
import { FaCamera, FaRedo, FaCheck, FaTimes, FaSyncAlt } from "react-icons/fa";

const FullScreenCamera = ({ onPhotoTaken, onClose, busNumber }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // 'environment' or 'user'

  const handleTakePhoto = (dataUri) => {
    setFlashEffect(true);
    setTimeout(() => {
      setImgSrc(dataUri);
      setFlashEffect(false);
    }, 200);
  };

  const retake = () => {
    setImgSrc(null);
    setUploadSuccess(false);
    setUploadError(false);
  };

  const toggleCamera = () => {
    setFacingMode((prevMode) =>
      prevMode === "environment" ? "user" : "environment"
    );
  };

  const savePhoto = async () => {
    if (!imgSrc) return;

    setIsUploading(true);
    try {
      const success = await onPhotoTaken(imgSrc);
      if (success) {
        setUploadSuccess(true);
      } else {
        setUploadError(true);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(true);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 w-full h-full bg-black overflow-hidden"
      style={{ touchAction: "none" }}
    >
      {/* Flash effect when capturing */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white animate-flash"></div>
      )}

      {/* Bus number display */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
        <div className="px-4 py-2 bg-black bg-opacity-70 rounded-full text-white text-sm">
          Bus: {busNumber}
        </div>
      </div>

      {/* Camera switch button - only visible when not viewing captured image */}
      {!imgSrc && (
        <button
          onClick={toggleCamera}
          className="absolute top-4 left-4 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white"
          aria-label="Switch camera"
        >
          <FaSyncAlt className="text-xl" />
        </button>
      )}

      {/* Camera preview or captured image */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt="Captured bus"
          className="w-full h-full object-cover"
        />
      ) : (
        <Camera
          onTakePhoto={handleTakePhoto}
          idealFacingMode={facingMode}
          isFullscreen={true}
          isImageMirror={false}
          sizeFactor={1}
          className="w-full h-full object-cover"
        />
      )}

      {/* Upload status messages */}
      {uploadSuccess ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white p-4 text-center z-20">
          <div className="bg-green-500 rounded-full p-4 mb-4">
            <FaCheck className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold mb-2">Verification Complete!</h2>
          <p className="mb-4 text-gray-300">
            Bus {busNumber} has been successfully verified.
          </p>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
            >
              Done
            </button>
            <button
              onClick={retake}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-full transition-colors"
            >
              Take Another
            </button>
          </div>
        </div>
      ) : uploadError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white p-4 text-center z-20">
          <div className="bg-red-500 rounded-full p-4 mb-4">
            <FaTimes className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold mb-2">Upload Failed</h2>
          <p className="mb-4 text-gray-300">
            Could not verify bus. Please try again.
          </p>
          <button
            onClick={retake}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        /* Camera controls */
        <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
          {imgSrc ? (
            <div className="flex gap-6 bg-black bg-opacity-40 backdrop-blur-sm rounded-full p-3">
              <button
                onClick={retake}
                className="flex items-center justify-center bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-4 transition-all"
                aria-label="Retake photo"
                disabled={isUploading}
              >
                <FaRedo className="text-black text-xl" />
              </button>
              <button
                onClick={savePhoto}
                className="flex items-center justify-center bg-green-500 hover:bg-green-600 rounded-full p-4 transition-all"
                aria-label="Save photo"
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <FaCheck className="text-white text-xl" />
                )}
              </button>
            </div>
          ) : (
            <div></div>
          )}
        </div>
      )}

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
        body {
          overflow: hidden;
          touch-action: none;
        }
        /* Override react-html5-camera-photo styles */
        .react-html5-camera-photo > video {
          object-fit: cover !important;
        }
        .react-html5-camera-photo {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default FullScreenCamera;
