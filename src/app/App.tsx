import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../domains/auth/AuthContext";
import { TournamentEditHost } from "../features/tournament/TournamentEditModal";
import DocumentBrand from "./DocumentBrand";
import Landing from "../features/home/HomePageView";
import Login from "../features/auth/Login";
import ResetPassword from "../features/auth/ResetPassword";
import Registro from "../features/auth/Registro";
import InviteRespond from "../features/auth/InviteRespond";
import SuperAdmin from "../features/admin/SuperAdmin";
import TournamentArchive from "../features/tournament/TournamentArchiveView";
import TournamentPage from "../features/tournament/TournamentScreenView";
import ClubPage from "../features/club/ClubPage";
import TeamsPage from "../features/teams/TeamsPageView";
import MatchesPage from "../features/matches/MatchesPageView";
import MatchPage from "../features/match/MatchDetailView";
import Contact from "../features/contact/ContactView";
import RegisterTeam from "../features/registerTeam/RegisterTeamView";
import CourtsPage from "../features/courts/CourtsPageView";
import SeasonSummary from "../features/seasonSummary/SeasonSummaryView";
import { PrivacyPage, TermsPage } from "../features/legal/LegalPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DocumentBrand />
        <TournamentEditHost>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/restablecer" element={<ResetPassword />} />
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
            <Route path="/temporadas/:id/resumen" element={<SeasonSummary />} />
            <Route path="/equipos" element={<TeamsPage />} />
            <Route path="/partidos" element={<MatchesPage />} />
            <Route path="/partido/:id" element={<MatchPage />} />
            <Route path="/canchas" element={<CourtsPage />} />
            <Route path="/terminos" element={<TermsPage />} />
            <Route path="/aviso-de-privacidad" element={<PrivacyPage />} />
            <Route path="/:slug" element={<ClubPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TournamentEditHost>
      </AuthProvider>
    </BrowserRouter>
  );
}
