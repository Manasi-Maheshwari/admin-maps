import UsersTable from '../components/UsersTable.jsx';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard__head">
        <div>
          <span className="eyebrow">Overview</span>
          <h2 className="serif dashboard__title">Users</h2>
         <p className="dashboard__sub">All users registered for the MAPS 2026 conference.</p>
        </div>
      </header>

      <UsersTable />
    </div>
  );
}
