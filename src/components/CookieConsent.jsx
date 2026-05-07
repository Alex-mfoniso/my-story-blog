import React, { useState, useEffect } from "react";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "true");
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-14 left-0 right-0 bg-gray-800 text-white p-3 flex flex-wrap items-center justify-center sm:justify-between gap-2 z-[9999] shadow-lg">
      <p className="text-xs text-center">
        We use cookies to ensure you get the best experience on our website. By continuing to use this site, you agree to our{" "}
        <a href="/cookie-policy" className="text-blue-400 hover:underline">
          Cookie Policy
        </a>
        .
      </p>
      <button
        onClick={acceptCookies}
        className="bg-[#c30F45] hover:bg-[#a50a3b] text-white text-sm font-bold py-1 px-3 rounded transition-colors duration-200"
      >
        Accept
      </button>
    </div>
  );
};

export default CookieConsent;
