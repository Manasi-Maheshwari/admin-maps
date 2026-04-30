import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce.js';
import { useUsers } from '../hooks/useUsers.js';
import { deleteUser } from '../services/supabase.js';
import { compareValues, formatDate, fullName } from '../utils/data.js';
import Spinner from './Spinner.jsx';
import './SubmissionsTable.css';

export default function UsersTable() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useUsers();
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);
  const [filters, setFilters] = useState({
    user_type: '',
    package_tier: '',
    organization: ''
  });
  const [sort, setSort] = useState({ key: 'created_at', direction: 'desc' });
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const users = useMemo(() => data || [], [data]);
  const filterOptions = useMemo(() => {
    const userTypes = new Set();
    const packageTiers = new Set();
    const organizations = new Set();
    for (const user of users) {
      if (user.user_type) userTypes.add(user.user_type);
      if (user.package_tier) packageTiers.add(user.package_tier);
      if (user.organization) organizations.add(user.organization);
    }
    return {
      user_type: Array.from(userTypes).sort((a, b) => a.localeCompare(b)),
      package_tier: Array.from(packageTiers).sort((a, b) => a.localeCompare(b)),
      organization: Array.from(organizations).sort((a, b) => a.localeCompare(b))
    };
  }, [users]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filteredUsers = users.filter((u) => {
      const passesType =
        !filters.user_type ||
        (u.user_type || '').toLowerCase() === filters.user_type.toLowerCase();
      const passesPackage =
        !filters.package_tier ||
        (u.package_tier || '').toLowerCase() === filters.package_tier.toLowerCase();
      const passesOrg =
        !filters.organization ||
        (u.organization || '').toLowerCase() === filters.organization.toLowerCase();
      if (!passesType || !passesPackage || !passesOrg) return false;
      if (!q) return true;
      return [u.first_name, u.last_name, u.email, u.organization, u.user_type, u.package_tier, u.title]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
    if (!sort.key) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      let av = a[sort.key];
      let bv = b[sort.key];
      if (sort.key === 'name') {
        av = fullName(a);
        bv = fullName(b);
      }
      const direction = sort.direction === 'desc' ? -1 : 1;
      return compareValues(av, bv) * direction;
    });
  }, [users, search, filters, sort]);
  const activeFilterCount =
    Object.values(filters).filter(Boolean).length + (search.trim() ? 1 : 0);

  function toggleSort(key) {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  }

  function clearFilters() {
    setSearchInput('');
    setFilters({ user_type: '', package_tier: '', organization: '' });
    setSort({ key: 'created_at', direction: 'desc' });
  }

  function exportCsv() {
    const headers = [
      'Full Name',
      'Email',
      'Organization',
      'Title',
      'User Type',
      'Package',
      'Last Seen'
    ];
    const escapeCsv = (value) => {
      const str = String(value ?? '');
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };

    const rows = filtered.map((row) => [
      fullName(row),
      row.email || '',
      row.organization || '',
      row.title || '',
      row.user_type || '',
      row.package_tier || '',
      formatDate(row.created_at)
    ]);

    const csv = [headers, ...rows].map((line) => line.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    a.href = url;
    a.download = `maps-users-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(row) {
    if (!row?.id) {
      setActionError('Cannot delete this row because it has no ID.');
      return;
    }
    const ok = window.confirm(`Delete ${fullName(row)}? This cannot be undone.`);
    if (!ok) return;
    setActionError('');
    setBusyId(row.id);
    try {
      await deleteUser(row.id);
      await refetch();
    } catch (err) {
      setActionError(err?.message || 'Failed to delete user');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="subs">
      <div className="subs-toolbar">
        <div className="subs-toolbar__row subs-toolbar__row--top">
          <div className="subs-toolbar__count">
            <span className="eyebrow">Users</span>
            <div className="subs-toolbar__count-value">
              <span className="serif subs-toolbar__count-num">{filtered.length}</span>
              <span className="subs-toolbar__count-of">of {users.length}</span>
            </div>
          </div>
          <div className="subs-toolbar__actions">
            <button
              type="button"
              className="subs-btn subs-btn--ghost"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              Reset
            </button>
            <button type="button" className="subs-btn" onClick={refetch} disabled={loading}>
              Refresh
            </button>
            <button
              type="button"
              className="subs-btn"
              onClick={exportCsv}
              disabled={loading || filtered.length === 0}
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="subs-toolbar__row">
          <label className="subs-search">
            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
              <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search name, email, organization, user type..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search users"
            />
            {searchInput && (
              <button
                type="button"
                className="subs-search__clear"
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </label>
          <div className="subs-filters">
            <FilterSelect
              label="User Type"
              value={filters.user_type}
              onChange={(v) => setFilters((prev) => ({ ...prev, user_type: v }))}
              options={filterOptions.user_type}
            />
            <FilterSelect
              label="Package"
              value={filters.package_tier}
              onChange={(v) => setFilters((prev) => ({ ...prev, package_tier: v }))}
              options={filterOptions.package_tier}
            />
            <FilterSelect
              label="Organization"
              value={filters.organization}
              onChange={(v) => setFilters((prev) => ({ ...prev, organization: v }))}
              options={filterOptions.organization}
            />
          </div>
        </div>
      </div>
      {actionError && (
        <div className="subs-error" style={{ minHeight: 'auto', padding: 12 }}>
          <p className="subs-error__text">{actionError}</p>
        </div>
      )}

      <div className="subs__panel">
        {error ? (
          <div className="subs-error">
            <h3 className="serif subs-error__title">We couldn't load users</h3>
            <p className="subs-error__text">{error}</p>
            <button type="button" className="subs-btn subs-btn--primary" onClick={refetch}>
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="subs-skeleton__header" style={{ padding: 24 }}>
            <Spinner size={20} />
            <span>Loading users...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="subs-empty">
            <h3 className="serif subs-empty__title">No matching users</h3>
            <p className="subs-empty__text">Try clearing or adjusting your search and filters.</p>
            {activeFilterCount > 0 && (
              <button type="button" className="subs-btn" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="subs-table-wrap">
            <table className="subs-table users-table" style={{ minWidth: 1700 }}>
              <colgroup>
                <col style={{ width: '220px' }} />
                <col style={{ width: '320px' }} />
                <col style={{ width: '320px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '220px' }} />
                <col style={{ width: '180px' }} />
              </colgroup>
              <thead>
                <tr>
                  <SortableHeader
                    label="Full Name"
                    sortKey="name"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <SortableHeader label="Email" sortKey="email" sort={sort} onToggle={toggleSort} />
                  <SortableHeader
                    label="Organization"
                    sortKey="organization"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <SortableHeader label="Title" sortKey="title" sort={sort} onToggle={toggleSort} />
                  <SortableHeader
                    label="User Type"
                    sortKey="user_type"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <SortableHeader
                    label="Package"
                    sortKey="package_tier"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <SortableHeader
                    label="Last Seen"
                    sortKey="created_at"
                    sort={sort}
                    onToggle={toggleSort}
                  />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr
                    key={[
                      row.id ?? 'no-id',
                      row.email ?? 'no-email',
                      row.created_at ?? 'no-created-at',
                      idx
                    ].join(':')}
                    className="subs-row"
                    onClick={() => row.id && navigate(`/users/${row.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && row.id) {
                        e.preventDefault();
                        navigate(`/users/${row.id}`);
                      }
                    }}
                    aria-label={`Open details for ${fullName(row)}`}
                  >
                    <td className="subs-cell-name__primary">{fullName(row)}</td>
                    <td className="mono">{row.email || '—'}</td>
                    <td>{row.organization || '—'}</td>
                    <td>{row.title || '—'}</td>
                    <td>
                      <span className="subs-pill subs-pill--type">{row.user_type || '—'}</span>
                    </td>
                    <td>
                      <PackageBadge tier={row.package_tier} />
                    </td>
                    <td className="mono">{formatDate(row.created_at)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="users-table__actions">
                        <button
                          type="button"
                          className="subs-btn subs-btn--ghost users-table__delete"
                          onClick={() => handleDelete(row)}
                          disabled={!row.id || busyId === row.id}
                        >
                          {busyId === row.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className={`subs-filter ${value ? 'is-active' : ''}`}>
      <span className="subs-filter__label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
        <path
          d="M1 1l4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </label>
  );
}

