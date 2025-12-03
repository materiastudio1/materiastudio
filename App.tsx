
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Frame, FrameType, AppMode } from './types';
import { Icons } from './components/Icons';
import { GlassButton } from './components/UIComponents';

const DEFAULT_FRAMES: Frame[] = [
  {
    id: 'frame-1',
    type: FrameType.PNG,
    name: 'Frame 1',
    content: 'https://iili.io/fzGjb9f.png',
  },
  {
    id: 'frame-2',
    type: FrameType.PNG,
    name: 'Frame 2',
    content: 'https://iili.io/fzGjQFn.png',
  },
  {
    id: 'frame-3',
    type: FrameType.PNG,
    name: 'Frame 3',
    content: 'https://iili.io/fzGjt8G.png',
  },
  {
    id: 'frame-4',
    type: FrameType.PNG,
    name: 'Frame 4',
    content: 'https://iili.io/fzGjZas.png',
  }
];

const App = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CAMERA);
  const [frames] = useState<Frame[]>(DEFAULT_FRAMES);
  const [activeFrame, setActiveFrame] = useState<Frame>(DEFAULT_FRAMES[0]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode,
            width: { ideal: 1080 },
            height: { ideal: 1920 }
          }
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Camera init failed", err);
      }
    };

    if (mode === AppMode.CAMERA) {
      initCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  }, [mode, facingMode]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Force portrait aspect ratio (9:16)
        // Standard high-res vertical resolution
        const targetWidth = 1080;
        const targetHeight = 1920; 
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Calculate scale to cover the target dimensions
            const videoRatio = video.videoWidth / video.videoHeight;
            const targetRatio = targetWidth / targetHeight;
            
            let drawWidth, drawHeight, startX, startY;

            if (videoRatio > targetRatio) {
                // Video is wider than target
                drawHeight = targetHeight;
                drawWidth = targetHeight * videoRatio;
                startX = (targetWidth - drawWidth) / 2;
                startY = 0;
            } else {
                // Video is taller/skinnier than target
                drawWidth = targetWidth;
                drawHeight = targetWidth / videoRatio;
                startX = 0;
                startY = (targetHeight - drawHeight) / 2;
            }

            ctx.save();
            // Handle mirroring if using front camera
            if (facingMode === 'user') {
                ctx.translate(targetWidth, 0);
                ctx.scale(-1, 1);
            }
            
            ctx.drawImage(video, startX, startY, drawWidth, drawHeight);
            ctx.restore();
            
            setCapturedImage(canvas.toDataURL('image/png'));
            setMode(AppMode.PREVIEW);
        }
    }
  };

  const triggerDownload = (canvas: HTMLCanvasElement) => {
      const link = document.createElement('a');
      link.download = `lumina-photo-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
  };

  const saveImage = () => {
    if (!capturedImage) return;
    
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = capturedImage;
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Draw photo
        ctx.drawImage(img, 0, 0);
        
        // Draw Frame
        if (activeFrame.type === FrameType.SVG && activeFrame.content) {
             const svgImg = new Image();
             const blob = new Blob([activeFrame.content], {type: 'image/svg+xml'});
             const url = URL.createObjectURL(blob);
             svgImg.onload = () => {
                 ctx.drawImage(svgImg, 0, 0, canvas.width, canvas.height);
                 URL.revokeObjectURL(url);
                 triggerDownload(canvas);
             };
             svgImg.src = url;
        } else if (activeFrame.type === FrameType.PNG && activeFrame.content) {
             const frameImg = new Image();
             // Important for handling images from external URLs to avoid tainted canvas
             frameImg.crossOrigin = "anonymous";
             frameImg.src = activeFrame.content;
             frameImg.onload = () => {
                 ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
                 triggerDownload(canvas);
             };
             frameImg.onerror = () => {
                 console.error("Failed to load frame image for saving");
                 triggerDownload(canvas); // Fallback: save without frame
             };
        } else {
            triggerDownload(canvas);
        }
    };
  };

  const shareImage = async () => {
    if (!capturedImage) return;
    
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = capturedImage;
    
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if(!ctx) return;
        
        ctx.drawImage(img, 0, 0);
        
        const processShare = (blob: Blob | null) => {
            if (blob && navigator.share) {
                const file = new File([blob], 'photo.png', { type: 'image/png' });
                navigator.share({
                    title: 'LuminaCam Photo',
                    files: [file]
                }).catch(console.error);
            } else {
                alert('Sharing not supported or failed.');
            }
        };

        if (activeFrame.type === FrameType.PNG && activeFrame.content) {
            const frameImg = new Image();
            frameImg.crossOrigin = "anonymous";
            frameImg.src = activeFrame.content;
            frameImg.onload = () => {
                ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(processShare, 'image/png');
            };
            frameImg.onerror = () => canvas.toBlob(processShare, 'image/png');
        } else if (activeFrame.type === FrameType.SVG && activeFrame.content) {
             const svgImg = new Image();
             const blob = new Blob([activeFrame.content], {type: 'image/svg+xml'});
             const url = URL.createObjectURL(blob);
             svgImg.onload = () => {
                 ctx.drawImage(svgImg, 0, 0, canvas.width, canvas.height);
                 URL.revokeObjectURL(url);
                 canvas.toBlob(processShare, 'image/png');
             };
             svgImg.src = url;
        } else {
            canvas.toBlob(processShare, 'image/png');
        }
    };
  };

  const deleteImage = () => {
      setCapturedImage(null);
      setMode(AppMode.CAMERA);
  };

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            {mode === AppMode.CAMERA && (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
            )}
            {mode === AppMode.PREVIEW && capturedImage && (
                <img src={capturedImage} alt="Preview" className="w-full h-full object-cover" />
            )}
            
            {/* Frame Overlay */}
            {activeFrame.type === FrameType.SVG && activeFrame.content && (
                <div 
                    className="absolute inset-0 pointer-events-none z-10"
                    dangerouslySetInnerHTML={{ __html: activeFrame.content }}
                />
            )}
            {activeFrame.type === FrameType.PNG && activeFrame.content && (
                <img 
                    src={activeFrame.content}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                    alt="Frame Overlay"
                />
            )}
        </div>

        <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 pointer-events-none">
            {/* Top Bar */}
            <div className="flex justify-between items-start pointer-events-auto mt-2">
                {mode === AppMode.CAMERA ? (
                     <GlassButton icon={<Icons.Switch size={24} />} onClick={() => setFacingMode(m => m === 'user' ? 'environment' : 'user')} />
                ) : (
                    <GlassButton icon={<Icons.Back size={24} />} onClick={deleteImage} />
                )}
            </div>

            {/* Bottom Controls */}
            <div className="pointer-events-auto flex flex-col gap-6 items-center mb-4">
                {mode === AppMode.CAMERA && (
                    <>
                        <div className="w-full overflow-x-auto pb-4 flex gap-4 px-4 no-scrollbar justify-center snap-x">
                            {frames.map(frame => (
                                <button
                                    key={frame.id}
                                    onClick={() => setActiveFrame(frame)}
                                    className={`
                                        min-w-[64px] h-[64px] rounded-full border-2 shrink-0 overflow-hidden relative transition-all snap-center shadow-lg
                                        ${activeFrame.id === frame.id ? 'border-yellow-400 scale-110 ring-4 ring-yellow-400/20' : 'border-white/30 bg-black/40'}
                                    `}
                                >
                                    {frame.type === FrameType.SVG && (
                                        <div className="w-full h-full scale-50 opacity-90" dangerouslySetInnerHTML={{ __html: frame.content }} />
                                    )}
                                    {frame.type === FrameType.PNG && (
                                        <img src={frame.content} className="w-full h-full object-cover" alt={frame.name} />
                                    )}
                                    {frame.type === FrameType.NONE && (
                                        <div className="w-full h-full flex items-center justify-center bg-white/10 backdrop-blur-md">
                                            <span className="text-[10px] font-semibold text-white/70">Original</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="pb-4">
                            <button 
                                onClick={takePhoto}
                                className="w-20 h-20 rounded-full border-[6px] border-white/40 flex items-center justify-center bg-white hover:bg-gray-100 active:scale-95 transition-all shadow-2xl"
                            >
                            </button>
                        </div>
                    </>
                )}

                {mode === AppMode.PREVIEW && (
                    <div className="flex items-center gap-6 pb-8">
                        <GlassButton 
                            icon={<Icons.Delete size={24} className="text-red-400" />} 
                            onClick={deleteImage}
                        />
                        <button 
                            onClick={saveImage}
                            className="bg-white text-black rounded-full px-8 py-4 font-bold shadow-xl active:scale-95 transition-transform flex items-center gap-2"
                        >
                            <Icons.Save size={20} />
                            Save
                        </button>
                        <GlassButton 
                            icon={<Icons.Share size={24} />} 
                            onClick={shareImage}
                        />
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default App;
