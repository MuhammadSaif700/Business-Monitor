import React from 'react'

export default function TermsOfService(){
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="panel p-8">
        <h1 className="text-3xl font-bold mb-6 gradient-accent bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using Business Monitor ("Service"), you accept and agree to be bound 
              by the terms and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Business Monitor is a comprehensive business analytics platform that enables users to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload and analyze business data</li>
              <li>Generate reports and visualizations</li>
              <li>Access AI-powered insights</li>
              <li>Create custom dashboards</li>
              <li>Export data and reports</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            <p className="mb-4">
              To access certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
              <li>Use the Service only for lawful purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Data and Privacy</h2>
            <p className="mb-4">
              Your privacy is important to us. Our collection and use of your information is governed by 
              our <a href="/privacy-policy" className="link">Privacy Policy</a>. By using the Service, you consent to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The collection and processing of your data as described in our Privacy Policy</li>
              <li>The use of cookies and tracking technologies</li>
              <li>The analysis of your usage patterns to improve our services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="mb-4">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload malicious software or engage in harmful activities</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit spam, fraudulent, or deceptive content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by 
              Business Monitor and are protected by international copyright, trademark, and other laws. 
              You retain ownership of your data uploaded to the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Service Availability</h2>
            <p className="mb-4">
              We strive to maintain high availability but cannot guarantee uninterrupted access. 
              The Service may be unavailable due to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Scheduled maintenance</li>
              <li>Emergency repairs</li>
              <li>Force majeure events</li>
              <li>Third-party service dependencies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="mb-4">
              To the fullest extent permitted by law, Business Monitor shall not be liable for any 
              indirect, incidental, special, consequential, or punitive damages, including loss of profits, 
              data, or other intangible losses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account and access to the Service immediately, without 
              prior notice, for conduct that we believe violates these Terms or is harmful to other users, 
              us, or third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. We will notify users of material 
              changes via email or through the Service. Continued use after changes constitutes acceptance 
              of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Governing Law</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <p><strong>Email:</strong> legal@businessmonitor.com</p>
              <p><strong>Address:</strong> Business Monitor Legal Department</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}