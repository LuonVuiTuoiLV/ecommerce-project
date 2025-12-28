// Vietnam Administrative Divisions API v2
// Source: https://provinces.open-api.vn/api/v2/
// 
// ═══════════════════════════════════════════════════════════════════════════════
// API V2 - SAU SÁP NHẬP TỈNH THÀNH 07/2025
// ═══════════════════════════════════════════════════════════════════════════════
// - 34 tỉnh/thành phố (thay vì 63)
// - Cấu trúc 2 cấp: Tỉnh/Thành phố → Phường/Xã (KHÔNG CÓ Quận/Huyện)
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = 'https://provinces.open-api.vn/api/v2'

export interface Province {
  code: number
  name: string
  division_type: string
  codename: string
  phone_code?: number
}

export interface Ward {
  code: number
  name: string
  division_type: string
  codename: string
  province_code: number
}

// Cache with TTL tracking
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

const cache: {
  provinces: CacheEntry<Province[]> | null
  wards: Map<number, CacheEntry<Ward[]>>
} = {
  provinces: null,
  wards: new Map(),
}

function isCacheValid<T>(entry: CacheEntry<T> | null | undefined): entry is CacheEntry<T> {
  if (!entry) return false
  return Date.now() - entry.timestamp < CACHE_TTL
}

// Fetch with timeout
async function fetchWithTimeout(url: string, timeout = 15000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Fetch all provinces (34 tỉnh/thành sau sáp nhập)
export async function getProvinces(): Promise<Province[]> {
  if (isCacheValid(cache.provinces)) {
    return cache.provinces.data
  }

  try {
    const response = await fetchWithTimeout(`${API_BASE}/`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid response')
    }
    
    cache.provinces = { data, timestamp: Date.now() }
    return data
  } catch (error) {
    console.error('Error fetching provinces:', error)
    return []
  }
}

// Fetch wards by province code (trực tiếp từ tỉnh, không qua quận)
export async function getWards(provinceCode: number): Promise<Ward[]> {
  if (!provinceCode || provinceCode <= 0) return []
  
  const cached = cache.wards.get(provinceCode)
  if (isCacheValid(cached)) {
    return cached.data
  }

  try {
    const response = await fetchWithTimeout(`${API_BASE}/p/${provinceCode}?depth=2`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const wards: Ward[] = data.wards || []
    
    cache.wards.set(provinceCode, { data: wards, timestamp: Date.now() })
    return wards
  } catch (error) {
    console.error('Error fetching wards:', error)
    return []
  }
}

// Format full address (2 cấp: Phường/Xã, Tỉnh/Thành phố)
export function formatAddress(
  provinceName: string,
  wardName: string,
  street: string
): string {
  return [street, wardName, provinceName].filter(Boolean).join(', ')
}

// Clear cache
export function clearCache(): void {
  cache.provinces = null
  cache.wards.clear()
}
