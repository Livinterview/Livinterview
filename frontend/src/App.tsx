import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SurveyForm from "./pages/SurveyForm";
<<<<<<< Updated upstream
=======
import Report from "./pages/Report"
import ReportPdf from "./pages/ReportPdf"
import RoomieHome from "./pages/RoomieHome"
import ProfilePage from "./pages/ProfilePage"
>>>>>>> Stashed changes

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/survey" element={<SurveyForm />} />
<<<<<<< Updated upstream
=======
        <Route path="/report" element={<ReportPdf />} />
        <Route path="/roomie" element={<RoomieHome />} /> 
        <Route path="/profile" element={<ProfilePage />} /> 
>>>>>>> Stashed changes
      </Routes>
    </BrowserRouter>
  );
}

export default App;

