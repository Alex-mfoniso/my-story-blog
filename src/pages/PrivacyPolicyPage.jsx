import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 text-gray-300">
      <h1 className="text-4xl font-bold text-[#c30F45] mb-6">
        Privacy Policy
      </h1>

      <p className="mb-4">
        Last Updated: May 7, 2026
      </p>

      <p className="mb-6">
        We respect your privacy and are committed to protecting your personal
        information. This Privacy Policy explains how we collect, use, and
        safeguard your information when you use our platform.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Information We Collect
      </h2>

      <ul className="list-disc ml-6 mb-6 space-y-2">
        <li>Name, username, and email address</li>
        <li>Profile information and uploaded content</li>
        <li>Stories, comments, likes, and bookmarks</li>
        <li>Device and browser information</li>
        <li>Usage analytics and activity logs</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white mb-3">
        How We Use Your Information
      </h2>

      <ul className="list-disc ml-6 mb-6 space-y-2">
        <li>To create and manage user accounts</li>
        <li>To personalize your experience</li>
        <li>To improve platform performance and security</li>
        <li>To send notifications and updates</li>
        <li>To moderate harmful or abusive content</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Data Protection
      </h2>

      <p className="mb-6">
        We take reasonable measures to protect your information from
        unauthorized access, loss, misuse, or disclosure.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Third-Party Services
      </h2>

      <p className="mb-6">
        Our platform may use third-party services such as authentication,
        analytics, cloud storage, and payment providers that may collect
        information in accordance with their own privacy policies.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Your Rights
      </h2>

      <p className="mb-6">
        You may request access, correction, or deletion of your personal data
        at any time by contacting us.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Changes to This Policy
      </h2>

      <p className="mb-6">
        We may update this Privacy Policy from time to time. Continued use of
        the platform after changes means you accept the updated policy.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Contact
      </h2>

      <p>
        If you have questions about this Privacy Policy, please contact us.
      </p>
    </div>
  );
};

export default PrivacyPolicyPage;