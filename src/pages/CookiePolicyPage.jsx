import React from 'react';

const CookiePolicyPage = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#c30F45] mb-4">Cookie Policy</h1>
      <p className="text-gray-300 mb-4">
        This is a placeholder for the Cookie Policy.
        A Cookie Policy explains what cookies are, how your website uses them, and how users can manage their preferences.
        Compliance with data privacy regulations (like GDPR, CCPA) often requires a clear and accessible Cookie Policy.
        Please consult with a legal professional to draft or review your Cookie Policy to ensure it accurately reflects your cookie usage and complies with relevant laws.
      </p>
      <p className="text-gray-300">
        Key elements typically found in a Cookie Policy:
      </p>
      <ul className="list-disc list-inside text-gray-300 ml-4">
        <li>Definition of cookies and similar technologies</li>
        <li>Types of cookies used (e.g., essential, performance, functional, targeting)</li>
        <li>Purpose of each cookie type</li>
        <li>Information about third-party cookies</li>
        <li>How users can control or opt-out of cookies</li>
        <li>Link to Privacy Policy</li>
        <li>Date of last update</li>
      </ul>
    </div>
  );
};

export default CookiePolicyPage;
