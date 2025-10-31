"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';

interface MMMChannel {
  name: string;
  roi: number;
  spend: number;
  revenue: number;
  effectiveness: number;
}

interface MMMData {
  success: boolean;
  user: string;
  summary: {
    total_spend: number;
    total_revenue: number;
    overall_roi: number;
    total_kpi: number;
    num_channels: number;
    num_geos: number;
    num_time_periods: number;
  };
  channels: MMMChannel[];
}

export default function DashboardPage() {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const [mmmData, setMmmData] = useState<MMMData | null>(null);
  const [error, setError] = useState('');
  const [mmmLoading, setMmmLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch MMM data
  useEffect(() => {
    const fetchMMMData = async () => {
      if (!token) return;
      
      setMmmLoading(true);
      try {
        const response = await fetch('http://localhost:8000/api/mmm-data', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMmmData(data);
        } else {
          setError('Failed to load MMM data');
        }
      } catch (err) {
        console.error('Error fetching MMM data:', err);
        setError('Error loading MMM data');
      } finally {
        setMmmLoading(false);
      }
    };

    if (user && token) {
      fetchMMMData();
    }
  }, [user, token]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (isLoading || mmmLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading MMM Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={logout}>Logout</Button>
        </div>
      </div>
    );
  }

  if (!mmmData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-white">No MMM data available</p>
      </div>
    );
  }

  const maxRoi = Math.max(...mmmData.channels.map(c => c.roi));
  const sortedChannels = [...mmmData.channels].sort((a, b) => b.roi - a.roi);
  const totalSpend = mmmData.summary.total_spend;

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Marketing Mix Model</h1>
            <p className="text-gray-400 mt-1">Welcome back, {user.username}</p>
          </div>
          <Button onClick={logout} variant="outline" className="border-gray-600 text-gray-200 hover:bg-gray-800">
            Logout
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-lg border border-gray-700 bg-gradient-to-br from-blue-900/50 to-gray-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Total Spend</p>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">{formatCurrency(mmmData.summary.total_spend)}</p>
          </div>
          
          <div className="rounded-lg border border-gray-700 bg-gradient-to-br from-green-900/50 to-gray-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Total Revenue</p>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">{formatCurrency(mmmData.summary.total_revenue)}</p>
          </div>
          
          <div className="rounded-lg border border-gray-700 bg-gradient-to-br from-purple-900/50 to-gray-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Overall ROI</p>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">{mmmData.summary.overall_roi.toFixed(2)}x</p>
            <p className="text-xs text-green-400 mt-1">
              +{formatCurrency(mmmData.summary.total_revenue - mmmData.summary.total_spend)} profit
            </p>
          </div>
          
          <div className="rounded-lg border border-gray-700 bg-gradient-to-br from-indigo-900/50 to-gray-800 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Media Channels</p>
              <span className="text-2xl">📺</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-white">{mmmData.summary.num_channels}</p>
            <p className="text-xs text-gray-400 mt-1">
              {mmmData.summary.num_geos} geos • {mmmData.summary.num_time_periods} weeks
            </p>
          </div>
        </div>

        {/* ROI Bar Chart */}
        <div className="mb-8 rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">ROI by Channel</h2>
          <div className="space-y-6">
            {sortedChannels.map((channel, idx) => {
              const width = (channel.roi / maxRoi) * 100;
              const isPositiveROI = channel.roi > 1;
              
              return (
                <div key={channel.name} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${
                        idx === 0 ? 'bg-green-500' : 
                        idx === 1 ? 'bg-blue-500' : 
                        idx === 2 ? 'bg-purple-500' : 
                        idx === 3 ? 'bg-yellow-500' : 'bg-pink-500'
                      }`}></div>
                      <span className="text-gray-300 font-medium">{channel.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 hidden sm:inline">{formatCurrency(channel.spend)}</span>
                      <span className={`font-bold ${isPositiveROI ? 'text-green-400' : 'text-red-400'}`}>
                        {channel.roi.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                  <div className="h-10 bg-gray-700/50 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        channel.roi > 1.5 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                        channel.roi > 1 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                        channel.roi > 0.8 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                        'bg-gradient-to-r from-red-500 to-red-400'
                      }`}
                      style={{ width: `${width}%` }}
                    >
                      <div className="h-full flex items-center justify-end pr-3">
                        <span className="text-white text-xs font-semibold">
                          {formatCurrency(channel.revenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Spend Distribution Pie Chart */}
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-lg">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">Spend Distribution</h2>
            <div className="flex flex-col items-center">
              <div className="relative w-64 h-64 mb-6">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {mmmData.channels.map((channel, idx) => {
                    const prevTotal = mmmData.channels.slice(0, idx).reduce((sum, c) => sum + c.spend, 0);
                    const offset = (prevTotal / totalSpend) * 100;
                    const percentage = (channel.spend / totalSpend) * 100;
                    const colors = ['#10b981', '#3b82f6', '#a855f7', '#eab308', '#ec4899'];
                    
                    return (
                      <circle
                        key={channel.name}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={colors[idx]}
                        strokeWidth="20"
                        strokeDasharray={`${percentage} ${100 - percentage}`}
                        strokeDashoffset={-offset}
                        className="transition-all duration-500"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{mmmData.summary.num_channels}</p>
                    <p className="text-sm text-gray-400">Channels</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full space-y-2">
                {mmmData.channels.map((channel, idx) => {
                  const percentage = ((channel.spend / totalSpend) * 100).toFixed(1);
                  const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500'];
                  
                  return (
                    <div key={channel.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[idx]}`}></div>
                        <span className="text-gray-300">{channel.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{percentage}%</span>
                        <span className="text-gray-500 hidden sm:inline">
                          {formatCurrency(channel.spend)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Table */}
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-lg">
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">Channel Metrics</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-2 text-xs font-medium text-gray-400">Channel</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-400">ROI</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-400 hidden sm:table-cell">Revenue</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-gray-400">Eff.</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedChannels.map((channel, idx) => (
                    <tr key={channel.name} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            idx === 0 ? 'bg-green-500' : 
                            idx === 1 ? 'bg-blue-500' : 
                            idx === 2 ? 'bg-purple-500' : 
                            idx === 3 ? 'bg-yellow-500' : 'bg-pink-500'
                          }`}></div>
                          <span className="text-white text-sm">{channel.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-4 px-2">
                        <span className={`font-bold text-sm ${
                          channel.roi > 1 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {channel.roi.toFixed(2)}
                        </span>
                      </td>
                      <td className="text-right py-4 px-2 text-gray-300 text-sm hidden sm:table-cell">
                        {formatCurrency(channel.revenue)}
                      </td>
                      <td className="text-right py-4 px-2 text-gray-300 text-sm">
                        {channel.effectiveness.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Best Performer</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{sortedChannels[0].name}</span>
                  <span className="text-green-400 font-bold">{sortedChannels[0].roi.toFixed(2)}x</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="mt-8 rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-lg">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Key Insights</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏆</span>
                <h3 className="text-white font-semibold">Top Channel</h3>
              </div>
              <p className="text-gray-300 text-sm">
                {sortedChannels[0].name} delivers the highest ROI at {sortedChannels[0].roi.toFixed(2)}x
              </p>
            </div>
            
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📊</span>
                <h3 className="text-white font-semibold">Efficiency</h3>
              </div>
              <p className="text-gray-300 text-sm">
                {sortedChannels.filter(c => c.roi > 1).length} out of {mmmData.summary.num_channels} channels are profitable
              </p>
            </div>
            
            <div className="bg-gray-700/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💡</span>
                <h3 className="text-white font-semibold">Opportunity</h3>
              </div>
              <p className="text-gray-300 text-sm">
                Consider reallocating budget from underperforming channels to maximize ROI
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}