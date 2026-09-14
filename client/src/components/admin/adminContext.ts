export function clearAttentionContext(search: string): URLSearchParams {
  const params = new URLSearchParams(search);
  params.delete("user");
  params.delete("panel");
  params.delete("orphan");
  return params;
}
