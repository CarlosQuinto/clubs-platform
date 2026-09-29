import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  Package,
  AlertTriangle,
  PlusCircle,
  Minus,
  Plus,
  Trash2,
  Circle,
  Triangle,
  Shirt,
  Wind,
  Activity,
  Shield,
  Archive,
  HelpCircle,
  X,
  RefreshCcw,
  Goal,
  Droplet,
  BriefcaseMedical,
  LayoutTemplate,
  Timer,
} from "lucide-react";
import { addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useClub } from "../context/ClubContext";
import { useModalLock } from "../hooks/useModalLock";
import {
  C,
  RADIUS,
  SHADOWS,
  SectionCard,
  FormInput,
  FormSelect,
  PrimaryButton,
  SecondaryButton,
} from "../components/ui";

// ── SÚPER DICCIONARIO PARA ASIGNAR ÍCONOS AUTOMÁTICAMENTE ──
const getIconForItem = (name: string, size = 20, color = C.navy600) => {
  const lowerName = name.toLowerCase();

  // ⚽ Balones
  if (
    lowerName.includes("balón") ||
    lowerName.includes("balon") ||
    lowerName.includes("pelota")
  )
    return <Circle size={size} color={color} fill="rgba(0,0,0,0.05)" />;

  // 🔺 Conos y platos
  if (
    lowerName.includes("cono") ||
    lowerName.includes("plato") ||
    lowerName.includes("boya")
  )
    return <Triangle size={size} color={color} fill="rgba(0,0,0,0.05)" />;

  // 👕 Ropa y uniformes
  if (
    lowerName.includes("casaca") ||
    lowerName.includes("peto") ||
    lowerName.includes("uniforme") ||
    lowerName.includes("short") ||
    lowerName.includes("media")
  )
    return <Shirt size={size} color={color} />;

  // 🥅 Porterías y redes
  if (
    lowerName.includes("portería") ||
    lowerName.includes("porteria") ||
    lowerName.includes("red") ||
    lowerName.includes("arco") ||
    lowerName.includes("miniportería")
  )
    return <Goal size={size} color={color} />;

  // 💧 Hidratación
  if (
    lowerName.includes("agua") ||
    lowerName.includes("botella") ||
    lowerName.includes("termo") ||
    lowerName.includes("hielera") ||
    lowerName.includes("garrafón")
  )
    return <Droplet size={size} color={color} fill="rgba(0,0,0,0.05)" />;

  // ⛑️ Médico y recuperación
  if (
    lowerName.includes("botiquín") ||
    lowerName.includes("botiquin") ||
    lowerName.includes("venda") ||
    lowerName.includes("spray") ||
    lowerName.includes("hielo") ||
    lowerName.includes("medicina")
  )
    return <BriefcaseMedical size={size} color={color} />;

  // 📋 Táctica
  if (
    lowerName.includes("pizarra") ||
    lowerName.includes("plumón") ||
    lowerName.includes("tactica") ||
    lowerName.includes("libreta")
  )
    return <LayoutTemplate size={size} color={color} />;

  // ⏱️ Arbitraje y medición
  if (
    lowerName.includes("silbato") ||
    lowerName.includes("cronómetro") ||
    lowerName.includes("cronometro") ||
    lowerName.includes("tarjeta")
  )
    return <Timer size={size} color={color} />;

  // 💨 Infladores
  if (
    lowerName.includes("bomba") ||
    lowerName.includes("aire") ||
    lowerName.includes("inflador") ||
    lowerName.includes("aguja")
  )
    return <Wind size={size} color={color} />;

  // 🏃‍♂️ Agilidad y físico
  if (
    lowerName.includes("escalera") ||
    lowerName.includes("valla") ||
    lowerName.includes("aro") ||
    lowerName.includes("pesa") ||
    lowerName.includes("liga") ||
    lowerName.includes("paracaídas")
  )
    return <Activity size={size} color={color} />;

  // 🛡️ Protección
  if (lowerName.includes("espinillera") || lowerName.includes("guante"))
    return <Shield size={size} color={color} />;

  // 📦 Por defecto (Caja de archivo)
  return <Archive size={size} color={color} />;
};

// ── JERARQUÍA DE ESTADOS PARA ORDENAR ──
const conditionRank: Record<string, number> = {
  Bueno: 1,
  Regular: 2,
  Malo: 3,
  Perdido: 4,
};

