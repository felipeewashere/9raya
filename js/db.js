// Tiny Supabase client: calls the SQL functions over REST, no SDK needed.
const DB = (() => {
  const enabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

  async function rpc(fn, args) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify(args),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) { const e = new Error((body && body.message) || 'net_error'); e.code = e.message; throw e; }
    return body;
  }

  return {
    enabled,
    exists: pseudo => rpc('profile_exists', { p_pseudo: pseudo }),
    signup: (pseudo, pin, answers) => rpc('signup', { p_pseudo: pseudo, p_pin: pin, p_answers: answers }),
    login: (pseudo, pin) => rpc('login', { p_pseudo: pseudo, p_pin: pin }),
    save: (pseudo, pin, answers) => rpc('save_answers', { p_pseudo: pseudo, p_pin: pin, p_answers: answers }),
  };
})();
