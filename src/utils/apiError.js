export function apiError(error, fallback = 'Không thể thực hiện thao tác. Vui lòng thử lại.') {
  const data = error.response?.data;
  const fields = Array.isArray(data?.fieldErrors)
    ? data.fieldErrors.map((item) => typeof item === 'string' ? item : `${item.field || ''}: ${item.message || item.defaultMessage || ''}`).join('; ')
    : '';
  return [data?.message || error.message || fallback, fields].filter(Boolean).join(' — ');
}
