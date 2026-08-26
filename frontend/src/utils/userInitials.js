/**
 * Unified user initials generator across the entire UEH TCC application.
 * e.g.: "Lữ Võ Hoàng Phúc" -> "HP" (Hoàng Phúc)
 *       "Hoàng Phúc" -> "HP"
 *       "Phúc" -> "PH"
 *       "admin" -> "AD"
 */
export const getInitials = (value = '') => {
  const clean = String(value || '').trim();
  if (!clean) return 'HV';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'HV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.slice(-2).map((part) => part[0]).join('').toUpperCase();
};

export default getInitials;
