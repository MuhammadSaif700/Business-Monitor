import React from 'react'

export default function CookiesPolicy(){
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="panel p-8">
        <h1 className="text-3xl font-bold mb-6 gradient-accent bg-clip-text text-transparent">
          Cookies Policy
        </h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">What are Cookies?</h2>
            <p className="mb-4">
              Cookies are small text files that are placed on your computer or mobile device when you visit 
              a website. They help websites remember your preferences and improve your browsing experience.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">How We Use Cookies</h2>
            <p className="mb-4">
              Business Monitor uses cookies and similar technologies for the following purposes:
            </p>
            
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  🛡️ Essential Cookies
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  These cookies are necessary for the website to function and cannot be switched off. 
                  They enable core functionality such as security, authentication, and accessibility.
                </p>
                <ul className="list-disc pl-4 mt-2 text-sm text-green-700 dark:text-green-300">
                  <li>User authentication and session management</li>
                  <li>Security and fraud prevention</li>
                  <li>Form submission and data persistence</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  ⚙️ Functional Cookies
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  These cookies enable enhanced functionality and personalization, such as remembering 
                  your preferences and settings.
                </p>
                <ul className="list-disc pl-4 mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <li>Theme preferences (dark/light mode)</li>
                  <li>Language settings</li>
                  <li>Dashboard configurations</li>
                  <li>Recent search history</li>
                </ul>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                  📊 Analytics Cookies
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  These cookies help us understand how visitors interact with our website by collecting 
                  and reporting information anonymously.
                </p>
                <ul className="list-disc pl-4 mt-2 text-sm text-purple-700 dark:text-purple-300">
                  <li>Page views and user navigation patterns</li>
                  <li>Feature usage and performance metrics</li>
                  <li>Error tracking and diagnostics</li>
                  <li>A/B testing and optimization</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Types of Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-200 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800">
                    <th className="border border-slate-200 dark:border-slate-700 p-3 text-left">Cookie Name</th>
                    <th className="border border-slate-200 dark:border-slate-700 p-3 text-left">Purpose</th>
                    <th className="border border-slate-200 dark:border-slate-700 p-3 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 dark:border-slate-700 p-3 font-mono text-sm">auth_token</td>
                    <td className="border border-slate-200 dark:border-slate-700 p-3">User authentication</td>
                    <td className="border border-slate-200 dark:border-slate-700 p-3">Session</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 dark:border-slate-700 p-3 font-mono text-sm">theme_preference</td>
                    <td className="border border-slate-200 dark:border-slate-700 p-3">Dark/light mode setting</td>
                    <td className="border border-slate-200 dark:border-slate-700 p-3">1 year</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 dark:border-slate-700 p-3 font-mono text-sm">dashboard_config</td>
                    <td className="border border-slate-200 dark:border-slate-700 p-3">Custom dashboard settings</td>
                    <td className="border border-slate-200 dark:border-slate-700 p-3">6 months</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 dark:border-slate-700 p-3 font-mono text-sm">analytics_id</td>
                    <td className="border border-slate-200 dark:border-slate-700 p-3">Usage analytics</td>
                    <td className="border border-slate-200 dark:border-slate-700 p-3">2 years</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Managing Your Cookies</h2>
            <p className="mb-4">
              You have several options to manage cookies:
            </p>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-3">
              <div>
                <h4 className="font-semibold">Browser Settings</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Most browsers allow you to control cookies through their settings. You can set your browser to:
                </p>
                <ul className="list-disc pl-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
                  <li>Block all cookies</li>
                  <li>Accept cookies from specific sites only</li>
                  <li>Delete cookies when you close your browser</li>
                  <li>Notify you when cookies are being set</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold">Our Cookie Preferences</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  We provide a cookie consent banner when you first visit our site, allowing you to 
                  accept or decline non-essential cookies.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Third-Party Cookies</h2>
            <p className="mb-4">
              We may use third-party services that set their own cookies. These include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Analytics:</strong> For website analytics and performance measurement</li>
              <li><strong>CDN Providers:</strong> For content delivery and performance optimization</li>
              <li><strong>Authentication Services:</strong> For secure login functionality</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Impact of Disabling Cookies</h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Please note:</strong> Disabling certain cookies may impact your experience on our website. 
                Essential cookies are required for the site to function properly, and disabling them may prevent 
                you from accessing certain features or services.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Cookies Policy from time to time to reflect changes in our practices 
              or for other operational, legal, or regulatory reasons. Any changes will be posted on this page 
              with an updated revision date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have any questions about our use of cookies or this policy, please contact us at:
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <p><strong>Email:</strong> privacy@businessmonitor.com</p>
              <p><strong>Subject:</strong> Cookie Policy Inquiry</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}