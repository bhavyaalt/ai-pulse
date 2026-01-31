export default function BroadcastPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6">🎙️ AI Pulse Daily Broadcast</h1>
      <video 
        controls 
        autoPlay
        className="max-w-4xl w-full rounded-lg shadow-2xl border border-cyan-900"
      >
        <source src="/videos/ai-pulse-broadcast.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <p className="text-gray-400 mt-4 text-center">
        January 31, 2026 • AI-Generated News<br/>
        <span className="text-cyan-600">Powered by Grok + Edge-TTS + FFmpeg</span>
      </p>
      <a href="/" className="mt-6 text-cyan-400 hover:text-cyan-300">← Back to Feed</a>
    </div>
  );
}
