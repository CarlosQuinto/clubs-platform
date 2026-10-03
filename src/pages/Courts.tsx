import { useAuth } from "../context/AuthContext";
import CourtsPageView from "../features/courts/CourtsPageView";

export default function CourtsPage() {
  const { isSuperAdmin } = useAuth();
  return <CourtsPageView warnMissingWhatsapp={isSuperAdmin} />;
}
