import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#c30F45] mb-4">Privacy Policy</h1>
      <p className="text-gray-300 mb-4">
        This is a placeholder for the Privacy Policy.
        It is crucial to have a comprehensive and legally compliant Privacy Policy tailored to your specific website and jurisdiction.
        Please consult with a legal professional to draft or review your Privacy Policy to ensure it meets all legal requirements (e.g., GDPR, CCPA).
      </p>
      <p className="text-gray-300">
        Key elements typically included in a Privacy Policy:
      </p>
      <ul className="list-disc list-inside text-gray-300 ml-4">
        <li>What personal data is collected</li>
        <li>How the data is collected (e.g., direct input, cookies)</li>
        <li>Why the data is collected (purpose)</li>
        <li>How the data is used and stored</li>
        <li>Data retention periods</li>
        <li>With whom the data is shared (third parties)</li>
        <li>User rights regarding their data (e.g., access, rectification, erasure)</li>
        <li>Contact information for privacy concerns</li>
        <li>Changes to the Privacy Policy</li>
      </ul>
    </div>
  );
};

export default PrivacyPolicyPage;
