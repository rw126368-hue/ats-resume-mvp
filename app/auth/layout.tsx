export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            ATS Resume Generator
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            AI-powered resume optimization for job seekers
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
