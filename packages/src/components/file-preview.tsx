"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  File,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/*//////////////////////////////////////////////////////////////
                        TYPES
//////////////////////////////////////////////////////////////*/

interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileData: Uint8Array | null;
  fileName: string;
  mimeType: string;
  isLoading?: boolean;
  error?: string | null;
  onDownload?: () => void;
}

type PreviewType = 
  | "image" 
  | "pdf" 
  | "video" 
  | "audio" 
  | "text" 
  | "code" 
  | "unsupported";

/*//////////////////////////////////////////////////////////////
                        CONSTANTS
//////////////////////////////////////////////////////////////*/

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
];

const VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];

const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/aac",
];

const TEXT_TYPES = [
  "text/plain",
  "text/csv",
  "text/html",
  "text/xml",
  "application/json",
  "application/xml",
];

const CODE_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx", ".py", ".rb", ".go", ".rs",
  ".java", ".c", ".cpp", ".h", ".hpp", ".cs", ".php", ".swift",
  ".kt", ".scala", ".sql", ".sh", ".bash", ".zsh", ".ps1",
  ".yaml", ".yml", ".toml", ".ini", ".env", ".md", ".mdx",
];

const MAX_TEXT_SIZE = 1024 * 1024; // 1MB for text preview

/*//////////////////////////////////////////////////////////////
                        HELPERS
//////////////////////////////////////////////////////////////*/

function getPreviewType(mimeType: string, fileName: string): PreviewType {
  if (IMAGE_TYPES.includes(mimeType)) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (VIDEO_TYPES.includes(mimeType)) return "video";
  if (AUDIO_TYPES.includes(mimeType)) return "audio";
  if (TEXT_TYPES.includes(mimeType)) return "text";
  
  // Check by extension for code files
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  if (CODE_EXTENSIONS.includes(ext)) return "code";
  
  // Check if text-based by trying to decode
  if (mimeType.startsWith("text/")) return "text";
  
  return "unsupported";
}

function getFileIcon(previewType: PreviewType) {
  switch (previewType) {
    case "image": return FileImage;
    case "pdf": return FileText;
    case "video": return FileVideo;
    case "audio": return FileAudio;
    case "code": return FileCode;
    case "text": return FileText;
    default: return File;
  }
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  const langMap: Record<string, string> = {
    ".js": "javascript",
    ".jsx": "jsx",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".py": "python",
    ".rb": "ruby",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".c": "c",
    ".cpp": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin",
    ".scala": "scala",
    ".sql": "sql",
    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "zsh",
    ".ps1": "powershell",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".json": "json",
    ".xml": "xml",
    ".html": "html",
    ".css": "css",
    ".md": "markdown",
    ".mdx": "markdown",
  };
  return langMap[ext] || "plaintext";
}

/*//////////////////////////////////////////////////////////////
                        COMPONENTS
//////////////////////////////////////////////////////////////*/

function ImagePreview({ 
  data, 
  mimeType 
}: { 
  data: Uint8Array; 
  mimeType: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  const imageUrl = useMemo(() => {
    const blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType });
    return URL.createObjectURL(blob);
  }, [data, mimeType]);
  
  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);
  
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));
  const handleRotate = () => setRotation(r => (r + 90) % 360);
  
  return (
    <div className="relative flex-1 flex flex-col">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={handleZoomOut}
          className="p-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border hover:bg-secondary transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="px-3 py-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border text-sm">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border hover:bg-secondary transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleRotate}
          className="p-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border hover:bg-secondary transition-colors"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
      
      {/* Image */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-8">
        <img
          src={imageUrl}
          alt="Preview"
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        />
      </div>
    </div>
  );
}

function VideoPreview({ 
  data, 
  mimeType 
}: { 
  data: Uint8Array; 
  mimeType: string;
}) {
  const videoUrl = useMemo(() => {
    const blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType });
    return URL.createObjectURL(blob);
  }, [data, mimeType]);

  useEffect(() => {
    return () => URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);
  
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <video
        src={videoUrl}
        controls
        className="max-w-full max-h-full rounded-lg"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function AudioPreview({ 
  data, 
  mimeType,
  fileName
}: { 
  data: Uint8Array; 
  mimeType: string;
  fileName: string;
}) {
  const audioUrl = useMemo(() => {
    const blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType });
    return URL.createObjectURL(blob);
  }, [data, mimeType]);

  useEffect(() => {
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <FileAudio className="w-16 h-16 text-primary" />
      </div>
      <p className="text-lg font-medium mb-4">{fileName}</p>
      <audio src={audioUrl} controls className="w-full max-w-md">
        Your browser does not support the audio tag.
      </audio>
    </div>
  );
}

