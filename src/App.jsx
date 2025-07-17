// import React from "react";
// import Header from "./components/Header";
// import AppRouter from "./routes/AppRouter";
// import { BrowserRouter } from "react-router-dom";
// // import { Analytics } from "@vercel/analytics/next"

// const App = () => {
//   return (
//     <>
    
//       <Header />
//       <AppRouter />
//       {/* <Analytics/> */}
//     </>
//   );
// };

// export default App;



import React from "react";
import Header from "./components/Header";
import AppRouter from "./routes/AppRouter";
import { BrowserRouter } from "react-router-dom";
// import { Analytics } from "@vercel/analytics/next"

const App = () => {
  return (
    <BrowserRouter>
      <Header />
      <AppRouter />
      {/* <Analytics/> */}
    </BrowserRouter>
  );
};

export default App;

  