'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setEnhancedImage(null);
        setProgress(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const enhance4K = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Create an image element to get original dimensions
      const img = document.createElement('img');
      img.src = originalImage;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      setProgress(20);

      // Create canvas with 4K dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not get canvas context');

      // Set 4K dimensions (3840 x 2160)
      const targetWidth = 3840;
      const targetHeight = 2160;

      // Calculate aspect ratio
      const aspectRatio = img.width / img.height;
      const targetAspectRatio = targetWidth / targetHeight;

      let finalWidth = targetWidth;
      let finalHeight = targetHeight;

      if (aspectRatio > targetAspectRatio) {
        finalHeight = Math.round(targetWidth / aspectRatio);
      } else {
        finalWidth = Math.round(targetHeight * aspectRatio);
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;

      setProgress(40);

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the image with enhanced quality
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      setProgress(60);

      // Apply sharpening filter
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const sharpened = applySharpening(imageData);
      ctx.putImageData(sharpened, 0, 0);

      setProgress(80);

      // Apply contrast and brightness enhancement
      ctx.filter = 'contrast(1.1) brightness(1.05)';
      ctx.drawImage(canvas, 0, 0);

      setProgress(90);

      // Convert to high-quality data URL
      const enhanced = canvas.toDataURL('image/png', 1.0);
      setEnhancedImage(enhanced);
      setProgress(100);

    } catch (error) {
      console.error('Enhancement error:', error);
      alert('Failed to enhance image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const applySharpening = (imageData: ImageData): ImageData => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new ImageData(width, height);

    // Sharpening kernel
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              sum += data[idx] * kernel[kernelIdx];
            }
          }
          const outputIdx = (y * width + x) * 4 + c;
          output.data[outputIdx] = Math.min(255, Math.max(0, sum));
        }
        const alphaIdx = (y * width + x) * 4 + 3;
        output.data[alphaIdx] = data[alphaIdx];
      }
    }

    return output;
  };

  const downloadImage = () => {
    if (!enhancedImage) return;

    const link = document.createElement('a');
    link.href = enhancedImage;
    link.download = '4k-enhanced-image.png';
    link.click();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            4K Photo Enhancer
          </h1>
          <p className="text-xl text-blue-200">
            Transform any image to stunning 4K quality instantly
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="flex flex-col items-center mb-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="imageInput"
            />
            <label
              htmlFor="imageInput"
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold cursor-pointer hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              📁 Choose Image to Enhance
            </label>
          </div>

          {originalImage && (
            <div className="mb-8 flex flex-col items-center">
              <button
                onClick={enhance4K}
                disabled={isProcessing}
                className={`px-12 py-4 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl ${
                  isProcessing
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                }`}
              >
                {isProcessing ? '⚡ Enhancing...' : '🚀 Enhance to 4K Quality'}
              </button>

              {isProcessing && (
                <div className="mt-6 w-full max-w-md">
                  <div className="bg-white/20 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-white text-center mt-2 font-semibold">
                    {progress}% Complete
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {originalImage && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white text-center">
                  Original Image
                </h3>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-auto rounded-lg shadow-xl"
                  />
                </div>
              </div>
            )}

            {enhancedImage && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white text-center">
                  4K Enhanced Image
                </h3>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <img
                    src={enhancedImage}
                    alt="Enhanced"
                    className="w-full h-auto rounded-lg shadow-xl"
                  />
                </div>
                <button
                  onClick={downloadImage}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  ⬇️ Download 4K Image
                </button>
              </div>
            )}
          </div>

          {!originalImage && (
            <div className="text-center py-20">
              <div className="text-8xl mb-6">🖼️</div>
              <p className="text-2xl text-white/70">
                Upload an image to get started
              </p>
            </div>
          )}
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-3">⚡</div>
            <h4 className="text-xl font-bold text-white mb-2">Instant Processing</h4>
            <p className="text-blue-200">Lightning-fast enhancement in seconds</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-3">🎨</div>
            <h4 className="text-xl font-bold text-white mb-2">AI-Powered</h4>
            <p className="text-blue-200">Advanced algorithms for best quality</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-4xl mb-3">🔒</div>
            <h4 className="text-xl font-bold text-white mb-2">100% Private</h4>
            <p className="text-blue-200">All processing happens in your browser</p>
          </div>
        </div>
      </div>
    </main>
  );
}
