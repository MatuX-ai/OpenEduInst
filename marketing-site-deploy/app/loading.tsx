export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto mb-6">
          <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-slate-400 text-sm">加载中...</p>
      </div>
    </div>
  );
}
