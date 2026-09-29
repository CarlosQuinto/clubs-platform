import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { TournamentEditHost } from "./components/admin/TournamentEditModal";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import InviteRespond from "./pages/InviteRespond";
import SuperAdmin from "./pages/SuperAdmin";
import TournamentArchive from "./pages/TournamentArchive";
import TournamentPage from "./pages/Tournament";
import ClubPage from "./pages/ClubPage";
import TeamsPage from "./pages/Teams";
import MatchesPage from "./pages/Matches";
import Contact from "./pages/Contact";
import RegisterTeam from "./pages/RegisterTeam";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TournamentEditHost>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/invitar" element={<InviteRespond />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/registrar-equipo" element={<RegisterTeam />} />
            <Route path="/admin" element={<SuperAdmin />} />
            <Route path="/admin/temporadas" element={<Navigate to="/torneos" replace />} />
            <Route path="/admin/temporadas/:id" element={<Navigate to="/torneos" replace />} />
            <Route path="/torneos" element={<TournamentArchive />} />
            <Route path="/torneos/:id" element={<TournamentPage />} />
            <Route path="/temporadas" element={<Navigate to="/torneos" replace />} />
            <Route path="/temporadas/:id" element={<Navigate to="/torneos" replace />} />
            <Route path="/equipos" element={<TeamsPage />} />
            <Route path="/partidos" element={<MatchesPage />} />
            <Route path="/:slug" element={<ClubPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TournamentEditHost>
      </AuthProvider>
    </BrowserRouter>
  );
}
