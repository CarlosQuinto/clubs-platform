import { type ReactNode } from "react";
import { Calendar, Check, ChevronRight, Clock, MapPin, Timer, Trophy, Users } from "lucide-react";
import courtDefault from "../../assets/court-default.jpg";
import rentBg from "../../assets/rent-bg.jpg";
import PlatformLayout from "../shell/PlatformLayout";
import { useAuth } from "../../domains/auth/AuthContext";
import { FormInput, FormSelect } from "../../shared/ui";
import { useCourtsPage } from "./useCourtsPage";
import type { CourtCardView } from "./courtsViewState";

export default function CourtsPageView() {
  const { isSuperAdmin: warnMissingWhatsapp } = useAuth();
  const screen = useCourtsPage();
  const view = screen.view;

  let body: ReactNode;
  if (screen.error && !view) {
    body = (
      <p className="rent-empty">
        {screen.error}{" "}
        <button type="button" onClick={screen.onRefresh} className="rent-empty">
          Reintentar
        </button>
      </p>
    );
  } else if (!view) {
    body = <p className="rent-empty">Cargando canchas…</p>;
  } else if (view.availability === "disabled") {
    body = <p className="rent-empty">El apartado de canchas no está disponible.</p>;
  } else if (view.availability === "no-hours") {
    body = <p className="rent-empty">El horario de apertura aún no está definido.</p>;
  } else if (view.availability === "no-courts") {
    body = <p className="rent-empty">Aún no hay canchas publicadas.</p>;
  } else {
    body = (
      <>
        {warnMissingWhatsapp && view.whatsappMissing ? (
          <p className="rent-warn">Falta el WhatsApp de la portada para que la gente pueda apartar.</p>
        ) : null}
        <section className="rent-block">
          <BlockTitle icon={<MapPin size={18} />} title="Canchas" hint="Selecciona la cancha que deseas rentar" />
          <div className="rent-courts">
            {view.courts.map((court) => (
              <CourtButton key={court.id} court={court} onSelect={screen.onSelectCourt} />
            ))}
          </div>
        </section>
        <section className="rent-block">
          <BlockTitle icon={<Calendar size={18} />} title="Día" hint="Selecciona la fecha de tu reserva" />
          <label className="rent-date">
            <FormInput
              type="date"
              value={view.date}
              aria-label="Día"
              onChange={(event) => screen.onDate(event.target.value)}
              style={{ borderRadius: 12, minHeight: 48, paddingRight: "2.6rem" }}
            />
            <Calendar size={18} className="rent-date__icon" aria-hidden="true" />
          </label>
        </section>
        <section className="rent-block">
          <BlockTitle icon={<Clock size={18} />} title="Horario" hint="Elige el horario disponible" />
          {view.dayClosed ? (
            <p className="rent-empty">Este día la cancha está cerrada.</p>
          ) : view.fullyBooked ? (
            <p className="rent-empty">No hay horarios libres este día.</p>
          ) : (
            <div className="rent-slots">
              {view.slots.map((slot) => (
                <button
                  key={slot.minutes}
                  type="button"
                  className={slot.selected ? "rent-slot is-on" : "rent-slot"}
                  aria-pressed={slot.selected}
                  onClick={() => screen.onStart(slot.minutes)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="rent-block">
          <BlockTitle icon={<Timer size={18} />} title="Duración" hint="Selecciona el tiempo de tu partida" />
          <FormSelect
            className="rent-duration"
            aria-label="Duración"
            disabled={view.durations.length === 0}
            value={view.duration}
            onChange={(event) => screen.onDuration(Number(event.target.value))}
            style={{ borderRadius: 12, minHeight: 48 }}
          >
            {view.durations.length === 0 ? (
              <option value="">Elige un horario</option>
            ) : (
              view.durations.map((option) => (
                <option key={option.minutes} value={option.minutes}>
                  {option.label}
                </option>
              ))
            )}
          </FormSelect>
        </section>
        {view.summary ? (
          <div className="rent-summary">
            <div className="rent-summary__main">
              <img className="rent-summary__photo" src={view.summary.imageUrl || courtDefault} alt="" />
              <div className="rent-summary__copy">
                <strong>{view.summary.name}</strong>
                <span>{view.summary.dateLabel}</span>
                <span>{view.summary.rangeLabel}</span>
                <span className="rent-summary__price">{view.summary.priceLabel}</span>
              </div>
            </div>
            {view.summary.whatsappHref ? (
              <a className="rent-wa" href={view.summary.whatsappHref} target="_blank" rel="noreferrer">
                <WhatsAppGlyph />
                Apartar por WhatsApp
                <ChevronRight size={16} />
              </a>
            ) : (
              <span className="rent-summary__note">El WhatsApp de apartado aún no está publicado.</span>
            )}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <PlatformLayout flush>
      <div className="rent-stage" style={{ backgroundImage: `url(${rentBg})` }}>
        <div className="rent-layout">
          <aside className="rent-intro">
            <h1>
              Reserva
              <em>tu cancha</em>
            </h1>
            <p>Vive la pasión del deporte. Elige tu horario y reserva tu lugar.</p>
            <ul className="rent-perks">
              <li>
                <span className="rent-perk__icon" aria-hidden="true">
                  <Calendar size={18} />
                </span>
                <span>
                  <strong>Rápido</strong>
                  <span>Reserva en minutos</span>
                </span>
              </li>
              <li>
                <span className="rent-perk__icon" aria-hidden="true">
                  <Users size={18} />
                </span>
                <span>
                  <strong>Fácil</strong>
                  <span>Desde cualquier dispositivo</span>
                </span>
              </li>
              <li>
                <span className="rent-perk__icon" aria-hidden="true">
                  <Trophy size={18} />
                </span>
                <span>
                  <strong>Seguro</strong>
                  <span>Tu reserva confirmada</span>
                </span>
              </li>
            </ul>
          </aside>
          <div className="rent-card">{body}</div>
        </div>
      </div>
    </PlatformLayout>
  );
}

function CourtButton({
  court,
  onSelect,
}: {
  court: CourtCardView;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={court.selected ? "rent-court is-on" : "rent-court"}
      aria-pressed={court.selected}
      onClick={() => onSelect(court.id)}
    >
      <img src={court.imageUrl || courtDefault} alt="" />
      <span className="rent-court__copy">
        <strong>{court.name}</strong>
        {court.location ? (
          <span className="rent-court__place">
            <MapPin size={11} aria-hidden="true" />
            {court.location}
          </span>
        ) : null}
        {court.description ? <span className="rent-court__desc">{court.description}</span> : null}
        <span className="rent-court__price">{court.priceLabel}</span>
      </span>
      {court.selected ? (
        <span className="rent-court__check" aria-hidden="true">
          <Check size={12} strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}

function BlockTitle({ icon, title, hint }: { icon: ReactNode; title: string; hint: string }) {
  return (
    <div className="rent-head">
      <span className="rent-head__icon">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{hint}</p>
      </div>
    </div>
  );
}

function WhatsAppGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.3-1.1A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.1.8.8-3-.2-.3A9 9 0 1 1 12 21zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.4.2-.4a.5.5 0 0 0 0-.4c0-.1-.6-1.5-.8-2s-.4-.5-.6-.5h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.4 11.4 0 0 0 4.4 3.9c.6.2 1.1.4 1.5.5a3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c-.1-.2-.3-.2-.6-.3z"
      />
    </svg>
  );
}
