import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';
import { useSubmissions } from '../hooks/useSubmissions.js';
import {
  buildFilterOptions,
  formatDate,
  fullName,
  parsePayload,
  processSubmissions
} from '../utils/data.js';
import Spinner from './Spinner.jsx';
import './SubmissionsTable.css';

const SORTABLE = new Set(['name', 'email', 'organization', 'created_at']);

const COLUMNS = [
  { key: 'name', label: 'Full Name', sortable: true, width: '200px' },
  { key: 'email', label: 'Email', sortable: true, width: '240px' },
  { key: 'organization', label: 'Organization', sortable: true, width: '200px' },
  { key: 'title', label: 'Title', sortable: false, width: '180px' },
  { key: 'package_tier', label: 'Package', sortable: false, width: '120px' },
  { key: 'meeting_room', label: 'Meeting Room', sortable: false, width: '120px' },
  { key: 'user_type', label: 'User Type', sortable: false, width: '110px' },
  { key: 'created_at', label: 'Created', sortable: true, width: '170px' }
];

export default function SubmissionsTable() {
  const { data, loading, error, refetch } = useSubmissions();

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 300);

  const [filters, setFilters] = useState({
    package_tier: '',
    user_type: '',
    meeting_room: ''
  });

  const [sort, setSort] = useState({ key: 'created_at', direction: 'desc' });
  const [expanded, setExpanded] = useState(null);

  const filterOptions = useMemo(() => buildFilterOptions(data), [data]);

  const processed = useMemo(
    () => processSubmissions(data, { search, filters, sort }),
    [data, search, filters, sort]
  );

  // Reset expansion if list changes
  useEffect(() => {
    setExpanded(null);
  }, [search, filters, sort]);

  function toggleSort(key) {
    if (!SORTABLE.has(key)) return;
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      return {
        key,
        direction: prev.direction === 'asc' ? 'desc' : 'asc'
      };
    });
  }

  function clearFilters() {
    setSearchInput('');
    setFilters({ package_tier: '', user_type: '', meeting_room: '' });
    setSort({ key: 'created_at', direction: 'desc' });
  }

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

  return (
    <section className="subs">
      <Toolbar
        searchInput={searchInput}
        onSearch={setSearchInput}
        filters={filters}
        onFilterChange={(next) => setFilters((p) => ({ ...p, ...next }))}
        filterOptions={filterOptions}
        activeFilterCount={activeFilterCount}
        onClear={clearFilters}
        onRefresh={refetch}
        loading={loading}
        total={data.length}
        showing={processed.length}
      />

      <div className="subs__panel">
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading ? (
          <SkeletonTable />
        ) : processed.length === 0 ? (
          <EmptyState hasFilters={activeFilterCount > 0} onClear={clearFilters} />
        ) : (
          <Table
            rows={processed}
            sort={sort}
            onToggleSort={toggleSort}
            expanded={expanded}
            onToggleExpand={(id) =>
              setExpanded((curr) => (curr === id ? null : id))
            }
          />
        )}
      </div>
    </section>
  );
}

/* --------------------------------- Toolbar -------------------------------- */

