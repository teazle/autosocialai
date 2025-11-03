import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 sm:mb-16 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">AutoSocial AI</h1>
            <p className="text-sm sm:text-base text-gray-700 mt-2">Automatic Content & Posting System</p>
          </div>
          <Link
            href="/admin"
            className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-indigo-700 transition-colors w-full sm:w-auto text-center sm:text-left"
          >
            Admin Dashboard
          </Link>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 px-4">
            Automate Your Social Media
            <span className="text-indigo-600"> Content Creation</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
            AI-powered social media automation for Facebook, Instagram, and TikTok.
            Create engaging content and post automatically without lifting a finger.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">AI-Powered Content</h3>
            <p className="text-sm sm:text-base text-gray-700">
              Generate compelling hooks and captions using advanced AI. 
              Customize brand voice and style automatically.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Premium Visuals</h3>
            <p className="text-sm sm:text-base text-gray-700">
              Create stunning images with AI image generation.
              High-quality visuals that match your brand.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Automated Posting</h3>
            <p className="text-sm sm:text-base text-gray-700">
              Schedule and post to Facebook, Instagram, and TikTok automatically.
              Set it once and forget it.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12 mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Setup Your Account</h4>
              <p className="text-sm sm:text-base text-gray-700">Connect your social media accounts securely via OAuth.</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Configure Preferences</h4>
              <p className="text-sm sm:text-base text-gray-700">Set posting frequency, brand voice, and content rules.</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Automate Everything</h4>
              <p className="text-sm sm:text-base text-gray-700">AI creates and posts content automatically based on your schedule.</p>
            </div>
          </div>
        </div>

        {/* Support Platforms */}
        <div className="text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Supported Platforms</h3>
          <div className="flex justify-center gap-4 sm:gap-6 md:gap-8 flex-wrap">
            <div className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg">
              Facebook
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg">
              Instagram
            </div>
            <div className="bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg">
              TikTok
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 sm:mt-16 md:mt-20 pt-8 border-t border-gray-200 text-center text-gray-700">
          <p className="text-sm sm:text-base">© 2025 AutoSocial AI. All rights reserved.</p>
          <div className="mt-4 flex flex-wrap justify-center items-center gap-2 sm:gap-4">
            <Link href="/privacy" className="text-sm sm:text-base hover:text-indigo-600">
              Privacy Policy
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/terms" className="text-sm sm:text-base hover:text-indigo-600">
              Terms of Service
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