// 👇 NUEVO: COMPONENTE DE RESUMEN EN LISTA 👇
const InventorySummaryModal = ({ category, inventory, onClose }: any) => {
  useModalLock(onClose);

  // Filtrar el inventario según la tarjeta seleccionada
  let summaryItems: any[] = [];
  let title = "";
  let TitleIcon = Package;
  let headerColor = C.navy900;

  if (category === "Almacén") {
    summaryItems = inventory.filter((i: any) => i.condition !== "Perdido");
    title = "Inventario Activo";
    TitleIcon = Package;
  } else if (category === "Dañados") {
    summaryItems = inventory.filter((i: any) => i.condition === "Malo");
    title = "Artículos para Reposición";
    TitleIcon = AlertTriangle;
    headerColor = C.red;
  } else if (category === "Extraviados") {
    summaryItems = inventory.filter((i: any) => i.condition === "Perdido");
    title = "Artículos Extraviados";
    TitleIcon = HelpCircle;
    headerColor = C.amber;
  }

  // Ordenar alfabéticamente
  summaryItems.sort((a: any, b: any) => a.name.localeCompare(b.name));

  const totalUnidades = summaryItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 25, 41, 0.90)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          width: "100%",
          maxWidth: "450px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: SHADOWS.xl,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Resumen */}
        <div
          style={{ padding: "1.5rem", borderBottom: `1px solid ${C.gray200}` }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: headerColor,
                fontWeight: "800",
                fontSize: "1.125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <TitleIcon size={20} color={headerColor} /> {title}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: C.gray400,
                cursor: "pointer",
                padding: "0.25rem",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Lista Deslizable */}
        <div
          className="hide-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}
        >
          {summaryItems.map((item: any, i: number) => {
            const isBad = item.condition === "Malo";
            const isRegular = item.condition === "Regular";
            const isLost = item.condition === "Perdido";

            const accentColor = isBad
              ? C.red
              : isRegular
                ? C.amber
                : isLost
                  ? C.gray500
                  : C.green;
            const bgAccent = isBad
              ? "rgba(239, 68, 68, 0.15)"
              : isRegular
                ? "rgba(245, 158, 11, 0.15)"
                : isLost
                  ? "rgba(107, 114, 128, 0.15)"
                  : "rgba(16, 185, 129, 0.15)";

            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.75rem 0",
                  borderBottom:
                    i === summaryItems.length - 1
                      ? "none"
                      : `1px solid ${C.gray100}`,
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: RADIUS.md,
                    backgroundColor: bgAccent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {getIconForItem(item.name, 22, accentColor)}
                </div>

                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "800",
                      color: C.navy900,
                      fontSize: "0.95rem",
                    }}
                  >
                    {item.name}
                  </p>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: accentColor,
                      fontWeight: "800",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {item.condition}
                  </span>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "1.25rem",
                      fontWeight: "900",
                      color: C.navy900,
                      lineHeight: 1.1,
                    }}
                  >
                    {item.quantity}
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: C.gray500,
                      fontWeight: "700",
                    }}
                  >
                    pzs
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pie: Total de la categoría */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            backgroundColor: C.gray50,
            borderTop: `1px solid ${C.gray200}`,
            borderBottomLeftRadius: RADIUS.xl,
            borderBottomRightRadius: RADIUS.xl,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontWeight: "700",
              color: C.gray600,
              fontSize: "0.875rem",
            }}
          >
            Total en esta lista:
          </span>
          <span
            style={{
              fontWeight: "900",
              color: headerColor,
              fontSize: "1.25rem",
            }}
          >
            {totalUnidades} pzs
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
};
// 👆 ========================================= 👆

