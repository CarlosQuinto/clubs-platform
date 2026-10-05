/** Formaciones de la pizarra táctica por modalidad. Las coordenadas (top/left en %) son las
 * de la cancha vertical con la portería propia abajo; las comparten la pizarra del club
 * y la página pública del partido. */
export const FORMATIONS: Record<
  string,
  Record<
    string,
    { desc: string; nodes: { id: string; top: string; left: string }[] }
  >
> = {
  "Fut-11": {
    "4-4-2": {
      desc: "El clásico por excelencia. Muy equilibrado, ofrece dos líneas de cuatro sólidas y dos delanteros.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "15%" },
        { id: "df2", top: "75%", left: "38%" },
        { id: "df3", top: "75%", left: "62%" },
        { id: "df4", top: "75%", left: "85%" },
        { id: "md1", top: "50%", left: "15%" },
        { id: "md2", top: "50%", left: "38%" },
        { id: "md3", top: "50%", left: "62%" },
        { id: "md4", top: "50%", left: "85%" },
        { id: "fw1", top: "25%", left: "35%" },
        { id: "fw2", top: "25%", left: "65%" },
      ],
    },
    "4-3-3": {
      desc: "Orientado al ataque. Excelente para dominar la posesión en el mediocampo y atacar con extremos abiertos.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "15%" },
        { id: "df2", top: "75%", left: "38%" },
        { id: "df3", top: "75%", left: "62%" },
        { id: "df4", top: "75%", left: "85%" },
        { id: "md1", top: "50%", left: "25%" },
        { id: "md2", top: "50%", left: "50%" },
        { id: "md3", top: "50%", left: "75%" },
        { id: "fw1", top: "22%", left: "20%" },
        { id: "fw2", top: "22%", left: "50%" },
        { id: "fw3", top: "22%", left: "80%" },
      ],
    },
    "4-2-3-1": {
      desc: "Moderno y flexible. Utiliza un doble pivote defensivo con un mediapunta creativo jugando libre detrás del único delantero.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "15%" },
        { id: "df2", top: "75%", left: "38%" },
        { id: "df3", top: "75%", left: "62%" },
        { id: "df4", top: "75%", left: "85%" },
        { id: "cdm1", top: "60%", left: "35%" },
        { id: "cdm2", top: "60%", left: "65%" },
        { id: "cam1", top: "40%", left: "20%" },
        { id: "cam2", top: "40%", left: "50%" },
        { id: "cam3", top: "40%", left: "80%" },
        { id: "fw1", top: "20%", left: "50%" },
      ],
    },
    "3-5-2": {
      desc: "Control total del centro del campo. Requiere carrileros por las bandas con una enorme resistencia física para atacar y defender.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "20%" },
        { id: "df2", top: "75%", left: "50%" },
        { id: "df3", top: "75%", left: "80%" },
        { id: "md1", top: "50%", left: "15%" },
        { id: "md2", top: "55%", left: "35%" },
        { id: "md3", top: "40%", left: "50%" },
        { id: "md4", top: "55%", left: "65%" },
        { id: "md5", top: "50%", left: "85%" },
        { id: "fw1", top: "25%", left: "35%" },
        { id: "fw2", top: "25%", left: "65%" },
      ],
    },
    "5-3-2": {
      desc: "Enfoque defensivo. Cierra espacios atrás con tres centrales y dos laterales, buscando ofender mediante el contragolpe rápido.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "10%" },
        { id: "df2", top: "75%", left: "30%" },
        { id: "df3", top: "75%", left: "50%" },
        { id: "df4", top: "75%", left: "70%" },
        { id: "df5", top: "75%", left: "90%" },
        { id: "md1", top: "50%", left: "25%" },
        { id: "md2", top: "50%", left: "50%" },
        { id: "md3", top: "50%", left: "75%" },
        { id: "fw1", top: "25%", left: "35%" },
        { id: "fw2", top: "25%", left: "65%" },
      ],
    },
  },
  "Fut-9": {
    "3-3-2": {
      desc: "Muy balanceado. Tres defensas, tres medios y dos puntas para asegurar transiciones estructuradas.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "20%" },
        { id: "df2", top: "75%", left: "50%" },
        { id: "df3", top: "75%", left: "80%" },
        { id: "md1", top: "50%", left: "20%" },
        { id: "md2", top: "50%", left: "50%" },
        { id: "md3", top: "50%", left: "80%" },
        { id: "fw1", top: "25%", left: "35%" },
        { id: "fw2", top: "25%", left: "65%" },
      ],
    },
    "3-2-3": {
      desc: "Agresivo al frente. Deja solo dos medios, pero ejerce mucha presión alta con tres atacantes.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "20%" },
        { id: "df2", top: "75%", left: "50%" },
        { id: "df3", top: "75%", left: "80%" },
        { id: "md1", top: "55%", left: "35%" },
        { id: "md2", top: "55%", left: "65%" },
        { id: "fw1", top: "25%", left: "20%" },
        { id: "fw2", top: "25%", left: "50%" },
        { id: "fw3", top: "25%", left: "80%" },
      ],
    },
    "2-4-2": {
      desc: "Dominio de la posesión. Los cuatro mediocampistas acaparan el centro del campo y generan superioridad numérica.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "35%" },
        { id: "df2", top: "75%", left: "65%" },
        { id: "md1", top: "50%", left: "15%" },
        { id: "md2", top: "50%", left: "38%" },
        { id: "md3", top: "50%", left: "62%" },
        { id: "md4", top: "50%", left: "85%" },
        { id: "fw1", top: "25%", left: "35%" },
        { id: "fw2", top: "25%", left: "65%" },
      ],
    },
    "2-3-3": {
      desc: "Ultra ofensivo. Ideal si el rival se encierra mucho, pero requiere defensas muy rápidos al quedar expuestos.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "35%" },
        { id: "df2", top: "75%", left: "65%" },
        { id: "md1", top: "50%", left: "25%" },
        { id: "md2", top: "50%", left: "50%" },
        { id: "md3", top: "50%", left: "75%" },
        { id: "fw1", top: "25%", left: "20%" },
        { id: "fw2", top: "25%", left: "50%" },
        { id: "fw3", top: "25%", left: "80%" },
      ],
    },
    "3-4-1": {
      desc: "Control y solidez. Se defiende en bloque con líneas muy juntas y se busca a un solo delantero referente (poste) para desahogar.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "20%" },
        { id: "df2", top: "75%", left: "50%" },
        { id: "df3", top: "75%", left: "80%" },
        { id: "md1", top: "50%", left: "15%" },
        { id: "md2", top: "50%", left: "38%" },
        { id: "md3", top: "50%", left: "62%" },
        { id: "md4", top: "50%", left: "85%" },
        { id: "fw1", top: "22%", left: "50%" },
      ],
    },
  },
  "Fut-7": {
    "2-3-1": {
      desc: "El más popular. Forma un rombo en el medio que da mucho apoyo tanto a los defensas como al delantero.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "30%" },
        { id: "df2", top: "75%", left: "70%" },
        { id: "md1", top: "48%", left: "20%" },
        { id: "md2", top: "48%", left: "50%" },
        { id: "md3", top: "48%", left: "80%" },
        { id: "fw1", top: "22%", left: "50%" },
      ],
    },
    "3-2-1": {
      desc: 'Muy conservador (el "árbol"). Cierra la puerta atrás, ideal para proteger un resultado o jugar al contraataque.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "20%" },
        { id: "df2", top: "75%", left: "50%" },
        { id: "df3", top: "75%", left: "80%" },
        { id: "md1", top: "48%", left: "35%" },
        { id: "md2", top: "48%", left: "65%" },
        { id: "fw1", top: "22%", left: "50%" },
      ],
    },
    "2-1-3": {
      desc: "Altamente ofensivo. Un solo medio de contención (muy exigedido) y tres delanteros asfixiando la salida rival.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "30%" },
        { id: "df2", top: "75%", left: "70%" },
        { id: "cdm1", top: "55%", left: "50%" },
        { id: "fw1", top: "25%", left: "20%" },
        { id: "fw2", top: "25%", left: "50%" },
        { id: "fw3", top: "25%", left: "80%" },
      ],
    },
    "2-2-2": {
      desc: 'El "cuadrado". Distribuye a los jugadores en parejas, es fácil de entender y ayuda a no perder el orden.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "30%" },
        { id: "df2", top: "75%", left: "70%" },
        { id: "md1", top: "50%", left: "30%" },
        { id: "md2", top: "50%", left: "70%" },
        { id: "fw1", top: "25%", left: "30%" },
        { id: "fw2", top: "25%", left: "70%" },
      ],
    },
    "1-3-2": {
      desc: "Riesgoso atrás, pero con mucho volumen de ataque. Requiere un líbero rápido y con excelente lectura de juego.",
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "50%" },
        { id: "md1", top: "50%", left: "20%" },
        { id: "md2", top: "50%", left: "50%" },
        { id: "md3", top: "50%", left: "80%" },
        { id: "fw1", top: "25%", left: "35%" },
        { id: "fw2", top: "25%", left: "65%" },
      ],
    },
  },
  "Fut-5": {
    "2-2": {
      desc: 'El "cuadrado". Dos defienden y dos atacan, la forma más sencilla y directa de estructurar al equipo en espacios reducidos.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "65%", left: "30%" },
        { id: "df2", top: "65%", left: "70%" },
        { id: "fw1", top: "30%", left: "30%" },
        { id: "fw2", top: "30%", left: "70%" },
      ],
    },
    "1-2-1": {
      desc: 'El "rombo". Un cierre, dos alas y un pívot. Es el sistema más dinámico y versátil del futsal.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "70%", left: "50%" },
        { id: "md1", top: "45%", left: "25%" },
        { id: "md2", top: "45%", left: "75%" },
        { id: "fw1", top: "20%", left: "50%" },
      ],
    },
    "3-1": {
      desc: 'El "cerrojo" o la pirámide. Tres atrás y un atacante aislado. Perfecto para aguantar marcadores y obligar a disparos lejanos.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "65%", left: "20%" },
        { id: "df2", top: "65%", left: "50%" },
        { id: "df3", top: "65%", left: "80%" },
        { id: "fw1", top: "25%", left: "50%" },
      ],
    },
    "1-1-2": {
      desc: 'La "Y". Un defensa, un medio creador y dois atacantes. Se usa mucho como recurso de emergencia si necesitas goles rápidos.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "75%", left: "50%" },
        { id: "md1", top: "50%", left: "50%" },
        { id: "fw1", top: "25%", left: "30%" },
        { id: "fw2", top: "25%", left: "70%" },
      ],
    },
    "2-1-1": {
      desc: 'La "Y" invertida. Dos defensas, un medio y un punta. Da solidez defensiva con un mediocampista que sirve de bisagra.',
      nodes: [
        { id: "gk", top: "92%", left: "50%" },
        { id: "df1", top: "70%", left: "30%" },
        { id: "df2", top: "70%", left: "70%" },
        { id: "md1", top: "48%", left: "50%" },
        { id: "fw1", top: "25%", left: "50%" },
      ],
    },
  },
};

export type FormationNode = { id: string; top: string; left: string };

/** Posiciones de una formación guardada; null si la modalidad o la formación no existen. */
export function formationNodes(mode: unknown, formation: unknown): FormationNode[] | null {
  if (typeof mode !== "string" || typeof formation !== "string") return null;
  return FORMATIONS[mode]?.[formation]?.nodes ?? null;
}
