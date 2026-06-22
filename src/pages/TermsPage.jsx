import React from 'react';

const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 text-gray-300">
      <h1 className="text-4xl font-bold text-[#c30F45] mb-6">
        Terms of Service
      </h1>

      <p className="mb-4">
        Last Updated: May 7, 2026
      </p>

      <p className="mb-6">
        By accessing or using this platform, you agree to comply with these
        Terms of Service.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        User Accounts
      </h2>

      <p className="mb-6">
        Users are responsible for maintaining the security of their accounts
        and the accuracy of the information provided.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        User Content
      </h2>

      <p className="mb-6">
        Users retain ownership of the stories and content they publish.
        However, by posting content, you grant us permission to display and
        distribute that content on the platform.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Prohibited Activities
      </h2>

      <ul className="list-disc ml-6 mb-6 space-y-2">
        <li>Posting illegal or harmful content</li>
        <li>Harassment, hate speech, or abuse</li>
        <li>Spam or misleading information</li>
        <li>Attempting to disrupt platform security</li>
      </ul>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Account Termination
      </h2>

      <p className="mb-6">
        We reserve the right to suspend or terminate accounts that violate
        these terms or harm the platform community.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Disclaimer
      </h2>

      <p className="mb-6">
        The platform is provided "as is" without warranties of any kind. We
        are not responsible for user-generated content.
      </p>

      <h2 className="text-2xl font-semibold text-white mb-3">
        Changes to Terms
      </h2>

      <p className="mb-6">
        We may update these Terms of Service at any time. Continued use of the
        platform means you accept the revised terms.
      </p>
    </div>
  );
};

export default TermsPage;