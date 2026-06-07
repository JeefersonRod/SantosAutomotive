export const hasRole = (role: string | undefined, allowedRoles: readonly string[]) => {
  if (!role) return false;
  return allowedRoles.includes(role);
};
