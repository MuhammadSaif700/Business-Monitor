import React from 'react'

export default function PrivacyPolicy(){
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="panel p-8">
        <h1 className="text-3xl font-bold mb-6 gradient-accent bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              use our services, or contact us for support.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, username, and password</li>
              <li><strong>Business Data:</strong> Sales data, transaction records, and analytics you upload</li>
              <li><strong>Usage Information:</strong> How you interact with our platform and services</li>
              <li><strong>Device Information:</strong> Browser type, operating system, and IP address</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Generate analytics and insights for your business</li>
              <li>Communicate with you about updates and support</li>
              <li>Protect against fraud and abuse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Information Sharing</h2>
            <p className="mb-4">
              We do not sell, trade, or rent your personal information to third parties. 
              We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist in our operations (under strict confidentiality)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction. These include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and employee training</li>
              <li>Secure hosting infrastructure</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict processing of your information</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Cookies and Tracking</h2>
            <p className="mb-4">
              We use cookies and similar technologies to improve your experience. 
              For detailed information, please see our <a href="/cookies-policy" className="link">Cookies Policy</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Data Retention</h2>
            <p className="mb-4">
              We retain your information for as long as necessary to provide our services and comply 
              with legal obligations. You can request deletion of your account and data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this privacy policy from time to time. We will notify you of any 
              material changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this privacy policy or our privacy practices, 
              please contact us at:
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <p><strong>Email:</strong> privacy@businessmonitor.com</p>
              <p><strong>Address:</strong> Business Monitor Privacy Office</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}