"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useStore } from "@/lib/store";
import { saveFile, getFile, deleteFile, getStorageUsage, MAX_FILE_SIZE, MAX_TOTAL_STORAGE } from "@/lib/db";
import { Upload, Trash2, FileText, Image, FileSpreadsheet, File, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
];

const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.doc,.docx,.pptx,.txt";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileText;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel")
  )
    return FileSpreadsheet;
  return File;
}

interface MaterialUploadProps {
  linkedTo: { type: "timetable" | "deadline"; id: string };
  className?: string;
}

export function MaterialUpload({ linkedTo, className }: MaterialUploadProps) {
  const materials = useStore((s) => s.materials);
  const addMaterial = useStore((s) => s.addMaterial);
  const removeMaterial = useStore((s) => s.removeMaterial);

  const [uploading, setUploading] = useState(false);
  const [storageUsage, setStorageUsage] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const linked = materials.filter(
    (m) => m.linkedTo.type === linkedTo.type && m.linkedTo.id === linkedTo.id
  );

  const refreshStorage = useCallback(async () => {
    try {
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshStorage();
  }, [refreshStorage, materials.length]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert(`Die Datei ist zu gross. Maximal ${formatFileSize(MAX_FILE_SIZE)}.`);
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|png|jpe?g|docx?|pptx|txt)$/i)) {
      alert("Dieser Dateityp wird nicht unterstuetzt.");
      return;
    }

    setUploading(true);
    try {
      const id = addMaterial({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        linkedTo,
      });
      await saveFile(id, file);
      await refreshStorage();
    } catch {
      alert("Fehler beim Hochladen.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (materialId: string, name: string, mimeType: string) => {
    try {
      const data = await getFile(materialId);
      if (!data) {
        alert("Datei nicht gefunden.");
        return;
      }
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Fehler beim Herunterladen.");
    }
  };

  const handleDelete = async (materialId: string) => {
    try {
      await deleteFile(materialId);
      removeMaterial(materialId);
      await refreshStorage();
    } catch {
      alert("Fehler beim Loeschen.");
    }
  };

  const storageWarning =
    storageUsage !== null && storageUsage > MAX_TOTAL_STORAGE * 0.8;

  return (
    <div className={className}>
      {/* Material list */}
      {linked.length > 0 && (
        <div className="space-y-1.5">
          {linked.map((m) => {
            const Icon = getFileIcon(m.mimeType);
            return (
              <div
                key={m.id}
                className="group flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Icon className="h-4 w-4 shrink-0 text-neutral-400" />
                <button
                  type="button"
                  onClick={() => handleDownload(m.id, m.name, m.mimeType)}
                  className="flex-1 truncate text-left text-sm text-neutral-900 hover:underline dark:text-neutral-100"
                >
                  {m.name}
                </button>
                <span className="shrink-0 text-xs text-neutral-400">
                  {formatFileSize(m.size)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  className="shrink-0 rounded p-0.5 text-neutral-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Storage warning */}
      {storageWarning && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            Speicher fast voll ({formatFileSize(storageUsage!)} von{" "}
            {formatFileSize(MAX_TOTAL_STORAGE)})
          </span>
        </div>
      )}

      {/* Upload button */}
      <div className="mt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-8 gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Wird hochgeladen...
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              Datei hochladen
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
