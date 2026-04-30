/**
 * Helpers for parsing, formatting, sorting, and filtering submissions.
 */

/**
 * Safely parse the `payload` JSON string into an object.
 * Returns the original value if it's already an object, or null on failure.
 */
export function parsePayload(payload) {
  if (!payload) return null;
  if (typeof payload === 'object') return payload;
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Compose the full name; falls back gracefully when fields are missing.
 */
export function fullName(row) {
  const first = (row?.first_name || '').trim();
  const last = (row?.last_name || '').trim();
  const composed = `${first} ${last}`.trim();
  return composed || '—';
}

/**
 * Format an ISO timestamp into a readable string.
 * Example: "12 Mar 2026 · 14:32"
 */
export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const time = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return `${date} · ${time}`;
}

/**
 * Compare two values robustly across strings, numbers, and dates.
 */
export function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === 'number' && typeof b === 'number') return a - b;

  // Try date comparison
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (!Number.isNaN(da) && !Number.isNaN(db) && /\d{4}-\d{2}-\d{2}/.test(String(a))) {
    return da - db;
  }

  return String(a).localeCompare(String(b), undefined, {
    sensitivity: 'base',
    numeric: true
  });
}

/**
 * Apply search + filters + sort to a list of submissions.
 */
export function processSubmissions(rows, { search, filters, sort }) {
  if (!Array.isArray(rows)) return [];
  let out = rows;

  // Filters
  if (filters?.package_tier) {
    out = out.filter(
      (r) =>
        (r.package_tier || '').toLowerCase() ===
        filters.package_tier.toLowerCase()
    );
  }
  if (filters?.user_type) {
    out = out.filter(
      (r) =>
        (r.user_type || '').toLowerCase() === filters.user_type.toLowerCase()
    );
  }
  if (filters?.meeting_room) {
    out = out.filter(
      (r) =>
        (r.meeting_room || '').toLowerCase() ===
        filters.meeting_room.toLowerCase()
    );
  }

  // Search across name, email, organization, package_tier
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter((r) => {
      const haystack = [
        r.first_name,
        r.last_name,
        `${r.first_name || ''} ${r.last_name || ''}`,
        r.email,
        r.organization,
        r.package_tier
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  // Sort
  if (sort?.key) {
    const dir = sort.direction === 'desc' ? -1 : 1;
    out = [...out].sort((a, b) => {
      let av;
      let bv;
      if (sort.key === 'name') {
        av = `${a.first_name || ''} ${a.last_name || ''}`.trim();
        bv = `${b.first_name || ''} ${b.last_name || ''}`.trim();
      } else {
        av = a[sort.key];
        bv = b[sort.key];
      }
      return compareValues(av, bv) * dir;
    });
  }

  return out;
}

/**
 * Build distinct option lists for filter dropdowns.
 */
export function buildFilterOptions(rows) {
  const tiers = new Set();
  const users = new Set();
  const rooms = new Set();
  for (const r of rows || []) {
    if (r.package_tier) tiers.add(r.package_tier);
    if (r.user_type) users.add(r.user_type);
    if (r.meeting_room) rooms.add(r.meeting_room);
  }
  return {
    package_tier: Array.from(tiers).sort(),
    user_type: Array.from(users).sort(),
    meeting_room: Array.from(rooms).sort()
  };
}
