import { useState, useRef } from "react";
import { Upload, FileText, Image, Film, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getAuthToken } from "../utils/authStorage";

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const ICON_MAP = {
  image:    <Image className="w-4 h-4 text-blue-500" />,
  video:    <Film className="w-4 h-4 text-purple-500" />,
  document: <FileText className="w-4 h-4 text-slate-500" />,
};

function fileTypeOf(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

export default function FileUploadWidget({ caseId, accentColor = "blue", onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState([]); // { name, type, status:"pending"|"uploading"|"done"|"error", url? }
  const inputRef = useRef(null);

  const accent = {
    blue:  { border: "border-blue-300",  bg: "bg-blue-50",  text: "text-blue-600",  btn: "bg-blue-600 hover:bg-blue-700" },
    green: { border: "border-green-300", bg: "bg-green-50", text: "text-green-700", btn: "bg-green-700 hover:bg-green-800" },
  }[accentColor] || {};

  const uploadFile = async (file) => {
    const id = `${file.name}-${Date.now()}`;
    const type = fileTypeOf(file);

    setUploads(prev => [...prev, { id, name: file.name, type, status: "uploading" }]);

    try {
      const token = getAuthToken();
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${BASE}/api/uploads/${caseId}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: "done", url: data.file?.url } : u));
      onUploaded?.(data.file);
    } catch (err) {
      setUploads(prev => prev.map(u => u.id === id ? { ...u, status: "error", error: err.message } : u));
    }
  };

  const handleFiles = (files) => {
    Array.from(files).forEach(uploadFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const remove = (id) => setUploads(prev => prev.filter(u => u.id !== id));

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
          ${dragging ? `${accent.border} ${accent.bg}` : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
      >
        <Upload className={`w-7 h-7 mx-auto mb-2 ${dragging ? accent.text : "text-slate-300"}`} />
        <p className="text-[13px] font-semibold text-slate-600">
          {dragging ? "Drop to upload" : "Drag & drop files here"}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Images, PDFs, videos — up to 10 MB each
        </p>
        <button
          type="button"
          className={`mt-3 px-4 py-1.5 text-[12px] font-bold text-white rounded-xl transition-colors ${accent.btn}`}
          onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
        >
          Browse Files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map(u => (
            <div key={u.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-3 py-2.5 shadow-sm">
              {ICON_MAP[u.type]}
              <p className="flex-1 text-[12px] font-semibold text-slate-700 truncate">{u.name}</p>
              {u.status === "uploading" && <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />}
              {u.status === "done"      && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
              {u.status === "error"     && (
                <span title={u.error}><AlertCircle className="w-4 h-4 text-red-500 shrink-0" /></span>
              )}
              {u.status !== "uploading" && (
                <button onClick={() => remove(u.id)} className="text-slate-300 hover:text-slate-500 shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
