// src/components/Navbar/NavItem.jsx
// NavItem.jsx
import { Link } from 'react-router-dom';

const NavItem = ({ label, path }) => {
  return (
    <Link to={`/home${path}`} style={{ textDecoration: 'none', color: 'black' }}>
      {label}
    </Link>
  );
};

export default NavItem;

