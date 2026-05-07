import React from 'react';

const TermsPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#c30F45] mb-4">Terms of Service</h1>
      <p className="text-gray-300 mb-4">
        This is a placeholder for the Terms of Service.
        Terms of Service are legally binding rules that govern the use of your website or service.
        It is essential to have clear and legally sound Terms of Service.
        Please consult with a legal professional to draft or review your Terms of Service to ensure they are appropriate for your platform and comply with all applicable laws.
      </p>
      <p className="text-gray-300">
        Key elements typically addressed in Terms of Service:
      </p>
      <ul className="list-disc list-inside text-gray-300 ml-4">
        <li>Acceptance of Terms</li>
        <li>User Obligations and Conduct</li>
        <li>Intellectual Property Rights</li>
        <li>Disclaimers and Limitation of Liability</li>
        <li>Termination of Use</li>
        <li>Governing Law and Dispute Resolution</li>
        <li>Changes to the Terms</li>
        <li>Contact Information</li>
      </ul>
    </div>
  );
};

export default TermsPage;
