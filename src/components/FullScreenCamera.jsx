import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaRedo, FaCheck, FaTimes, FaVideo } from "react-icons/fa";

const FullScreenCamera = () => {
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [busNumber, setBusNumber] = useState("");
  const [stream, setStream] = useState(null); // Added to track the camera stream

  // Get scanned bus number from localStorage
  useEffect(() => {
    const scannedBus = localStorage.getItem("scannedBusNumber");
    if (scannedBus) {
      setBusNumber(scannedBus);
    } else {
      navigate("/qr-scanner");
    }
  }, [navigate]);

  // Initialize camera when permission is granted
  useEffect(() => {
    if (!hasCameraPermission) return;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (webcamRef.current) {
          webcamRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (err) {
        console.error("Camera initialization error:", err);
        setCameraError(err.message || "Failed to start camera");
        setHasCameraPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [hasCameraPermission]);

  const requestCameraAccess = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setHasCameraPermission(true);
      setCameraError(null);
      // Immediately stop the test stream
      mediaStream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.error("Camera permission error:", err);
      setCameraError(err.message || "Camera access denied");
      setHasCameraPermission(false);
    }
  };

  const capture = () => {
    if (!webcamRef.current) return;

    setFlashEffect(true);
    setTimeout(() => {
      const video = webcamRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      // Flip the image back to normal (undoing the mirror effect)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      setImgSrc(canvas.toDataURL("image/jpeg"));
      setFlashEffect(false);
    }, 200);
  };

  const retake = () => {
    setImgSrc(null);
    setUploadSuccess(false);
    setUploadError(false);
  };

  const handleSubmit = async () => {
    if (!imgSrc || !busNumber) return;

    setIsUploading(true);
    setUploadError(false);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("busNumber", busNumber);
      formData.append(
        "timestamp",
        localStorage.getItem("scanTimestamp") || new Date().toISOString()
      );

      // Convert base64 image to blob
      const blob = await fetch(imgSrc).then((res) => res.blob());
      formData.append("image", blob, "bus-photo.jpg");

      // Send to server
      const response = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();

      // Clear stored data
      localStorage.removeItem("scannedBusNumber");
      localStorage.removeItem("scanTimestamp");

      setUploadSuccess(true);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up camera stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    localStorage.removeItem("scannedBusNumber");
    localStorage.removeItem("scanTimestamp");
    navigate("/");
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Flash effect */}
      {flashEffect && (
        <div className="absolute inset-0 bg-white animate-flash"></div>
      )}

      {/* Bus number display */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
        <div className="px-4 py-2 bg-black bg-opacity-70 rounded-full text-white text-sm">
          Bus: {busNumber}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white"
        aria-label="Close camera"
      >
        <FaTimes className="text-xl" />
      </button>

      {/* Main content */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt="Captured bus"
          className="w-full h-full object-cover"
        />
      ) : (
        <>
          {!hasCameraPermission && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white p-4 text-center z-20">
              <div
                className={`rounded-full p-4 mb-4 ${
                  cameraError ? "bg-red-500" : "bg-blue-500"
                }`}
              >
                {cameraError ? (
                  <FaTimes className="text-2xl" />
                ) : (
                  <FaVideo className="text-2xl" />
                )}
              </div>
              <h2 className="text-xl font-bold mb-2">
                {cameraError ? "Camera Blocked" : "Camera Access Required"}
              </h2>
              <p className="mb-4 text-gray-300 max-w-md">
                {cameraError ||
                  `To verify bus ${busNumber}, please allow camera access`}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={requestCameraAccess}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                >
                  {cameraError ? "Try Again" : "Allow Camera"}
                </button>
                {cameraError && (
                  <button
                    onClick={handleClose}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {hasCameraPermission && !cameraError && (
            <video
              ref={webcamRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }} // Mirror the video
            />
          )}
        </>
      )}

      {/* Upload status */}
      {uploadSuccess ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white p-4 text-center z-20">
          <div className="bg-green-500 rounded-full p-4 mb-4">
            <FaCheck className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold mb-2">Verification Complete!</h2>
          <p className="mb-4 text-gray-300">
            Bus {busNumber} has been successfully verified.
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
          >
            Done
          </button>
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
        hasCameraPermission &&
        !cameraError && (
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
                  onClick={handleSubmit}
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
              <button
                onClick={capture}
                className="relative h-16 w-16 rounded-full border-4 border-white bg-red-500 hover:bg-red-600 shadow-lg transition-all flex items-center justify-center"
                aria-label="Take photo"
              >
                <FaCamera className="text-white text-xl" />
              </button>
            )}
          </div>
        )
      )}

      {/* Styles */}
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
