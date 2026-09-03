export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Upload Dataset</h2>
      <div className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center">
        <p>Drag and drop your hyperspectral files here</p>
        <p className="text-sm text-slate-400 mt-2">Supported: .hdr, .npy, .mat</p>
      </div>
    </div>
  );
}
