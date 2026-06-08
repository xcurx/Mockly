"use client";

import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileArrowUp,
  File,
  CheckCircle,
  SpinnerGap,
  Warning,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ResumeUploadProps {
  onUploadComplete: (resumeId: string, parsedData: Record<string, unknown>) => void;
  resumeId: string | null;
  parsedData: Record<string, unknown> | null;
  isUploading: boolean;
  error: string | null;
  onFileSelect: (file: File) => void;
}

export function ResumeUpload({
  onUploadComplete,
  resumeId,
  parsedData,
  isUploading,
  error,
  onFileSelect,
}: ResumeUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">
        Resume{" "}
        <span className="text-muted-foreground font-normal">(optional)</span>
      </h3>

      <Card
        className={cn(
          "border-dashed transition-all cursor-pointer",
          dragOver && "border-purple-500/50 bg-purple-500/5",
          resumeId && "border-solid border-green-500/30 bg-green-500/5",
          error && "border-red-500/30"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <SpinnerGap className="size-8 text-purple-400 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Parsing resume with AI...
              </p>
            </div>
          ) : resumeId && parsedData ? (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle weight="fill" className="size-5" />
                <span className="text-sm font-medium">Resume parsed</span>
              </div>
              {(parsedData as any).skills && (
                <div className="flex flex-wrap gap-1">
                  {((parsedData as any).skills as string[])
                    .slice(0, 10)
                    .map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-[10px]">
                        {skill}
                      </Badge>
                    ))}
                  {((parsedData as any).skills as string[]).length > 10 && (
                    <Badge variant="secondary" className="text-[10px]">
                      +{((parsedData as any).skills as string[]).length - 10} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <FileArrowUp
                weight="duotone"
                className="size-10 text-muted-foreground mb-2"
              />
              <p className="text-sm text-muted-foreground">
                Drag & drop your resume here
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                PDF or DOCX, max 5MB
              </p>
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileInput}
                className="hidden"
                id="resume-input"
              />
              <label
                htmlFor="resume-input"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
              >
                <File className="size-3.5" />
                Or browse files
              </label>
            </>
          )}

          {error && (
            <div className="flex items-center gap-1.5 mt-3 text-red-400 text-xs">
              <Warning weight="fill" className="size-3.5" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
