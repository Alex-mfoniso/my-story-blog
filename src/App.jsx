import React from "react";
import Header from "./components/Header";
import AppRouter from "./routes/AppRouter";
import { Analytics } from "@vercel/analytics/next"

const App = () => {
  return (
    <>
      <Header />
      <AppRouter />
      <Analytics/>
    </>
  );
};

export default App;