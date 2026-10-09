// Pruebas de sesión: un token todavía vigente de una cuenta que ya no existe en auth.users (base vaciada, usuario
// borrado o respaldo restaurado) no debe servir para nada, y un perfil sin cuenta con el mismo correo no debe impedir
// que esa persona vuelva a registrarse. Todo lo que se crea aquí se borra al final.

const FANTASMA = {
  role: "authenticated",
  claims: { sub: "22222222-2222-4222-8222-222222222201", email: "fantasma@demo.local" },
};
const HUERFANO_ID = "22222222-2222-4222-8222-222222222202";
const NUEVO_ID = "22222222-2222-4222-8222-222222222203";
const CORREO = "huerfano@demo.local";

export async function run({ db, rpc, check }) {
  const n = async (sql, params = []) => (await db.query(sql, params)).rows[0].n;

  // ---------- Sesión de una cuenta borrada ----------
  for (const fn of ["my_spaces", "ensure_my_profile", "bootstrap_platform_admin"]) {
    const r = await rpc(FANTASMA, fn, { displayName: "Fantasma", email: FANTASMA.claims.email });
    check(r.error?.code === "42501", `${fn}: sesión de una cuenta que no existe -> 42501`, r.data ?? r.error);
  }
  check((await n("SELECT count(*)::int AS n FROM users WHERE id = $1", [FANTASMA.claims.sub])) === 0
    && (await n("SELECT count(*)::int AS n FROM platform_admins WHERE user_id = $1", [FANTASMA.claims.sub])) === 0,
    "la sesión fantasma no crea perfil ni se vuelve superadmin");
  const usuario = await rpc("usuario", "my_spaces", {});
  check(!usuario.error, "una cuenta que existe sí tiene sesión (usuario sin roles)", usuario.error);

  // ---------- Volver a registrarse con un perfil huérfano del mismo correo ----------
  await db.query("INSERT INTO users (id, email, display_name) VALUES ($1, $2, 'Perfil viejo')", [HUERFANO_ID, CORREO]);
  await db.query("INSERT INTO signup_invites (email_key, email) VALUES (email_key($1), $1)", [CORREO]);
  let alta = null;
  try {
    await db.query("INSERT INTO auth.users (id, aud, role, email) VALUES ($1, 'authenticated', 'authenticated', $2)", [NUEVO_ID, CORREO]);
  } catch (err) {
    alta = err.message;
  }
  check(alta === null
    && (await n("SELECT count(*)::int AS n FROM users WHERE id = $1 AND email = $2", [NUEVO_ID, CORREO])) === 1
    && (await n("SELECT count(*)::int AS n FROM users WHERE id = $1", [HUERFANO_ID])) === 0,
    "registro: el perfil sin cuenta con el mismo correo se quita y la cuenta nueva queda con su perfil", alta);

  // ---------- Limpieza ----------
  await db.query("DELETE FROM auth.users WHERE id = $1", [NUEVO_ID]);
  await db.query("DELETE FROM users WHERE id IN ($1, $2)", [NUEVO_ID, HUERFANO_ID]);
  await db.query("DELETE FROM signup_invites WHERE email = $1", [CORREO]);
}