function SortableHeader({ label, sortKey, sort, onToggle }) {
  const isActive = sort.key === sortKey;
  return (
    <th
      className="is-sortable"
      aria-sort={isActive ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button type="button" className="subs-table__sort" onClick={() => onToggle(sortKey)}>
        {label}
        <SortIcon active={isActive} direction={sort.direction} />
      </button>
    </th>
  );
}

function SortIcon({ active, direction }) {
  return (
    <span className={`subs-sort-icon ${active ? 'is-active' : ''}`}>
      <svg viewBox="0 0 8 12" width="8" height="12" aria-hidden="true">
        <path
          d="M4 1 L7 5 L1 5 Z"
          fill="currentColor"
          opacity={active && direction === 'asc' ? 1 : 0.25}
        />
        <path
          d="M4 11 L1 7 L7 7 Z"
          fill="currentColor"
          opacity={active && direction === 'desc' ? 1 : 0.25}
        />
      </svg>
    </span>
  );
}

function PackageBadge({ tier }) {
  if (!tier) return <span>—</span>;
  const t = tier.toLowerCase();
  let cls = 'subs-pkg subs-pkg--default';
  if (t.includes('gold')) cls = 'subs-pkg subs-pkg--gold';
  else if (t.includes('silver')) cls = 'subs-pkg subs-pkg--silver';
  else if (t.includes('platinum') || t.includes('diamond')) cls = 'subs-pkg subs-pkg--platinum';
  else if (t.includes('bronze')) cls = 'subs-pkg subs-pkg--bronze';
  return <span className={cls}>{tier}</span>;
}
