import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Wallet, X } from "lucide-react";
import {
  C,
  RADIUS,
  SHADOWS,
  FormInput,
  PrimaryButton,
} from "../../components/ui";
import { getPlayerName } from "../../utils/helpers";

interface ArbitrationModalProps {
  ev: any;
  players: any[];
  canEditArbitration: boolean;
  onClose: () => void;
  onSave: (cleanPayments: any[]) => void;
}

export default function ArbitrationModal({
  ev,
  players,
  canEditArbitration,
  onClose,
  onSave,
}: ArbitrationModalProps) {
  const [arbitrationPayments, setArbitrationPayments] = useState<
    { playerId: string; amount: number }[]
  >([]);

  // Inicializar estado
  useEffect(() => {
    if (ev) {
      const normalizeAttendeeId = (att: string) => {
        const p = players.find((pl: any) => pl.name === att || pl.id === att);
        return p ? p.id : att.startsWith("guest-") ? att : `guest-${att}`;
      };
      const initial = (ev.arbitrationPayments || []).map((p: any) => ({
        playerId: normalizeAttendeeId(p.playerId),
        amount: Number(p.amount) || 0,
      }));
      setArbitrationPayments(initial);
    }
  }, [ev, players]);

  // 👇 NUEVO: BLOQUEAR SCROLL Y ESCUCHAR TECLA "ESC" 👇
  useEffect(() => {
    // 1. Bloqueamos el scroll del fondo
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 2. Creamos la función que escucha el teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose(); // Si es ESC, cerramos el modal
      }
    };

    // 3. Le decimos al navegador que empiece a escuchar
    window.addEventListener("keydown", handleKeyDown);

    // 4. Limpieza (Cleanup) cuando el modal se cierra
    return () => {
      document.body.style.overflow = originalOverflow; // Devolvemos el scroll
      window.removeEventListener("keydown", handleKeyDown); // Dejamos de escuchar el teclado
    };
  }, [onClose]);
  // 👆 ======================================================= 👆

  const updatePayment = (playerId: string, amount: number) => {
    setArbitrationPayments((prev) => {
      const exists = prev.find((p) => p.playerId === playerId);
      if (exists) {
        return prev.map((p) =>
          p.playerId === playerId ? { ...p, amount } : p,
        );
      }
      return [...prev, { playerId, amount }];
    });
  };

  const handleSave = () => {
    const cleanPayments = arbitrationPayments.filter(
      (p) => p.playerId && p.amount > 0,
    );
    onSave(cleanPayments);
  };

  if (!ev) return null;

  const totalPaid = arbitrationPayments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0,
  );

  const normalizeAttendeeId = (att: string) => {
    const p = players.find((pl: any) => pl.name === att || pl.id === att);
    return p ? p.id : att.startsWith("guest-") ? att : `guest-${att}`;
  };

  const attendeesIds = (ev.attendees || []).map((att: string) =>
    normalizeAttendeeId(att),
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.white,
          borderRadius: RADIUS.xl,
          padding: "2rem",
          width: "100%",
          maxWidth: "400px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: SHADOWS.xl,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "700",
              color: C.navy900,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Wallet size={20} color={C.amber} /> Pagos Arbitraje
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: C.gray400,
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p
          style={{
            fontSize: "0.8125rem",
            color: C.gray500,
            marginBottom: "1.5rem",
          }}
        >
          {canEditArbitration
            ? "Asigna el monto que cada asistente aportó para el arbitraje."
            : "Estos son los pagos registrados para el arbitraje."}
        </p>

        {attendeesIds.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: C.gray400,
              fontStyle: "italic",
              padding: "1rem 0",
            }}
          >
            No hay asistentes confirmados. Primero gestiona la asistencia.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              marginBottom: "1.5rem",
            }}
          >
            {attendeesIds.map((id: string) => {
              const payment = arbitrationPayments.find(
                (p) => p.playerId === id,
              );
              const amount = payment ? payment.amount : 0;
              return (
                <div
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem",
                    backgroundColor: C.gray50,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${C.gray200}`,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontWeight: "600",
                      color: C.navy900,
                      fontSize: "0.875rem",
                    }}
                  >
                    {getPlayerName(id, players)}
                  </span>
                  {canEditArbitration ? (
                    <div style={{ position: "relative", width: "80px" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: C.gray500,
                          fontWeight: "600",
                          fontSize: "0.75rem",
                        }}
                      >
                        $
                      </span>
                      <FormInput
                        type="number"
                        min="0"
                        value={amount}
                        onChange={(e) =>
                          updatePayment(id, Number(e.target.value) || 0)
                        }
                        placeholder="0"
                        style={{
                          paddingLeft: "20px",
                          textAlign: "right",
                          width: "100%",
                        }}
                      />
                    </div>
                  ) : (
                    <span
                      style={{
                        fontWeight: "700",
                        color: amount > 0 ? C.green : C.gray400,
                        fontSize: "0.875rem",
                      }}
                    >
                      {amount > 0 ? `$${amount}` : "Sin pago"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            backgroundColor: C.amberLight,
            padding: "0.75rem",
            borderRadius: RADIUS.md,
            border: `1px solid ${C.amber}40`,
          }}
        >
          <span
            style={{
              fontWeight: "700",
              color: C.navy900,
              fontSize: "0.875rem",
            }}
          >
            Total recaudado:
          </span>
          <span
            style={{ fontWeight: "800", color: C.amber, fontSize: "1.125rem" }}
          >
            ${totalPaid}
          </span>
        </div>

        {canEditArbitration ? (
          <PrimaryButton onClick={handleSave} style={{ width: "100%" }}>
            Guardar Pagos
          </PrimaryButton>
        ) : (
          <p
            style={{
              textAlign: "center",
              color: C.gray400,
              fontSize: "0.75rem",
              fontStyle: "italic",
            }}
          >
            No tienes permisos para editar los pagos.
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
