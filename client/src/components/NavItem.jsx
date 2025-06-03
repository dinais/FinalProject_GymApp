// src/components/Navbar/NavItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NavItem = ({ label, path }) => (
  <Link to={path} style={{ textDecoration: 'none', color: 'black' }}>
    {label}
  </Link>
);

export default NavItem;
