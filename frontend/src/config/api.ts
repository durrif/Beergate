const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
  REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
  ME: `${API_BASE_URL}/api/v1/auth/me`,
  
  // Inventory
  INVENTORY: `${API_BASE_URL}/api/v1/inventory`,
  INVENTORY_STATS: `${API_BASE_URL}/api/v1/inventory/stats`,
  
  // Purchases
  PURCHASES: `${API_BASE_URL}/api/v1/purchases`,
  UPLOAD_INVOICE: `${API_BASE_URL}/api/v1/purchases/upload-invoice`,
  
  // Recipes
  RECIPES: `${API_BASE_URL}/api/v1/recipes`,
  IMPORT_BEERXML: `${API_BASE_URL}/api/v1/recipes/import-beerxml`,
  
  // Recommendations
  POSSIBLE_RECIPES: `${API_BASE_URL}/api/v1/recommendations/possible-recipes`,
  SUBSTITUTIONS: `${API_BASE_URL}/api/v1/recommendations/substitutions`,
  ALERTS: `${API_BASE_URL}/api/v1/recommendations/alerts`,
}

export default API_BASE_URL