function Toolbar({
  searchInput,
  onSearch,
  filters,
  onFilterChange,
  filterOptions,
  activeFilterCount,
  onClear,
  onRefresh,
  loading,
  total,
  showing
}) {
  return (
    <div className="subs-toolbar">
      <div className="subs-toolbar__row subs-toolbar__row--top">
        <div className="subs-toolbar__count">
          <span className="eyebrow">Submissions</span>
          <div className="subs-toolbar__count-value">
            <span className="serif subs-toolbar__count-num">{showing}</span>
            <span className="subs-toolbar__count-of">of {total}</span>
          </div>
        </div>

        <div className="subs-toolbar__actions">
          <button
            type="button"
            className="subs-btn subs-btn--ghost"
            onClick={onClear}
            disabled={activeFilterCount === 0}
          >
            Reset
          </button>
          <button
            type="button"
            className="subs-btn"
            onClick={onRefresh}
            disabled={loading}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path
                d="M13.5 4.5A6 6 0 1 0 14 9.5M13.5 2v3h-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Refresh
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
            placeholder="Search name, email, organization, package…"
            value={searchInput}
            onChange={(e) => onSearch(e.target.value)}
            aria-label="Search submissions"
          />
          {searchInput && (
            <button
              type="button"
              className="subs-search__clear"
              onClick={() => onSearch('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </label>

        <div className="subs-filters">
          <FilterSelect
            label="Package"
            value={filters.package_tier}
            onChange={(v) => onFilterChange({ package_tier: v })}
            options={filterOptions.package_tier}
          />
          <FilterSelect
            label="User Type"
            value={filters.user_type}
            onChange={(v) => onFilterChange({ user_type: v })}
            options={filterOptions.user_type}
          />
          <FilterSelect
            label="Meeting Room"
            value={filters.meeting_room}
            onChange={(v) => onFilterChange({ meeting_room: v })}
            options={filterOptions.meeting_room}
          />
        </div>
      </div>
    </div>
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
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}

/* ---------------------------------- Table --------------------------------- */

function Table({ rows, sort, onToggleSort, expanded, onToggleExpand }) {
  return (
    <div className="subs-table-wrap">
      <table className="subs-table">
        <colgroup>
          {COLUMNS.map((c) => (
            <col key={c.key} style={{ width: c.width }} />
          ))}
          <col style={{ width: '44px' }} />
        </colgroup>
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const isActive = sort.key === col.key;
              return (
                <th
                  key={col.key}
                  className={col.sortable ? 'is-sortable' : ''}
                  aria-sort={
                    isActive
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className="subs-table__sort"
                      onClick={() => onToggleSort(col.key)}
                    >
                      {col.label}
                      <SortIcon active={isActive} direction={sort.direction} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
            <th aria-label="Expand" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <Row
              key={row.id}
              row={row}
              expanded={expanded === row.id}
              onToggle={() => onToggleExpand(row.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ row, expanded, onToggle }) {
  const payload = useMemo(() => parsePayload(row.payload), [row.payload]);
  const meetingRoom = (row.meeting_room || '').toLowerCase();

  return (
    <>
      <tr className={`subs-row ${expanded ? 'is-expanded' : ''}`} onClick={onToggle}>
        <td>
          <div className="subs-cell-name">
            <span className="subs-cell-name__primary">{fullName(row)}</span>
            {row.consent_ack && (
              <span className="subs-chip subs-chip--ok" title="Consent acknowledged">
                ✓
              </span>
            )}
          </div>
        </td>
        <td className="subs-cell-email">
          <span className="mono">{row.email || '—'}</span>
        </td>
        <td>{row.organization || '—'}</td>
        <td>
          <span className="subs-cell-muted">{row.title || '—'}</span>
        </td>
        <td>
          <PackageBadge tier={row.package_tier} />
        </td>
        <td>
          <span
            className={`subs-pill ${
              meetingRoom === 'yes'
                ? 'subs-pill--yes'
                : meetingRoom === 'no'
                ? 'subs-pill--no'
                : ''
            }`}
          >
            {row.meeting_room || '—'}
          </span>
        </td>
        <td>
          <span className="subs-pill subs-pill--type">{row.user_type || '—'}</span>
        </td>
        <td>
          <span className="mono subs-cell-date">{formatDate(row.created_at)}</span>
        </td>
        <td className="subs-cell-chevron">
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
            <path d="M3 4.5L6 7.5L9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </td>
      </tr>
      {expanded && (
        <tr className="subs-row-detail">
          <td colSpan={COLUMNS.length + 1}>
            <ExpandedDetail row={row} payload={payload} />
          </td>
        </tr>
      )}
    </>
  );
}

function ExpandedDetail({ row, payload }) {
  return (
    <div className="subs-detail">
      <div className="subs-detail__grid">
        <DetailField label="Submission ID" value={row.id} mono />
        <DetailField label="Form Type" value={row.form_type} />
        <DetailField label="Ticket Size" value={row.ticket_size} />
        <DetailField label="Attendee Band" value={row.attendee_band} />
        <DetailField label="Attendee Count" value={row.attendee_count_exact} />
        <DetailField
          label="Consent Ack"
          value={row.consent_ack ? 'Acknowledged' : 'Not acknowledged'}
        />
      </div>

      {payload && (
        <div className="subs-detail__payload">
          <span className="eyebrow">Payload</span>
          <pre className="subs-detail__pre">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value, mono }) {
  return (
    <div className="subs-detail__field">
      <span className="eyebrow">{label}</span>
      <span className={mono ? 'mono' : ''}>{value ?? '—'}</span>
    </div>
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
  else if (t.includes('platinum') || t.includes('diamond'))
    cls = 'subs-pkg subs-pkg--platinum';
  else if (t.includes('bronze')) cls = 'subs-pkg subs-pkg--bronze';

  return <span className={cls}>{tier}</span>;
}

/* ---------------------------------- States -------------------------------- */

function SkeletonTable() {
  return (
    <div className="subs-skeleton">
      <div className="subs-skeleton__header">
        <Spinner size={20} />
        <span>Loading submissions…</span>
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="subs-skeleton__row" key={i}>
          {Array.from({ length: 8 }).map((__, j) => (
            <div className="subs-skeleton__cell" key={j} style={{ animationDelay: `${(i * 8 + j) * 30}ms` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="subs-empty">
      <div className="subs-empty__mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="48" height="48">
          <rect x="10" y="14" width="44" height="40" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 22h44M18 14V8M46 14V8M20 32h12M20 40h24M20 48h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="serif subs-empty__title">
        {hasFilters ? 'No matching records' : 'No submissions yet'}
      </h3>
      <p className="subs-empty__text">
        {hasFilters
          ? 'Try adjusting your search or filters to broaden the results.'
          : 'New form submissions will appear here as they are received.'}
      </p>
      {hasFilters && (
        <button type="button" className="subs-btn" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="subs-error">
      <div className="subs-error__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="36" height="36">
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16 9v9M16 22v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="serif subs-error__title">We couldn't load submissions</h3>
      <p className="subs-error__text">{message}</p>
      <button type="button" className="subs-btn subs-btn--primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
