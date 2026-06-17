import type { Transaction } from '../types';

const CITIES = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'];
const DISTRICTS_MAP: Record<string, string[]> = {
  '台北市': ['大安區', '信義區', '中山區', '內湖區'],
  '新北市': ['板橋區', '中和區', '新莊區', '三重區'],
  '桃園市': ['桃園區', '中壢區', '蘆竹區'],
  '台中市': ['西屯區', '南屯區', '北屯區'],
  '台南市': ['東區', '永康區', '安平區'],
  '高雄市': ['左營區', '三民區', '鼓山區']
};
const PROPERTY_TYPES = ['住宅大樓', '公寓', '透天厝', '套房'];

let mockTransactions: Transaction[] = [];

function generateTransaction(): Transaction {
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const districtsInCity = DISTRICTS_MAP[city];
  const district = districtsInCity[Math.floor(Math.random() * districtsInCity.length)];
  const propertyType = PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)];
  
  const area = Math.floor(Math.random() * 50) + 15;
  
  let basePricePerPing = 200000;
  if (city === '台北市') basePricePerPing = 800000;
  else if (city === '新北市') basePricePerPing = 500000;
  else if (city === '台中市') basePricePerPing = 400000;
  else if (city === '新莊區') basePricePerPing = 350000;

  const unitPrice = basePricePerPing + Math.floor(Math.random() * 150000);
  const price = unitPrice * area;
  
  const now = new Date();
  now.setDate(now.getDate() - Math.floor(Math.random() * 60));
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    city,
    district,
    address: `${city}${district}某某街${Math.floor(Math.random() * 100) + 1}號`,
    propertyType,
    area,
    price,
    unitPrice,
    date: now.toISOString().split('T')[0]
  };
}

// Initial seeding
for (let i = 0; i < 50; i++) {
  mockTransactions.push(generateTransaction());
}

let lastUpdated = new Date().toISOString();
let scheduleInterval = 'daily';

export const mockApi = {
  getTransactions: async (filters: any) => {
    // simulate network latency
    await new Promise(resolve => setTimeout(resolve, 400));
    
    let filtered = mockTransactions;
    if (filters.city) {
      filtered = filtered.filter(t => t.city === filters.city);
    }
    if (filters.district) {
      filtered = filtered.filter(t => t.district === filters.district);
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(t => t.price <= Number(filters.maxPrice));
    }
    
    return {
      data: filtered,
      lastUpdated,
      scheduleInterval,
      total: filtered.length
    };
  },
  
  triggerUpdate: async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const newCount = Math.floor(Math.random() * 5) + 5;
    for (let i = 0; i < newCount; i++) {
      mockTransactions.unshift(generateTransaction());
    }
    if (mockTransactions.length > 200) {
      mockTransactions = mockTransactions.slice(0, 200);
    }
    lastUpdated = new Date().toISOString();
    return { success: true, lastUpdated, fetched: newCount };
  },

  updateSchedule: async (interval: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    scheduleInterval = interval;
    return { success: true, scheduleInterval };
  },

  performScheduledUpdate: () => {
    const newCount = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < newCount; i++) {
      mockTransactions.unshift(generateTransaction());
    }
    if (mockTransactions.length > 200) {
      mockTransactions = mockTransactions.slice(0, 200);
    }
    lastUpdated = new Date().toISOString();
  }
};