export default function Inventory({ inventory, perms }: any) {
  const { col, item: itemRef } = useClub();
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [itemCondition, setItemCondition] = useState("Bueno");

  const [animatingId, setAnimatingId] = useState<string | null>(null);

  // Estados para el modal de dividir/cambiar estado
  const [condItem, setCondItem] = useState<any | null>(null);
  const [condQty, setCondQty] = useState<number>(1);
  const [condNew, setCondNew] = useState<string>("Malo");
  useModalLock(condItem ? () => setCondItem(null) : null);

  // 👇 NUEVO: ESTADO PARA LA LISTA DE RESUMEN 👇
  const [summaryCategory, setSummaryCategory] = useState<string | null>(null);

  // Cálculos de KPIs (Excluimos perdidos del total del almacén)
  const totalArticulos = inventory
    .filter((i: any) => i.condition !== "Perdido")
    .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  const articulosMalos = inventory
    .filter((i: any) => i.condition === "Malo")
    .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  const articulosPerdidos = inventory
    .filter((i: any) => i.condition === "Perdido")
    .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || itemQty < 1) return;

    const existingItem = inventory.find(
      (i: any) =>
        i.name.toLowerCase() === itemName.trim().toLowerCase() &&
        i.condition === itemCondition,
    );

    if (existingItem) {
      await updateDoc(itemRef("inventory", existingItem.id), {
        quantity: existingItem.quantity + itemQty,
      });
    } else {
      await addDoc(col("inventory"), {
        name: itemName.trim(),
        quantity: itemQty,
        condition: itemCondition,
        timestamp: new Date().toISOString(),
      });
    }

    setItemName("");
    setItemQty(1);
    setItemCondition("Bueno");
  };

  const handleUpdateQty = async (
    id: string,
    currentQty: number,
    change: number,
  ) => {
    if (currentQty + change < 0) return;
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 300);
    await updateDoc(itemRef("inventory", id), {
      quantity: currentQty + change,
    });
  };

  const handleConfirmConditionChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !condItem ||
      condQty < 1 ||
      condQty > condItem.quantity ||
      condNew === condItem.condition
    )
      return;

    const isFullTransfer = condQty === condItem.quantity;
    const targetItem = inventory.find(
      (i: any) => i.name === condItem.name && i.condition === condNew,
    );

    try {
      if (isFullTransfer) {
        if (targetItem) {
          await updateDoc(itemRef("inventory", targetItem.id), {
            quantity: targetItem.quantity + condQty,
          });
          await deleteDoc(itemRef("inventory", condItem.id));
        } else {
          await updateDoc(itemRef("inventory", condItem.id), {
            condition: condNew,
          });
        }
      } else {
        await updateDoc(itemRef("inventory", condItem.id), {
          quantity: condItem.quantity - condQty,
        });
        if (targetItem) {
          await updateDoc(itemRef("inventory", targetItem.id), {
            quantity: targetItem.quantity + condQty,
          });
        } else {
          await addDoc(col("inventory"), {
            name: condItem.name,
            quantity: condQty,
            condition: condNew,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error(err);
      alert("Hubo un error al actualizar el inventario.");
    }

    setCondItem(null);
  };

  const sortedInventory = [...inventory].sort((a, b) => {
    if (conditionRank[a.condition] !== conditionRank[b.condition]) {
      return conditionRank[a.condition] - conditionRank[b.condition];
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* ── KPI CARDS (BOTONES INTERACTIVOS) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "0.75rem",
        }}
      >
        {/* TARJETA 1: EN ALMACÉN */}
        <button
          onClick={() => totalArticulos > 0 && setSummaryCategory("Almacén")}
          style={{
            position: "relative",
            backgroundColor: C.navy900,
            borderRadius: RADIUS.xl,
            padding: "1.25rem",
            color: C.white,
            boxShadow: SHADOWS.lg,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "110px",
            border: "none",
            textAlign: "left",
            cursor: totalArticulos > 0 ? "pointer" : "default",
            transition: "transform 0.2s ease",
            opacity: totalArticulos > 0 ? 1 : 0.7,
            fontFamily: "inherit",
          }}
          onMouseOver={(e) =>
            totalArticulos > 0 &&
            (e.currentTarget.style.transform = "scale(1.03)")
          }
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Package
            size={90}
            color={C.white}
            style={{
              position: "absolute",
              right: "-15px",
              bottom: "-20px",
              opacity: 0.1,
              transform: "rotate(-10deg)",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.7rem",
                fontWeight: "800",
                letterSpacing: "0.05em",
                opacity: 0.7,
                textTransform: "uppercase",
              }}
            >
              En Almacén
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.3rem",
                marginTop: "0.2rem",
              }}
            >
              <span
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "900",
                  lineHeight: "1",
                }}
              >
                {totalArticulos}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "700",
                  opacity: 0.8,
                }}
              >
                pzs
              </span>
            </div>
          </div>
        </button>

        {/* TARJETA 2: DAÑADOS */}
        <button
          onClick={() => articulosMalos > 0 && setSummaryCategory("Dañados")}
          style={{
            position: "relative",
            backgroundColor: articulosMalos > 0 ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${articulosMalos > 0 ? "#fca5a5" : "#bbf7d0"}`,
            borderRadius: RADIUS.xl,
            padding: "1.25rem",
            color: articulosMalos > 0 ? C.red : C.green,
            boxShadow: SHADOWS.sm,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "110px",
            textAlign: "left",
            cursor: articulosMalos > 0 ? "pointer" : "default",
            transition: "transform 0.2s ease",
            opacity: articulosMalos > 0 ? 1 : 0.7,
            fontFamily: "inherit",
          }}
          onMouseOver={(e) =>
            articulosMalos > 0 &&
            (e.currentTarget.style.transform = "scale(1.03)")
          }
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <AlertTriangle
            size={90}
            color={articulosMalos > 0 ? C.red : C.green}
            style={{
              position: "absolute",
              right: "-15px",
              bottom: "-15px",
              opacity: 0.06,
              transform: "rotate(10deg)",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.7rem",
                fontWeight: "800",
                letterSpacing: "0.05em",
                opacity: 0.7,
                textTransform: "uppercase",
              }}
            >
              Dañados
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.3rem",
                marginTop: "0.2rem",
              }}
            >
              <span
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "900",
                  lineHeight: "1",
                }}
              >
                {articulosMalos}
              </span>
            </div>
            <p
              style={{
                margin: "0.4rem 0 0 0",
                fontSize: "0.7rem",
                fontWeight: "700",
                opacity: 0.8,
              }}
            >
              {articulosMalos > 0
                ? "¡Requieren reposición!"
                : "Todo en buen estado"}
            </p>
          </div>
        </button>

        {/* TARJETA 3: EXTRAVIADOS */}
        <button
          onClick={() =>
            articulosPerdidos > 0 && setSummaryCategory("Extraviados")
          }
          style={{
            position: "relative",
            backgroundColor: articulosPerdidos > 0 ? "#fffbeb" : "#f0fdf4",
            border: `1px solid ${articulosPerdidos > 0 ? "#fcd34d" : "#bbf7d0"}`,
            borderRadius: RADIUS.xl,
            padding: "1.25rem",
            color: articulosPerdidos > 0 ? C.amber : C.green,
            boxShadow: SHADOWS.sm,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "110px",
            textAlign: "left",
            cursor: articulosPerdidos > 0 ? "pointer" : "default",
            transition: "transform 0.2s ease",
            opacity: articulosPerdidos > 0 ? 1 : 0.7,
            fontFamily: "inherit",
          }}
          onMouseOver={(e) =>
            articulosPerdidos > 0 &&
            (e.currentTarget.style.transform = "scale(1.03)")
          }
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <HelpCircle
            size={90}
            color={articulosPerdidos > 0 ? C.amber : C.green}
            style={{
              position: "absolute",
              right: "-15px",
              bottom: "-15px",
              opacity: 0.06,
              transform: "rotate(-10deg)",
            }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.7rem",
                fontWeight: "800",
                letterSpacing: "0.05em",
                opacity: 0.7,
                textTransform: "uppercase",
              }}
            >
              Extraviados
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.3rem",
                marginTop: "0.2rem",
              }}
            >
              <span
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "900",
                  lineHeight: "1",
                }}
              >
                {articulosPerdidos}
              </span>
            </div>
            <p
              style={{
                margin: "0.4rem 0 0 0",
                fontSize: "0.7rem",
                fontWeight: "700",
                opacity: 0.8,
              }}
            >
              {articulosPerdidos > 0 ? "Sin localizar" : "Inventario completo"}
            </p>
          </div>
        </button>
      </div>

      {/* ── INGRESAR NUEVO MATERIAL ── */}
      {perms.canEditInventory && (
        <SectionCard
          className="compact-form-card"
          title="Ingresar Nuevo Material"
          icon={<PlusCircle size={14} color={C.navy600} />}
          style={{
            backgroundColor: C.white,
            border: `1px solid ${C.gray200}`,
            boxShadow: SHADOWS.sm,
          }}
        >
          <form
            onSubmit={handleAddInventory}
            className="compact-form inventory-form"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.45rem",
            }}
          >
            <FormInput
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Nombre del artículo (Ej. Balones)"
              style={{ width: "100%" }}
            />

            <div className="inventory-qty-row">
              <FormInput
                type="number"
                required
                min="1"
                value={itemQty}
                onChange={(e) => setItemQty(parseInt(e.target.value) || 0)}
                placeholder="Cant."
                aria-label="Cantidad"
              />
              <FormSelect
                value={itemCondition}
                onChange={(e) => setItemCondition(e.target.value)}
                aria-label="Condición"
              >
                <option value="Bueno">🟢 Bueno</option>
                <option value="Regular">🟡 Regular</option>
                <option value="Malo">🔴 Malo</option>
                <option value="Perdido">⚫ Perdido</option>
              </FormSelect>
            </div>

            <PrimaryButton
              type="submit"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                display: "flex",
                justifyContent: "center",
                gap: "0.3rem",
              }}
            >
              <Plus size={14} /> Añadir al Inventario
            </PrimaryButton>
          </form>
        </SectionCard>
      )}

      {/* ── LISTA DE INVENTARIO ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h3
          style={{
            margin: "0.5rem 0 0 0",
            fontSize: "1.125rem",
            fontWeight: "800",
            color: C.navy900,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Archive size={18} color={C.navy600} /> Desglose del Equipo
        </h3>

        {sortedInventory.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: C.gray400,
              fontStyle: "italic",
              padding: "2rem 0",
            }}
          >
            El almacén está vacío. ¡Empieza a registrar el material!
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {sortedInventory.map((item: any) => {
              const isBad = item.condition === "Malo";
              const isRegular = item.condition === "Regular";
              const isLost = item.condition === "Perdido";

              const accentColor = isBad
                ? C.red
                : isRegular
                  ? C.amber
                  : isLost
                    ? C.gray500
                    : C.green;
              const bgAccent = isBad
                ? "rgba(239, 68, 68, 0.05)"
                : isRegular
                  ? "rgba(245, 158, 11, 0.05)"
                  : isLost
                    ? "rgba(107, 114, 128, 0.08)"
                    : "rgba(16, 185, 129, 0.05)";

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "1rem",
                    border: `1px solid ${isBad ? "rgba(239, 68, 68, 0.3)" : isLost ? C.gray300 : C.gray200}`,
                    borderRadius: RADIUS.lg,
                    backgroundColor: isLost ? C.gray50 : C.white,
                    boxShadow: SHADOWS.sm,
                    position: "relative",
                    overflow: "hidden",
                    opacity: isLost ? 0.8 : 1,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      backgroundColor: C.gray100,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width:
                          isBad || isLost ? "20%" : isRegular ? "60%" : "100%",
                        backgroundColor: accentColor,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginTop: "0.2rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: RADIUS.md,
                          backgroundColor: bgAccent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {getIconForItem(item.name, 20, accentColor)}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontWeight: "800",
                            color: C.navy900,
                            fontSize: "0.95rem",
                            lineHeight: "1.2",
                          }}
                        >
                          {item.name}
                        </p>

                        {perms.canEditInventory ? (
                          <button
                            onClick={() => {
                              setCondItem(item);
                              setCondQty(1);
                              setCondNew(
                                item.condition === "Bueno" ? "Regular" : "Malo",
                              );
                            }}
                            style={{
                              marginTop: "0.3rem",
                              background: bgAccent,
                              border: `1px solid ${accentColor}40`,
                              padding: "2px 8px",
                              borderRadius: RADIUS.full,
                              display: "flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              cursor: "pointer",
                              color: accentColor,
                              fontSize: "0.65rem",
                              fontWeight: "800",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                            title="Cambiar estado o reportar pérdida"
                          >
                            {item.condition} <RefreshCcw size={10} />
                          </button>
                        ) : (
                          <span
                            style={{
                              marginTop: "0.3rem",
                              fontSize: "0.7rem",
                              fontWeight: "800",
                              color: accentColor,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {item.condition}
                          </span>
                        )}
                      </div>
                    </div>

                    {perms.canEditInventory && (
                      <button
                        onClick={async () => {
                          if (
                            window.confirm(
                              `¿Borrar "${item.name}" del inventario?`,
                            )
                          )
                            await deleteDoc(itemRef("inventory", item.id));
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: C.gray400,
                          cursor: "pointer",
                          padding: "0.2rem",
                          transition: "color 0.2s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = C.red)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = C.gray400)
                        }
                        title="Eliminar artículo"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "1rem",
                      paddingTop: "0.75rem",
                      borderTop: `1px solid ${C.gray100}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        color: C.gray500,
                        fontWeight: "600",
                      }}
                    >
                      {isLost ? "Reportados:" : "En existencia:"}
                    </span>

                    {perms.canEditInventory ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: C.gray50,
                          borderRadius: RADIUS.full,
                          border: `1px solid ${C.gray200}`,
                          padding: "0.15rem",
                        }}
                      >
                        <button
                          onClick={() =>
                            handleUpdateQty(item.id, item.quantity, -1)
                          }
                          style={{
                            background: C.white,
                            border: `1px solid ${C.gray200}`,
                            borderRadius: "50%",
                            cursor: "pointer",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: C.gray600,
                            boxShadow: SHADOWS.sm,
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span
                          style={{
                            fontWeight: "800",
                            minWidth: "40px",
                            textAlign: "center",
                            fontSize: "1rem",
                            color: C.navy900,
                            transform:
                              animatingId === item.id
                                ? "scale(1.2)"
                                : "scale(1)",
                            transition: "transform 0.15s ease",
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateQty(item.id, item.quantity, 1)
                          }
                          style={{
                            background: C.white,
                            border: `1px solid ${C.gray200}`,
                            borderRadius: "50%",
                            cursor: "pointer",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: C.gray600,
                            boxShadow: SHADOWS.sm,
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <span
                        style={{
                          fontWeight: "800",
                          fontSize: "1.25rem",
                          color: C.navy900,
                        }}
                      >
                        {item.quantity}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 👇 MODAL PARA DIVIDIR / CAMBIAR ESTADO 👇 */}
      {condItem &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(10,25,41,0.9)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
            onClick={() => setCondItem(null)}
          >
            <div
              style={{
                backgroundColor: C.white,
                padding: "1.5rem",
                borderRadius: RADIUS.xl,
                width: "100%",
                maxWidth: "360px",
                boxShadow: SHADOWS.xl,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: "800",
                    color: C.navy900,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <RefreshCcw size={18} color={C.amber} /> Cambiar Estado
                </h3>
                <button
                  onClick={() => setCondItem(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.gray400,
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <p
                style={{
                  fontSize: "0.85rem",
                  color: C.gray500,
                  marginBottom: "1rem",
                  lineHeight: "1.4",
                }}
              >
                ¿Cuántos <strong>{condItem.name}</strong> cambiarán de estado{" "}
                <strong>{condItem.condition}</strong> a uno nuevo?
              </p>

              <form
                onSubmit={handleConfirmConditionChange}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-end",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        color: C.navy900,
                        display: "block",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Cantidad (Máx: {condItem.quantity})
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: C.gray50,
                        borderRadius: RADIUS.md,
                        border: `1px solid ${C.gray200}`,
                        padding: "0.2rem",
                        height: "42px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setCondQty(Math.max(1, condQty - 1))}
                        disabled={condQty <= 1}
                        style={{
                          background: C.white,
                          border: `1px solid ${C.gray200}`,
                          borderRadius: RADIUS.sm,
                          cursor: condQty <= 1 ? "not-allowed" : "pointer",
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: condQty <= 1 ? C.gray300 : C.gray600,
                          boxShadow: SHADOWS.sm,
                        }}
                      >
                        <Minus size={16} />
                      </button>

                      <span
                        style={{
                          fontWeight: "800",
                          fontSize: "1rem",
                          color: C.navy900,
                        }}
                      >
                        {condQty}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setCondQty(Math.min(condItem.quantity, condQty + 1))
                        }
                        disabled={condQty >= condItem.quantity}
                        style={{
                          background: C.white,
                          border: `1px solid ${C.gray200}`,
                          borderRadius: RADIUS.sm,
                          cursor:
                            condQty >= condItem.quantity
                              ? "not-allowed"
                              : "pointer",
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color:
                            condQty >= condItem.quantity
                              ? C.gray300
                              : C.gray600,
                          boxShadow: SHADOWS.sm,
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        color: C.navy900,
                        display: "block",
                        marginBottom: "0.4rem",
                      }}
                    >
                      Nuevo Estado
                    </label>
                    <FormSelect
                      value={condNew}
                      onChange={(e) => setCondNew(e.target.value)}
                      style={{ width: "100%", height: "42px" }}
                    >
                      {["Bueno", "Regular", "Malo", "Perdido"].map((estado) => (
                        <option
                          key={estado}
                          value={estado}
                          disabled={estado === condItem.condition}
                        >
                          {estado}
                        </option>
                      ))}
                    </FormSelect>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <PrimaryButton type="submit" style={{ flex: 1 }}>
                    Confirmar Cambio
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => setCondItem(null)}
                    style={{ padding: "0 1rem" }}
                  >
                    Cancelar
                  </SecondaryButton>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* 👇 NUEVO: RENDERIZADO DE LA LISTA DE RESUMEN 👇 */}
      {summaryCategory && (
        <InventorySummaryModal
          category={summaryCategory}
          inventory={inventory}
          onClose={() => setSummaryCategory(null)}
        />
      )}
    </div>
  );
}
