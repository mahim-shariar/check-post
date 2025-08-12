import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import QrScanner from "./pages/QrScanner";
import FullScreenCamera from "./components/FullScreenCamera";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/qr-scanner" element={<QrScanner />} />
          {/* <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          /> */}
          <Route path="/camera" element={<FullScreenCamera />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
