// Navbar.jsx
import NavItem from './NavItem';
import { Link } from 'react-router-dom';
const Navbar = ({ username, role }) => {
  const commonItems = [
    { label: "השיעורים שלי", path: "/my-lessons" },
    { label: "מערכת שיעורים", path: "/all-lessons" },
    { label: "הודעות מערכת", path: "/messages" },
    { label: "אזור אישי", path: "/profile" },
  ];

  const traineeItems = [
    { label: "מועדפים", path: "/favorites" },
    { label: "תוכניות אימון", path: "/programs" },
  ];

  const secretaryItems = [
    { label: "רשימת מדריכים", path: "/all-instructors" },
    { label: "רשימת מתאמנים", path: "/all-trainees" },
  ];

  let navItems = [...commonItems];

  if (role === "trainee") navItems.push(...traineeItems);
  if (role === "secretary") navItems.push(...secretaryItems);

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#eee' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {navItems.map((item, idx) => (
          <NavItem key={idx} label={item.label} path={item.path} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>שלום, {username}</span>
        <Link to="/logout">
          {/* <img src="/logout-icon.svg" alt="Logout" style={{ width: '20px' }} /> */}
        </Link>
      </div>
    </nav>
  );
};
export default Navbar;

