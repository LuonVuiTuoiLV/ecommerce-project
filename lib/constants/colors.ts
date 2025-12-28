// Shared color mapping for product variants
export const COLOR_MAP: Record<string, string> = {
  // Vietnamese
  'Trắng': '#FFFFFF',
  'Đen': '#000000',
  'Đỏ': '#FF0000',
  'Xanh dương': '#0000FF',
  'Xanh lá': '#00FF00',
  'Vàng': '#FFFF00',
  'Cam': '#FFA500',
  'Hồng': '#FFC0CB',
  'Tím': '#800080',
  'Nâu': '#8B4513',
  'Xám': '#808080',
  'Xanh navy': '#000080',
  'Be': '#F5F5DC',
  'Vàng gold': '#FFD700',
  'Bạc': '#C0C0C0',
  // English
  'White': '#FFFFFF',
  'Black': '#000000',
  'Red': '#FF0000',
  'Blue': '#0000FF',
  'Green': '#00FF00',
  'Yellow': '#FFFF00',
  'Orange': '#FFA500',
  'Pink': '#FFC0CB',
  'Purple': '#800080',
  'Brown': '#8B4513',
  'Gray': '#808080',
  'Grey': '#808080',
  'Navy': '#000080',
  'Beige': '#F5F5DC',
  'Gold': '#FFD700',
  'Silver': '#C0C0C0',
}

export function getColorHex(colorName: string): string {
  return COLOR_MAP[colorName] || colorName
}
