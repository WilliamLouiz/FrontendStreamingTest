import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Accueil from "./components/pages/Formateur/Accueil";
import MultiVideo from "./components/pages/Formateur/multiVideo";
import SeulStream from "./components/pages/Formateur/seulStream";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/accueil" element={<Accueil />} />
        <Route path="/live" element={<MultiVideo />} />
        <Route path="/detail" element={<SeulStream />} />
      </Routes>
    </Router>
  );
}

export default App;
