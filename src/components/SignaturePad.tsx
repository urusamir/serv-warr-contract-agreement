import { useRef, useState, useCallback } from "react";
import { Eraser, Pencil, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (dataUrl: string) => void;
}

type Mode = "draw" | "upload";

export function SignaturePad({ value, onChange }: Props) {
  const [mode, setMode] = useState<Mode>("draw");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasDrawingRef = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawing, setHasDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    lastPos.current = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    e.preventDefault();
    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    lastPos.current = pos;
    hasDrawingRef.current = true;
    setHasDrawing(true);
  }, []);

  const stopDraw = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPos.current = null;
    const canvas = canvasRef.current;
    if (canvas && hasDrawingRef.current) {
      onChange(canvas.toDataURL());
    }
  }, [onChange]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawingRef.current = false;
    setHasDrawing(false);
    onChange("");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadedImage = mode === "upload" && value ? value : null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(["draw", "upload"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              mode === m
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m === "draw" ? <Pencil className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
            {m === "draw" ? "Draw" : "Upload"}
          </button>
        ))}
      </div>

      {mode === "draw" && (
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={160}
            className="w-full border-2 border-border rounded-lg bg-white cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          {!hasDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground text-sm gap-2">
              <Pencil className="h-4 w-4" />
              Sign here
            </div>
          )}
          {hasDrawing && (
            <button
              type="button"
              onClick={clearCanvas}
              title="Clear"
              className="absolute top-2 right-2 p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition"
            >
              <Eraser className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {mode === "upload" && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          {uploadedImage ? (
            <div className="relative border-2 border-border rounded-lg overflow-hidden bg-white">
              <img src={uploadedImage} alt="Signature" className="w-full h-40 object-contain" />
              <button
                type="button"
                title="Remove"
                onClick={() => {
                  onChange("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground transition"
              >
                <Eraser className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              <Upload className="h-6 w-6" />
              <span className="text-sm font-medium">Click to upload signature image</span>
              <span className="text-xs">PNG, JPG (max. 5MB)</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
