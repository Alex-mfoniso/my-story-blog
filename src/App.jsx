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
import AppRouter from "./routes/AppRouter";
import { BrowserRouter } from "react-router-dom";
import MainLayout from "./components/MainLayout";

const App = () => {
  return (
    <BrowserRouter>
      <MainLayout>
        <AppRouter />
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;

  