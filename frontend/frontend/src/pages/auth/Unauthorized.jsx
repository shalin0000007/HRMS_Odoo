export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy">
      <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
      <p className="text-xl text-white/60">You do not have permission to access this page.</p>
      <a href="/dashboard" className="mt-8 text-teal hover:underline">Back to Safety</a>
    </div>
  );
}
