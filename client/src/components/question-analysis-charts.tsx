import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { BookOpen, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionLog } from "@shared/schema";

export function QuestionAnalysisCharts() {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 13);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const { data: questionLogs = [] } = useQuery<QuestionLog[]>({
    queryKey: ["/api/question-logs"],
  });

  // Prepare daily/weekly questions chart data
  const prepareDailyWeeklyData = () => {
    if (questionLogs.length === 0) return [];

    if (viewMode === 'daily') {
      let dateRange: string[];
      
      if (useCustomDates) {
        // Generate date range between start and end dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        dateRange = [];
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dateRange.push(d.toISOString().split('T')[0]);
        }
      } else {
        // Default: last 14 days
        dateRange = Array.from({ length: 14 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (13 - i));
          return date.toISOString().split('T')[0];
        });
      }

      return dateRange.map(dateStr => {
        const dayLogs = questionLogs.filter(log => log.study_date === dateStr);
        const totalQuestions = dayLogs.reduce((sum, log) => 
          sum + (Number(log.correct_count) || 0) + (Number(log.wrong_count) || 0) + (Number(log.blank_count) || 0), 0
        );
        const correctQuestions = dayLogs.reduce((sum, log) => sum + (Number(log.correct_count) || 0), 0);
        const attempted = dayLogs.reduce((sum, log) => sum + (Number(log.correct_count) || 0) + (Number(log.wrong_count) || 0), 0);
        
        return {
          date: dateStr,
          dayName: new Date(dateStr).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' }),
          totalQuestions,
          correctQuestions,
          wrongQuestions: dayLogs.reduce((sum, log) => sum + (Number(log.wrong_count) || 0), 0),
          successRate: attempted > 0 ? Math.round((correctQuestions / attempted) * 100) : 0
        };
      });
    } else {
      // Weekly aggregation - last 8 weeks (ISO weeks starting Monday)
      const weeks = [];
      const today = new Date();
      
      for (let i = 7; i >= 0; i--) {
        // Calculate Monday of target week (ISO week start) in UTC
        const weekStart = new Date(today);
        const daysFromMonday = (today.getUTCDay() + 6) % 7; // Convert Sunday=0 to Monday=0 system
        weekStart.setUTCDate(today.getUTCDate() - (i * 7) - daysFromMonday);
        weekStart.setUTCHours(0, 0, 0, 0); // UTC midnight
        
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
        weekEnd.setUTCHours(23, 59, 59, 999); // End of Sunday in UTC
        
        // Filter logs for this week using UTC-based string comparison 
        const weekLogs = questionLogs.filter(log => {
          const logDateStr = log.study_date;
          const weekStartStr = weekStart.toISOString().slice(0, 10); // YYYY-MM-DD
          const weekEndStr = weekEnd.toISOString().slice(0, 10); // YYYY-MM-DD
          return logDateStr >= weekStartStr && logDateStr <= weekEndStr;
        });
        
        const totalQuestions = weekLogs.reduce((sum, log) => 
          sum + (Number(log.correct_count) || 0) + (Number(log.wrong_count) || 0) + (Number(log.blank_count) || 0), 0
        );
        const correctQuestions = weekLogs.reduce((sum, log) => sum + (Number(log.correct_count) || 0), 0);
        const attempted = weekLogs.reduce((sum, log) => sum + (Number(log.correct_count) || 0) + (Number(log.wrong_count) || 0), 0);
        
        // Create descriptive week label with date range
        const weekKey = `${weekStart.getUTCFullYear()}-W${String(8 - i).padStart(2, '0')}`;
        const startMonth = weekStart.toLocaleDateString('tr-TR', { month: 'short', timeZone: 'UTC' });
        const endMonth = weekEnd.toLocaleDateString('tr-TR', { month: 'short', timeZone: 'UTC' });
        const startYear = weekStart.getUTCFullYear();
        const endYear = weekEnd.getUTCFullYear();
        
        let weekLabel;
        if (startMonth === endMonth && startYear === endYear) {
          // Same month and year: "02–08 Eyl"
          weekLabel = `${weekStart.getUTCDate().toString().padStart(2, '0')}–${weekEnd.getUTCDate().toString().padStart(2, '0')} ${startMonth}`;
        } else if (startYear === endYear) {
          // Different months, same year: "29 Ağu – 04 Eyl"
          weekLabel = `${weekStart.getUTCDate().toString().padStart(2, '0')} ${startMonth} – ${weekEnd.getUTCDate().toString().padStart(2, '0')} ${endMonth}`;
        } else {
          // Different years: "29 Ara 2024 – 04 Oca 2025"
          weekLabel = `${weekStart.getUTCDate().toString().padStart(2, '0')} ${startMonth} ${startYear} – ${weekEnd.getUTCDate().toString().padStart(2, '0')} ${endMonth} ${endYear}`;
        }
        
        weeks.push({
          date: weekKey,
          dayName: weekLabel,
          totalQuestions,
          correctQuestions,
          wrongQuestions: weekLogs.reduce((sum, log) => sum + (Number(log.wrong_count) || 0), 0),
          successRate: attempted > 0 ? Math.round((correctQuestions / attempted) * 100) : 0
        });
      }
      
      return weeks;
    }
  };


  const dailyWeeklyData = useMemo(() => prepareDailyWeeklyData(), [questionLogs, viewMode, useCustomDates, startDate, endDate]);


  return (
    <div className="space-y-6 mb-8">
      {/* Enhanced Daily/Weekly Questions Chart */}
      <div className="bg-gradient-to-br from-emerald-50/60 via-card to-blue-50/40 dark:from-emerald-950/30 dark:via-card dark:to-blue-950/25 rounded-2xl border-2 border-emerald-200/40 dark:border-emerald-800/40 p-8 relative overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-emerald-500/10 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 via-blue-500 to-emerald-600 rounded-xl shadow-lg">
                <BookOpen className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-700 bg-clip-text text-transparent">
                  📚 {viewMode === 'daily' ? 'Günlük' : 'Haftalık'} Soru Çözüm Analizi
                </h3>
                <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 font-medium">
                  Soru çözme performansı ve gelişim takibi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex border-2 border-emerald-200/50 dark:border-emerald-700/50 rounded-xl p-1 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
                <Button
                  variant={viewMode === 'daily' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('daily')}
                  className={`text-sm px-4 py-2 h-auto font-medium transition-all duration-200 rounded-lg ${
                    viewMode === 'daily'
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg hover:shadow-xl'
                      : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  }`}
                  data-testid="button-daily-view"
                >
                  📅 Günlük
                </Button>
                <Button
                  variant={viewMode === 'weekly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('weekly')}
                  className={`text-sm px-4 py-2 h-auto font-medium transition-all duration-200 rounded-lg ${
                    viewMode === 'weekly'
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg hover:shadow-xl'
                      : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  }`}
                  data-testid="button-weekly-view"
                >
                  🗓️ Haftalık
                </Button>
              </div>

              {/* Date Range Toggle */}
              <Button
                variant={useCustomDates ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUseCustomDates(!useCustomDates)}
                className={`text-sm px-3 py-2 h-auto font-medium transition-all duration-200 ${
                  useCustomDates
                    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                }`}
                data-testid="button-custom-dates"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Tarih Seç
              </Button>

              {!useCustomDates && (
                <div className="text-sm text-muted-foreground bg-emerald-100/60 dark:bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-200/50 dark:border-emerald-700/50 font-medium">
                  {viewMode === 'daily' ? 'Son 14 gün' : 'Son 8 hafta'}
                </div>
              )}
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {useCustomDates && viewMode === 'daily' && (
            <div className="mb-6 p-4 bg-white/30 dark:bg-gray-900/30 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 backdrop-blur-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Başlangıç:</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-sm border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 focus:ring-emerald-500"
                    data-testid="input-start-date"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Bitiş:</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="text-sm border-emerald-200 dark:border-emerald-700 focus:border-emerald-500 focus:ring-emerald-500"
                    data-testid="input-end-date"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const today = new Date();
                    const twoWeeksAgo = new Date();
                    twoWeeksAgo.setDate(today.getDate() - 13);
                    setStartDate(twoWeeksAgo.toISOString().split('T')[0]);
                    setEndDate(today.toISOString().split('T')[0]);
                  }}
                  className="text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                  data-testid="button-reset-dates"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Sıfırla
                </Button>
                <div className="text-sm text-muted-foreground bg-emerald-100/60 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-700/50 font-medium">
                  {(() => {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return `${daysDiff} gün`;
                  })()}
                </div>
              </div>
            </div>
          )}
          
          {dailyWeeklyData.length === 0 || dailyWeeklyData.every(d => d.totalQuestions === 0) ? (
            <div className="text-center py-20 text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <BookOpen className="h-10 w-10 text-emerald-500" />
              </div>
              <h4 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Soru çözüm verisi bulunmuyor</h4>
              <p className="text-sm opacity-75 mb-4">Soru kayıtları ekleyerek analizi görüntüleyin</p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce delay-200"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyWeeklyData} margin={{ top: 20, right: 40, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="currentColor" />
                    <XAxis 
                      dataKey="dayName" 
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      stroke="currentColor"
                      axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                    />
                    <YAxis 
                      yAxisId="questions"
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      stroke="currentColor"
                      axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                      label={{ value: 'Soru Sayısı', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                    />
                    <YAxis 
                      yAxisId="percentage"
                      orientation="right"
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      stroke="currentColor"
                      axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                      domain={[0, 100]}
                      label={{ value: 'Başarı %', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '13px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        padding: '12px'
                      }}
                      formatter={(value: any, name: any) => [
                        name === 'successRate' ? `%${value}` : `${value} soru`,
                        name === 'correctQuestions' ? '✅ Doğru' : 
                        name === 'wrongQuestions' ? '❌ Yanlış' : 
                        name === 'successRate' ? '📈 Başarı Oranı' :
                        name === 'totalQuestions' ? '📊 Toplam' : name
                      ]}
                      labelFormatter={(label) => `📅 ${label}`}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="rect"
                    />
                    
                    {/* Enhanced bars with gradients */}
                    <Bar 
                      yAxisId="questions" 
                      dataKey="correctQuestions" 
                      stackId="a" 
                      fill="url(#correctGradient)" 
                      name="Doğru" 
                      radius={[0, 0, 0, 0]} 
                    />
                    <Bar 
                      yAxisId="questions" 
                      dataKey="wrongQuestions" 
                      stackId="a" 
                      fill="url(#wrongGradient)" 
                      name="Yanlış" 
                      radius={[4, 4, 0, 0]} 
                    />
                    
                    {/* Enhanced success rate line */}
                    <Line 
                      yAxisId="percentage" 
                      type="monotone" 
                      dataKey="successRate" 
                      stroke="url(#successGradient)" 
                      strokeWidth={4} 
                      dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: '#ffffff' }} 
                      activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 3, fill: '#ffffff' }}
                      name="Başarı Oranı (%)" 
                    />
                    
                    {/* Gradient Definitions */}
                    <defs>
                      <linearGradient id="correctGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="wrongGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                    </defs>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* Enhanced Summary Statistics - 2x2 Grid Layout */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t-2 border-emerald-200/30 dark:border-emerald-700/30">
                <div className="text-center bg-white/40 dark:bg-gray-900/40 rounded-xl p-4 backdrop-blur-sm border border-emerald-200/30 dark:border-emerald-700/30 shadow-lg">
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                    {dailyWeeklyData.reduce((sum, d) => sum + d.correctQuestions, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">✅ Toplam Doğru</div>
                  <div className="w-8 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mt-2"></div>
                </div>
                <div className="text-center bg-white/40 dark:bg-gray-900/40 rounded-xl p-4 backdrop-blur-sm border border-red-200/30 dark:border-red-700/30 shadow-lg">
                  <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-1">
                    {dailyWeeklyData.reduce((sum, d) => sum + d.wrongQuestions, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">❌ Toplam Yanlış</div>
                  <div className="w-8 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto mt-2"></div>
                </div>
                <div className="text-center bg-white/40 dark:bg-gray-900/40 rounded-xl p-4 backdrop-blur-sm border border-emerald-200/30 dark:border-emerald-700/30 shadow-lg">
                  <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-1">
                    {dailyWeeklyData.reduce((sum, d) => sum + d.totalQuestions, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">📊 Toplam Soru</div>
                  <div className="w-8 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full mx-auto mt-2"></div>
                </div>
                <div className="text-center bg-white/40 dark:bg-gray-900/40 rounded-xl p-4 backdrop-blur-sm border border-emerald-200/30 dark:border-emerald-700/30 shadow-lg">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                    {Math.round(dailyWeeklyData.reduce((sum, d) => sum + d.successRate, 0) / dailyWeeklyData.filter(d => d.totalQuestions > 0).length) || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">📈 Ortalama Başarı</div>
                  <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto mt-2"></div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}