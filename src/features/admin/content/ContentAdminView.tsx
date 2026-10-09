import { useSearchParams } from "react-router-dom";
import { Image as ImageIcon, Megaphone } from "lucide-react";
import CoverAdminView from "../cover/CoverAdminView";
import AdsAdmin from "../ads/AdsAdmin";
import { SegmentedControl } from "../../../shared/ui";

export type ContentSection = "cover" | "ads";

/** /admin?tab=content&seccion=portada|publicidad: cómo se ve la plataforma (marca, portada y anuncios). */
export default function ContentAdminView({ section }: { section: ContentSection }) {
  const [, setParams] = useSearchParams();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <SegmentedControl
        value={section}
        onChange={(value) =>
          setParams({ tab: "content", seccion: value === "ads" ? "publicidad" : "portada" }, { replace: true })
        }
        options={[
          { value: "cover", label: "Portada", icon: <ImageIcon size={14} /> },
          { value: "ads", label: "Publicidad", icon: <Megaphone size={14} /> },
        ]}
      />
      {section === "cover" && <CoverAdminView />}
      {section === "ads" && <AdsAdmin />}
    </div>
  );
}
