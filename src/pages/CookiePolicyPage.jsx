import React from 'react';

const CookiePolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 text-gray-300">
      <h1 className="text-4xl font-bold text-[#c30F45] mb-6">
        Cookie Policy
      </h1>

      <p className="mb-4">
        Last Updated: May 7, 2026
      </p>

      <p className="mb-6">
        This Cookie Policy explains how our platform uses cookies and similar
        technologies to improve user experience and platform performance.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        What Are Cookies?
      </h2>

      <p className="mb-6">
        Cookies are small text files stored on your device that help websites
        remember user preferences and activity.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        How We Use Cookies
      </h2>

      <ul className="list-disc ml-6 mb-6 space-y-2">
        <li>Keeping users logged in</li>
        <li>Remembering user preferences</li>
        <li>Improving security and performance</li>
        <li>Analyzing traffic and engagement</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Third-Party Cookies
      </h2>

      <p className="mb-6">
        Some third-party services integrated into the platform may use cookies
        for analytics, authentication, or embedded content.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Managing Cookies
      </h2>

      <p className="mb-6">
        You can control or disable cookies through your browser settings.
        However, disabling cookies may affect some platform functionality.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Policy Updates
      </h2>

      <p>
        We may update this Cookie Policy from time to time to reflect changes
        in technology or legal requirements.
      </p>
    </div>
  );
};

export default CookiePolicyPage;