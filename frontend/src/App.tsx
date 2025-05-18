import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SurveyForm from "./pages/SurveyForm";
import Report from "./pages/Report";
import History from "./pages/HistoryPage";
import ReportView from "./pages/ReportView";
import RoomieHome from "./pages/RoomieHome";
import ProfilePage from "./pages/ProfilePage";
import RoomieChat from "./pages/RoomieChat";
import RoomieResult from "./pages/RoomieResult";
import RoomieClean from "./pages/RoomieClean";

function App() {
  return (
  <div className="w-[430px] h-[932px] mx-auto overflow-hidden bg-white shadow-lg">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/survey" element={<SurveyForm />} />
        <Route path="/history" element={<History />} />
        <Route path="/report" element={<Report />} />
        <Route path="/report/view" element={<ReportView />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/roomie" element={<RoomieHome />} />
        <Route path="/roomie/clean" element={<RoomieClean />} />
        <Route path="/roomie/chat" element={<RoomieChat />} />
        <Route path="/roomie/result" element={<RoomieResult />} />
      </Routes>
    </BrowserRouter>
  </div>
  );
}

export default App;
