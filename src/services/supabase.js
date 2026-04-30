import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUBMISSIONS_TABLE =
  import.meta.env.VITE_SUBMISSIONS_TABLE || 'form_submissions';
export const USERS_TABLE =
  import.meta.env.VITE_USERS_TABLE || SUBMISSIONS_TABLE;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Create a .env.local file based on .env.example.'
  );
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Fetch all form submissions, ordered by most recent first.
 * Throws on error so callers can surface error UI.
 */
export async function fetchSubmissions() {
  const { data, error } = await supabase
    .from(SUBMISSIONS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to load submissions');
  }
  return data || [];
}

/**
 * Fetch user-facing fields from Supabase.
 * Defaults to `form_submissions` so this works with maps_send_grid schema.
 */
export async function fetchUsers() {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select(
      'id, created_at, first_name, last_name, email, organization, title, package_tier, user_type, meeting_room'
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to load users');
  }
  return data || [];
}

export async function fetchUserById(id) {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to load user details');
  }
  return data;
}

export async function updateUser(id, updates) {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to update user');
  }
  return data;
}

export async function deleteUser(id) {
  const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { accept: 'application/json' }
  });

  if (res.ok) return;

  let message = 'Failed to delete user';
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
  } catch {
    // ignore
  }
  throw new Error(message);
}
