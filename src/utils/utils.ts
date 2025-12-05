export function createPageUrl(pageName: string): string {
  // Convert "Dashboard" => "/dashboard"
  return `/${pageName.trim().replace(/\s+/g, "-").toLowerCase()}`;
}
