import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Spinner from '../components/Spinner.jsx';
import { fetchUserById } from '../services/supabase.js';
import { formatDate, fullName } from '../utils/data.js';
import './UserDetails.css';

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchUserById(id);
        if (active) setRow(data);
      } catch (err) {
        if (active) setError(err?.message || 'Failed to load details');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <section className="user-details">
      <div className="user-details__head">
        <button type="button" className="subs-btn subs-btn--ghost" onClick={() => navigate('/dashboard')}>
          Back to users
        </button>
      </div>

      {loading ? (
        <div className="user-details__state">
          <Spinner size={20} />
          <span>Loading details...</span>
        </div>
      ) : error ? (
        <div className="subs-error">
          <h3 className="serif subs-error__title">Could not load user details</h3>
          <p className="subs-error__text">{error}</p>
        </div>
      ) : !row ? (
        <div className="subs-empty">
          <h3 className="serif subs-empty__title">Record not found</h3>
        </div>
      ) : (
        <div className="user-details__panel">
          <h2 className="serif user-details__title">{fullName(row)}</h2>
          <div className="user-details__grid">
            {buildFields(row).map((field) => (
              <Field
                key={field.label}
                label={field.label}
                value={field.value}
                mono={field.mono}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="user-details__field">
      <span className="eyebrow">{label}</span>
      <span className={mono ? 'mono' : ''}>{value || '—'}</span>
    </div>
  );
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

function buildFields(row) {
  const all = [
    { label: 'ID', value: row.id, mono: true },
    { label: 'Email', value: row.email, mono: true },
    { label: 'Organization', value: row.organization },
    { label: 'Title', value: row.title },
    { label: 'User Type', value: row.user_type },
    { label: 'Package Tier', value: row.package_tier },
    { label: 'Meeting Room', value: row.meeting_room },
    { label: 'Created At', value: formatDate(row.created_at), mono: true },
    { label: 'First Name', value: row.first_name },
    { label: 'Last Name', value: row.last_name },
    { label: 'Ticket Size', value: row.ticket_size },
    { label: 'Form Type', value: row.form_type },
    { label: 'Attendee Band', value: row.attendee_band },
    { label: 'Attendee Count', value: row.attendee_count_exact },
    {
      label: 'Consent Ack',
      value: row.consent_ack === null || row.consent_ack === undefined ? null : row.consent_ack ? 'Yes' : 'No'
    }
  ];
  return all.filter((field) => hasValue(field.value));
}
