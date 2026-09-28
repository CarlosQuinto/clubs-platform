import { useMemo } from "react";
import { C, RADIUS, SHADOWS } from "../ui";
import { isBirthdayToday } from "../../utils/helpers";

interface BirthdayBannerProps {
  players: any[];
}

export default function BirthdayBanner({ players }: BirthdayBannerProps) {
  const todaysBirthdays = useMemo(
    () => players.filter((p: any) => isBirthdayToday(p.birthDate)),
    [players],
  );

  const birthdayMessage = useMemo(() => {
    if (todaysBirthdays.length === 0) return "";
    if (todaysBirthdays.length === 1)
      return `Hoy celebramos el cumpleaños de ${todaysBirthdays[0].name}. ¡Felicidades, crack! 🎂`;
    if (todaysBirthdays.length === 2)
      return `Hoy celebramos los cumpleaños de ${todaysBirthdays[0].name} y ${todaysBirthdays[1].name}. ¡Muchas felicidades, cracks! 🎂`;
    return `Hoy celebramos a ${todaysBirthdays
      .slice(0, -1)
      .map((p: any) => p.name)
      .join(
        ", ",
      )} y ${todaysBirthdays[todaysBirthdays.length - 1].name}. ¡Un abrazo! 🎂`;
  }, [todaysBirthdays]);

  if (todaysBirthdays.length === 0) return null;

  return (
    <div
      style={{
        background: "linear-gradient(270deg, #f59e0b, #fbbf24, #f59e0b)",
        color: C.white,
        padding: "1.25rem",
        borderRadius: RADIUS.lg,
        boxShadow: SHADOWS.md,
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <span style={{ fontSize: "2rem" }}>🎉</span>
      <div>
        <h3
          style={{
            margin: "0 0 0.25rem 0",
            fontSize: "1.125rem",
            fontWeight: "800",
          }}
        >
          ¡Día de Fiesta!
        </h3>
        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: "600" }}>
          {birthdayMessage}
        </p>
      </div>
    </div>
  );
}
