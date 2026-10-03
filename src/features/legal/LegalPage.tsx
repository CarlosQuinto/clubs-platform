import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import PlatformLayout, {
  markScrollTopAfterNav,
} from "../shell/PlatformLayout";
import { usePlatformChrome } from "../shell/usePlatformChrome";

const UPDATED = "1 de octubre de 2026";

function useBrandName() {
  return usePlatformChrome(true).brandName;
}

function LegalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const brandName = useBrandName();
  return (
    <PlatformLayout maxWidth="40rem">
      <article className="legal-page">
        <h1>{title}</h1>
        <p className="legal-page__meta">
          {brandName}. Actualizado el {UPDATED}.
        </p>
        {children}
      </article>
    </PlatformLayout>
  );
}

export function TermsPage() {
  const brandName = useBrandName();
  return (
    <LegalShell title="Términos de uso">
      <p>
        Estos términos aplican al uso de {brandName}: el sitio donde se
        consultan torneos, partidos, tablas, el directorio de equipos y, cuando
        está activo, la disponibilidad de canchas.
      </p>
      <h2>Qué publica el sitio</h2>
      <p>
        La información deportiva la cargan los administradores. Los resultados,
        posiciones y estadísticas se muestran tal como quedan registrados. El
        sitio es una fuente de consulta; no sustituye un aviso oficial que la
        organización haga por otro medio.
      </p>
      <h2>Registro de equipos</h2>
      <p>
        El formulario de registro envía una solicitud. No inscribe al equipo por
        sí solo. La organización revisa la petición y avisa si se aprueba.
      </p>
      <h2>Canchas</h2>
      <p>
        Si la renta de cancha está disponible, el horario que se ve es
        informativo. Apartar abre una conversación de WhatsApp y queda sujeto a
        confirmación. Elegir un horario en el sitio no reserva la cancha.
      </p>
      <h2>Cuentas</h2>
      <p>
        Las cuentas de administración se crean por invitación. Quien recibe
        acceso se compromete a usarlo solo para operar la plataforma y a no
        compartir la contraseña.
      </p>
      <h2>Uso del contenido publicado</h2>
      <p>
        Nombres de jugadores, teléfonos de presidentes, logos y demás datos que
        aparecen en el directorio o en los partidos están para consultar la
        actividad deportiva. No se usan para enviar publicidad no pedida ni
        para copiar el directorio de forma masiva.
      </p>
      <h2>Propiedad</h2>
      <p>
        Los textos, el diseño, los logos y las marcas del sitio pertenecen a{" "}
        {brandName} o a los clubes que los aportan. Hace falta autorización
        para reutilizarlos fuera de la consulta normal del sitio.
      </p>
      <h2>Disponibilidad</h2>
      <p>
        El sitio se ofrece tal como está, para informar sobre la actividad
        deportiva. Puede haber interrupciones, correcciones o cambios de
        contenido. Los administradores pueden retirar publicaciones que no
        correspondan.
      </p>
      <h2>Cambios</h2>
      <p>
        Estos términos pueden actualizarse. La fecha de arriba indica la última
        versión publicada. El uso del sitio después de un cambio implica que se
        acepta la versión vigente.
      </p>
      <p>
        Dudas sobre estos términos:{" "}
        <Link to="/contacto#formulario">Contacto</Link>. Consulta también el{" "}
        <Link to="/aviso-de-privacidad" onClick={markScrollTopAfterNav}>
          aviso de privacidad
        </Link>
        .
      </p>
    </LegalShell>
  );
}

export function PrivacyPage() {
  const brandName = useBrandName();
  return (
    <LegalShell title="Aviso de privacidad">
      <p>
        {brandName} es responsable del tratamiento de los datos personales que
        se recogen en este sitio. No publicamos un domicilio postal distinto del
        canal de contacto: las solicitudes se atienden en{" "}
        <Link to="/contacto#formulario">Contacto</Link>.
      </p>
      <h2>Datos que pedimos</h2>
      <p>Según el formulario o la cuenta:</p>
      <ul>
        <li>
          Contacto: nombre, teléfono, correo, tema y mensaje.
        </li>
        <li>
          Registro de equipo: nombre, correo y teléfono de quien representa al
          equipo, y el nombre del equipo.
        </li>
        <li>
          Cuentas de administración, solo por invitación: nombre, correo y
          contraseña. La contraseña la gestiona el inicio de sesión; no se
          muestra en el sitio.
        </li>
      </ul>
      <h2>Datos que se publican</h2>
      <p>
        El directorio puede mostrar el nombre del club, la localidad, el logo y
        el teléfono del presidente si quien administra el club lo dejó
        publicado. En los partidos pueden aparecer nombres de jugadores ligados
        a goles, asistencias y tarjetas.
      </p>
      <h2>Canchas</h2>
      <p>
        La renta de cancha no guarda un formulario en el sitio. Si apartas un
        horario, el mensaje se abre en WhatsApp y esa conversación sigue las
        condiciones de ese servicio.
      </p>
      <h2>Para qué se usan</h2>
      <p>
        Para responder solicitudes, revisar el registro de un equipo, operar
        las cuentas de administración y mostrar la información deportiva del
        sitio. No vendemos estos datos ni los usamos para publicidad de
        terceros.
      </p>
      <h2>Dónde se guardan</h2>
      <p>
        El sitio y su base de datos están hospedados en Firebase, un servicio
        de Google. Eso incluye los mensajes de contacto, las solicitudes de
        equipo y las cuentas de administración.
      </p>
      <h2>Consentimiento</h2>
      <p>
        Los formularios de contacto y de registro piden aceptar este aviso
        antes de enviar. Sin esa casilla, la solicitud no se manda.
      </p>
      <h2>Acceso, corrección y baja</h2>
      <p>
        Puedes pedir ver, corregir o dar de baja los datos que enviaste por un
        formulario. Escríbenos en{" "}
        <Link to="/contacto#formulario">Contacto</Link> con el
        mismo correo o teléfono que usaste, e indica qué quieres que hagamos.
      </p>
      <h2>Cambios</h2>
      <p>
        Si este aviso cambia, se publica aquí con una nueva fecha. La versión
        vigente es la del {UPDATED}.
      </p>
      <p>
        Consulta también los{" "}
        <Link to="/terminos" onClick={markScrollTopAfterNav}>
          términos de uso
        </Link>
        .
      </p>
    </LegalShell>
  );
}
