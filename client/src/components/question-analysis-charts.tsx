import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Line, ComposedChart } from "recharts";
import { BookOpen, TrendingUp, Calendar, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionLog } from "@shared/schema";

export function QuestionAnalysisCharts() {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  
  const { data: questionLogs = [] } = useQuery<QuestionLog[]>({
    queryKey: ["/api/question-logs"],
  });

  // Prepare daily/weekly questions chart data
  const prepareDailyWeeklyData = () => {
    if (questionLogs.length === 0) return [];

    if (viewMode === 'daily') {
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (13 - i));
        return date.toISOString().split('T')[0];
      });

      return last14Days.map(dateStr => {
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

  // Prepare topic success rate data
  const prepareTopicSuccessData = () => {
    if (questionLogs.length === 0) return [];

    const subjectStats: { [key: string]: { correct: number; wrong: number; blank: number } } = {};
    
    questionLogs.forEach(log => {
      if (!subjectStats[log.subject]) {
        subjectStats[log.subject] = { correct: 0, wrong: 0, blank: 0 };
      }
      
      subjectStats[log.subject].correct += Number(log.correct_count) || 0;
      subjectStats[log.subject].wrong += Number(log.wrong_count) || 0;
      subjectStats[log.subject].blank += Number(log.blank_count) || 0;
    });

    return Object.entries(subjectStats)
      .map(([subject, stats]) => {
        const attempted = stats.correct + stats.wrong;
        const total = attempted + stats.blank;
        return {
          subject,
          attempted,
          total,
          successRate: attempted > 0 ? Math.round((stats.correct / attempted) * 100) : 0,
          correct: stats.correct,
          wrong: stats.wrong,
          blank: stats.blank
        };
      })
      .filter(item => item.attempted >= 5) // Only show subjects with at least 5 attempted questions
      .sort((a, b) => b.successRate - a.successRate);
  };

  // Prepare heatmap data for daily question solving (last 90 days)
  const prepareHeatmapData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = questionLogs.filter(log => log.study_date === dateStr);
      const totalQuestions = dayLogs.reduce((sum, log) => 
        sum + (Number(log.correct_count) || 0) + (Number(log.wrong_count) || 0) + (Number(log.blank_count) || 0), 0
      );
      
      data.push({
        date: dateStr,
        day: date.getDate(),
        month: date.getMonth(),
        weekday: date.getDay(),
        intensity: Math.min(totalQuestions / 50, 1), // Normalize to max 50 questions
        count: totalQuestions
      });
    }
    
    return data;
  };

  const dailyWeeklyData = useMemo(() => prepareDailyWeeklyData(), [questionLogs, viewMode]);
  const topicSuccessData = useMemo(() => prepareTopicSuccessData(), [questionLogs]);
  const heatmapData = useMemo(() => prepareHeatmapData(), [questionLogs]);

  // Colors for pie chart
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 mb-8">
      {/* Daily/Weekly Questions Chart */}
      <div className="bg-card rounded-xl border border-border p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-green-600" />
              <h3 className="text-lg font-semibold text-foreground">
                {viewMode === 'daily' ? 'Günlük' : 'Haftalık'} Soru Çözüm Analizi
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === 'daily' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('daily')}
                  className="text-xs px-3 py-1.5 h-auto"
                  data-testid="button-daily-view"
                >
                  Günlük
                </Button>
                <Button
                  variant={viewMode === 'weekly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('weekly')}
                  className="text-xs px-3 py-1.5 h-auto"
                  data-testid="button-weekly-view"
                >
                  Haftalık
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {viewMode === 'daily' ? 'Son 14 gün' : 'Son 8 hafta'}
              </div>
            </div>
          </div>
          
          {dailyWeeklyData.length === 0 || dailyWeeklyData.every(d => d.totalQuestions === 0) ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Soru çözüm verisi bulunmuyor</p>
              <p className="text-xs mt-1">Soru kayıtları ekleyerek analizi görüntüleyin</p>
            </div>
          ) : (
            <>
              <div className="h-80 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyWeeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="dayName" 
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                    />
                    <YAxis 
                      yAxisId="questions"
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                    />
                    <YAxis 
                      yAxisId="percentage"
                      orientation="right"
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value, name) => [
                        name === 'successRate' ? `${value}%` : value,
                        name === 'correctQuestions' ? 'Doğru' : 
                        name === 'wrongQuestions' ? 'Yanlış' : 
                        name === 'successRate' ? 'Başarı Oranı' :
                        name === 'totalQuestions' ? 'Toplam' : name
                      ]}
                    />
                    <Legend />
                    <Bar yAxisId="questions" dataKey="correctQuestions" stackId="a" fill="#10b981" name="Doğru" radius={[0, 0, 0, 0]} />
                    <Bar yAxisId="questions" dataKey="wrongQuestions" stackId="a" fill="#ef4444" name="Yanlış" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="percentage" type="monotone" dataKey="successRate" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6" }} name="Başarı Oranı (%)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-border">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {dailyWeeklyData.reduce((sum, d) => sum + d.correctQuestions, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Toplam Doğru</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {dailyWeeklyData.reduce((sum, d) => sum + d.totalQuestions, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Toplam Soru</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {Math.round(dailyWeeklyData.reduce((sum, d) => sum + d.successRate, 0) / dailyWeeklyData.filter(d => d.totalQuestions > 0).length) || 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Ortalama Başarı</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Topic Success Rate Chart */}
        <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-xl border border-border shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center">
            <Target className="h-6 w-6 mr-3 text-amber-500" />
            📊 Ders Başarı Oranları
          </h3>
          {topicSuccessData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Henüz yeterli veri yok</p>
              <p className="text-xs mt-1">En az 5 soru çözülen dersler gösterilir</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topicSuccessData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ subject, successRate }) => `${subject}: ${successRate}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="successRate"
                  >
                    {topicSuccessData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value, name, props) => [
                      `${value}%`,
                      `Başarı: ${props.payload.correct}/${props.payload.attempted}`
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Daily Question Heatmap */}
        <div className="bg-gradient-to-br from-card via-card to-card/80 rounded-xl border border-border shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center">
            <Calendar className="h-6 w-6 mr-3 text-green-500" />
            🔥 Çalışma Heatmap
          </h3>
          {heatmapData.length === 0 || heatmapData.every(d => d.count === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Henüz yeterli veri yok</p>
              <p className="text-xs mt-1">Son 90 günlük aktivite haritası</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Heatmap Grid - Github style */}
              <div className="grid grid-cols-15 gap-1 text-xs" data-testid="heatmap-grid">
                {heatmapData.map((day, index) => {
                  const intensity = day.intensity;
                  const bgColor = 
                    intensity === 0 ? 'bg-muted/20' :
                    intensity <= 0.2 ? 'bg-green-200/60' :
                    intensity <= 0.4 ? 'bg-green-300/70' :
                    intensity <= 0.6 ? 'bg-green-400/80' :
                    intensity <= 0.8 ? 'bg-green-500/90' :
                    'bg-green-600';
                  
                  return (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-sm ${bgColor} hover:scale-125 transition-all duration-200 cursor-pointer`}
                      title={`${day.date}: ${day.count} soru`}
                      data-testid={`heatmap-cell-${day.date}`}
                    />
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Az</span>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-sm bg-muted/20"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-200/60"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-300/70"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-400/80"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-500/90"></div>
                  <div className="w-3 h-3 rounded-sm bg-green-600"></div>
                </div>
                <span>Çok</span>
              </div>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {heatmapData.filter(d => d.count > 0).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Aktif Gün</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {heatmapData.reduce((sum, d) => sum + d.count, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Toplam Soru</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round(heatmapData.reduce((sum, d) => sum + d.count, 0) / 90)}
                  </div>
                  <div className="text-xs text-muted-foreground">Günlük Ort.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}