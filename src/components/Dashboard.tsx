import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Filter, Settings, Search, Clock, ListFilter } from 'lucide-react';
import { exportToCSV } from '../lib/csv';
import type { Transaction, SystemStatus, TransactionResponse } from '../types';
import { format } from 'date-fns';
import { mockApi } from '../lib/mockApi';

const CITIES = ['台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市'];
const DISTRICTS_MAP: Record<string, string[]> = {
  '台北市': ['大安區', '信義區', '中山區', '內湖區'],
  '新北市': ['板橋區', '中和區', '新莊區', '三重區'],
  '桃園市': ['桃園區', '中壢區', '蘆竹區'],
  '台中市': ['西屯區', '南屯區', '北屯區'],
  '台南市': ['東區', '永康區', '安平區'],
  '高雄市': ['左營區', '三民區', '鼓山區']
};

export default function Dashboard() {
  const [data, setData] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<SystemStatus>({ lastUpdated: '', scheduleInterval: 'daily' });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [newInterval, setNewInterval] = useState('daily');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await mockApi.getTransactions({ city, district, maxPrice });
      
      setData(result.data);
      setStatus({
        lastUpdated: result.lastUpdated,
        scheduleInterval: result.scheduleInterval
      });
      setNewInterval(result.scheduleInterval);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [city, district, maxPrice]); // Fetch on filter change

  // If city changes, reset district
  useEffect(() => {
    setDistrict('');
  }, [city]);

  // Mock scheduler
  useEffect(() => {
    const intervalMs = 
      status.scheduleInterval === 'test-minute' ? 60 * 1000 :
      status.scheduleInterval === 'hourly' ? 60 * 60 * 1000 :
      status.scheduleInterval === 'daily' ? 24 * 60 * 60 * 1000 :
      7 * 24 * 60 * 60 * 1000;

    const timer = setInterval(() => {
      mockApi.performScheduledUpdate();
      fetchData();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [status.scheduleInterval, city, district, maxPrice]); // Restart timer if config changes

  const handleExport = () => {
    const exportData = data.map(item => ({
      '交易ID': item.id,
      '縣市': item.city,
      '行政區': item.district,
      '地址': item.address,
      '物件類型': item.propertyType,
      '坪數': item.area,
      '總價(元)': item.price,
      '單價(元/坪)': item.unitPrice,
      '交易日期': item.date
    }));
    exportToCSV(`taiwan_real_estate_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`, exportData);
  };

  const handleManualSync = async () => {
    setIsUpdating(true);
    try {
      await mockApi.triggerUpdate();
      await fetchData();
    } catch (error) {
      console.error("Failed to trigger update:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateSchedule = async () => {
    try {
      const res = await mockApi.updateSchedule(newInterval);
      if (res.success) {
        setShowSettings(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to update schedule:", error);
    }
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <span className="font-bold text-lg tracking-tight">臺房數據匯出</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-xl flex items-center font-medium cursor-pointer">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path></svg>
            數據總覽
          </div>
          <div className="hover:bg-slate-50 text-slate-600 px-4 py-3 rounded-xl flex items-center transition-colors cursor-pointer">
            <Filter className="w-5 h-5 mr-3" />
            進階篩選
          </div>
          <div 
            onClick={() => setShowSettings(true)}
            className="hover:bg-slate-50 text-slate-600 px-4 py-3 rounded-xl flex items-center transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5 mr-3" />
            排程管理
          </div>
          <div className="hover:bg-slate-50 text-slate-600 px-4 py-3 rounded-xl flex items-center transition-colors cursor-pointer">
            <ListFilter className="w-5 h-5 mr-3" />
            CSV 歷史匯出
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-900 rounded-2xl p-4 text-white">
            <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">自動更新狀態</div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              <span className="text-sm font-semibold">系統運作中</span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400">
              上次更新: {status.lastUpdated ? format(new Date(status.lastUpdated), 'MM/dd HH:mm') : '載入中'}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">台灣不動產成交資訊系統</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleManualSync}
              disabled={isUpdating}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold shadow-sm transition-all flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin text-indigo-600' : ''}`} />
              同步數據
            </button>
            <button 
              onClick={handleExport}
              disabled={data.length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-all flex items-center disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              匯出 CSV
            </button>
          </div>
        </header>

        <div className="p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase mb-1">成交筆數</div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{data.length}</div>
            <div className="text-emerald-500 text-xs mt-2">目前篩選條件下結果</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase mb-1">自動排程頻率</div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {status.scheduleInterval === 'daily' ? '每日排程' : status.scheduleInterval === 'hourly' ? '每小時排程' : status.scheduleInterval === 'weekly' ? '每週排程' : '每分鐘測試'}
            </div>
            <div className="text-indigo-500 text-xs mt-2">背景定時抓取</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase mb-1">系統數據狀態</div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">最新</div>
            <div className="text-slate-400 text-xs mt-2">API連線正常</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-slate-500 text-xs font-semibold uppercase mb-1">平均單價 (整體)</div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">46.5 萬</div>
            <div className="text-slate-400 text-xs mt-2">每坪單價計算</div>
          </div>
        </div>

        <div className="flex-1 px-8 pb-8 flex flex-col min-h-0">
          <div className="bg-white flex-1 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-4">
              <div className="flex items-center space-x-6 text-sm font-medium flex-wrap gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">市區</span>
                  <select 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-transparent border-none text-slate-700 font-medium focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="">全部</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">行政區</span>
                  <select 
                    value={district} 
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={!city}
                    className="bg-transparent border-none text-slate-700 font-medium focus:outline-none focus:ring-0 cursor-pointer disabled:opacity-50"
                  >
                    <option value="">全部</option>
                    {city && DISTRICTS_MAP[city]?.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs uppercase tracking-wider">總價上限</span>
                  <select 
                    value={maxPrice} 
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="bg-transparent border-none text-slate-700 font-medium focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="">不限</option>
                    <option value="10000000">1000萬以下</option>
                    <option value="20000000">2000萬以下</option>
                    <option value="30000000">3000萬以下</option>
                    <option value="50000000">5000萬以下</option>
                  </select>
                </div>
                {(city || district || maxPrice) && (
                  <button 
                    onClick={() => { setCity(''); setDistrict(''); setMaxPrice(''); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-2 py-1 rounded"
                  >
                    清除篩選
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0">
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.05)]">
                    <th className="px-6 py-4 bg-white">交易日期</th>
                    <th className="px-6 py-4 bg-white">行政區</th>
                    <th className="px-6 py-4 bg-white">地段/地址</th>
                    <th className="px-6 py-4 bg-white">建物型態</th>
                    <th className="px-6 py-4 bg-white text-right">建坪 (坪)</th>
                    <th className="px-6 py-4 bg-white text-right">總價</th>
                    <th className="px-6 py-4 bg-white text-right">單價(坪)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex justify-center items-center gap-3">
                          <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                          <span className="text-sm font-medium">載入中...</span>
                        </div>
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500 font-medium">
                        找不到符合的成交資料
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{item.date}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{item.city} {item.district}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.address}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">{item.propertyType}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-right text-slate-600">{item.area}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500 text-right">{formatCurrency(item.unitPrice)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                排程更新設定
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                選擇系統自動擷取新成交資訊的頻率。
              </p>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${newInterval === 'hourly' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="interval" value="hourly" checked={newInterval === 'hourly'} onChange={(e) => setNewInterval(e.target.value)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                  <span className={`text-sm font-medium ${newInterval === 'hourly' ? 'text-indigo-900' : 'text-slate-700'}`}>每小時 (Hourly)</span>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${newInterval === 'daily' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="interval" value="daily" checked={newInterval === 'daily'} onChange={(e) => setNewInterval(e.target.value)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                  <span className={`text-sm font-medium ${newInterval === 'daily' ? 'text-indigo-900' : 'text-slate-700'}`}>每天 (Daily)</span>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${newInterval === 'weekly' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="interval" value="weekly" checked={newInterval === 'weekly'} onChange={(e) => setNewInterval(e.target.value)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500" />
                  <span className={`text-sm font-medium ${newInterval === 'weekly' ? 'text-indigo-900' : 'text-slate-700'}`}>每週 (Weekly)</span>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${newInterval === 'test-minute' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="interval" value="test-minute" checked={newInterval === 'test-minute'} onChange={(e) => setNewInterval(e.target.value)} className="w-4 h-4 text-amber-500 focus:ring-amber-500" />
                  <span className={`text-sm font-medium ${newInterval === 'test-minute' ? 'text-amber-900' : 'text-slate-700'}`}>測試模式：每分鐘 (Test)</span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors focus:ring-2 focus:ring-slate-200"
              >
                取消
              </button>
              <button 
                onClick={updateSchedule}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm"
              >
                儲存設定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