function TextPreview({ 
  data,
  fileName,
  isCode
}: { 
  data: Uint8Array;
  fileName: string;
  isCode: boolean;
}) {
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      if (data.length > MAX_TEXT_SIZE) {
        // Only show first 1MB
        const truncated = data.slice(0, MAX_TEXT_SIZE);
        const text = new TextDecoder().decode(truncated);
        setContent(text + "\n\n... [File truncated for preview]");
      } else {
        const text = new TextDecoder().decode(data);
        setContent(text);
      }
    } catch (e) {
      setError("Unable to decode file content");
    }
  }, [data]);
  
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  
  const language = isCode ? getLanguageFromFileName(fileName) : "plaintext";
  
  return (
    <div className="flex-1 overflow-auto p-4">
      <pre className={`text-sm font-mono p-4 bg-[#0D0D0F] rounded-lg overflow-auto ${
        isCode ? "language-" + language : ""
      }`}>
        <code>{content}</code>
      </pre>
    </div>
  );
}

function PDFPreview({ data }: { data: Uint8Array }) {
  const pdfUrl = useMemo(() => {
    const blob = new Blob([data.buffer as ArrayBuffer], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  }, [data]);
  
  useEffect(() => {
    return () => URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);
  
  return (
    <div className="flex-1 p-4">
      <iframe
        src={pdfUrl}
        className="w-full h-full rounded-lg border border-border"
        title="PDF Preview"
      />
    </div>
  );
}

function UnsupportedPreview({ 
  fileName, 
  mimeType,
  fileSize,
  onDownload
}: { 
  fileName: string;
  mimeType: string;
  fileSize: number;
  onDownload?: () => void;
}) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center mb-6">
        <File className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{fileName}</h3>
      <p className="text-sm text-muted-foreground mb-1">{mimeType}</p>
      <p className="text-sm text-muted-foreground mb-6">{formatSize(fileSize)}</p>
      <p className="text-sm text-muted-foreground mb-6">
        Preview not available for this file type
      </p>
      {onDownload && (
        <button
          onClick={onDownload}
          className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download to View
        </button>
      )}
    </div>
  );
}

/*//////////////////////////////////////////////////////////////
                        MAIN COMPONENT
//////////////////////////////////////////////////////////////*/

export function FilePreview({
  isOpen,
  onClose,
  fileData,
  fileName,
  mimeType,
  isLoading = false,
  error = null,
  onDownload,
}: FilePreviewProps) {
  const previewType = useMemo(
    () => getPreviewType(mimeType, fileName),
    [mimeType, fileName]
  );
  
  const FileIcon = getFileIcon(previewType);
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-card border border-border rounded-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground truncate max-w-md">
                    {fileName}
                  </h3>
                  <p className="text-xs text-muted-foreground">{mimeType}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {onDownload && (
                  <button
                    onClick={onDownload}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 flex overflow-hidden bg-secondary/30">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Decrypting file...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <p className="text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : !fileData ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-muted-foreground">No file data available</p>
                </div>
              ) : previewType === "image" ? (
                <ImagePreview data={fileData} mimeType={mimeType} />
              ) : previewType === "video" ? (
                <VideoPreview data={fileData} mimeType={mimeType} />
              ) : previewType === "audio" ? (
                <AudioPreview data={fileData} mimeType={mimeType} fileName={fileName} />
              ) : previewType === "pdf" ? (
                <PDFPreview data={fileData} />
              ) : previewType === "text" || previewType === "code" ? (
                <TextPreview 
                  data={fileData} 
                  fileName={fileName} 
                  isCode={previewType === "code"} 
                />
              ) : (
                <UnsupportedPreview
                  fileName={fileName}
                  mimeType={mimeType}
                  fileSize={fileData.length}
                  onDownload={onDownload}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
