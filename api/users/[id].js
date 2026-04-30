import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

const USERS_TABLE =
  process.env.VITE_USERS_TABLE || process.env.USERS_TABLE || 'form_submissions';

function json(res, status, body) {
  res.status(status).setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('allow', 'DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const { id } = req.query || {};
  if (!id || typeof id !== 'string') {
    return json(res, 400, { error: 'Missing id' });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(res, 500, {
      error:
        'Server misconfigured: missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await supabaseAdmin
    .from(USERS_TABLE)
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    return json(res, 500, { error: error.message || 'Delete failed' });
  }

  const deletedCount = Array.isArray(data) ? data.length : 0;
  if (deletedCount === 0) {
    return json(res, 404, { error: 'Not found' });
  }

  return json(res, 200, { ok: true, deleted: deletedCount });
}

