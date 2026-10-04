import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const normalizeRole = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z_]/g, '');

const roleGroups = {
  STUDENT: ['STUDENT', 'LEADER', 'GROUP_LEADER'], // <-- Bổ sung STUDENT vào đây
  ADMIN: ['ADMIN', 'SYSTEM_ADMIN'],
};

const acceptedRoles = new Set(
  Object.values(roleGroups).flatMap((roles) => roles),
);

const isRoleAllowed = (userRole, allowedRoles = []) => {
  const normalizedUserRole = normalizeRole(userRole);
  if (!normalizedUserRole || !acceptedRoles.has(normalizedUserRole)) {
    return false;
  }

  const normalizedAllowed = allowedRoles.map((role) => normalizeRole(role));

  return normalizedAllowed.some((allowedRole) => {
    const group = Object.entries(roleGroups).find(([, roles]) =>
      roles.includes(allowedRole),
    );

    if (!group) {
      return allowedRole === normalizedUserRole;
    }

    const [, aliasList] = group;
    return aliasList.includes(normalizedUserRole);
  });
};

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !isRoleAllowed(userRole, allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;