import { useQuery } from "@tanstack/react-query";
import { TrendingUp, BarChart3, Calendar } from "lucide-react";

interface DaySummary {
  date: string;
  tasksCompleted: number;
  totalTasks: number;
  moods: any[];
  productivity: number;
}

export function WeeklyProgressChart() {
  const { data: summaryData = [], isLoading } = useQuery<DaySummary[]>({
    queryKey: ["/api/summary/daily", { range: 7 }],
    queryFn: () => fetch("/api/summary/daily?range=7").then(res => res.json()),
  });

  const formatDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    return dayNames[date.getDay()];
  };

  const getBarHeight = (tasksCompleted: number, maxTasks: number) => {
    if (maxTasks === 0) return 0;
    // Ensure minimum visible height for any completed tasks
    return Math.max((tasksCompleted / maxTasks) * 100, tasksCompleted > 0 ? 15 : 0);
  };

  const getBarColor = (productivity: number) => {
    if (productivity >= 80) return '#10b981'; // Green
    if (productivity >= 60) return '#f59e0b'; // Yellow
    if (productivity >= 40) return '#f97316'; // Orange
    if (productivity > 0) return '#ef4444';   // Red
    return '#6b7280'; // Gray
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 transition-colors duration-300">
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          Haftalık İlerleme
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const reversedData = [...summaryData].reverse(); // Show oldest to newest (left to right)
  const maxTasks = Math.max(...reversedData.map(day => day.tasksCompleted), 1);
  const totalTasksCompleted = reversedData.reduce((sum, day) => sum + day.tasksCompleted, 0);
  const averageProductivity = reversedData.length > 0 
    ? Math.round(reversedData.reduce((sum, day) => sum + day.productivity, 0) / reversedData.length)
    : 0;

  return (
    <div className="bg-card rounded-xl border border-border p-4 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          Haftalık İlerleme
        </h3>
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
          Son 7 Gün
        </div>
      </div>

      {/* Summary Stats - Compact */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-muted/10 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Toplam</div>
          <div className="text-lg font-bold text-foreground" data-testid="total-tasks-completed">{totalTasksCompleted}</div>
        </div>
        <div className="text-center p-3 bg-muted/10 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Verimlilik</div>
          <div className="text-lg font-bold text-foreground" data-testid="average-productivity">{averageProductivity}%</div>
        </div>
        <div className="text-center p-3 bg-muted/10 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Aktif</div>
          <div className="text-lg font-bold text-foreground">{reversedData.filter(day => day.tasksCompleted > 0).length}/7</div>
        </div>
      </div>


      {/* Chart */}
      <div className="space-y-2" data-testid="progress-chart">
        {reversedData.length === 0 || (totalTasksCompleted === 0 && averageProductivity === 0) ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Henüz veri bulunmuyor</p>
            <p className="text-xs mt-1">Görev tamamlayarak ilerlemenizi takip edin</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reversedData.map((day, index) => {
              const barWidth = Math.max((day.tasksCompleted / Math.max(maxTasks, 1)) * 100, day.tasksCompleted > 0 ? 15 : 0);
              const barColor = getBarColor(day.productivity);
              
              return (
                <div key={day.date} className="flex items-center gap-3" data-testid={`progress-bar-${index}`}>
                  {/* Day label */}
                  <div className="text-sm font-medium text-foreground w-10">
                    {formatDayName(day.date)}
                  </div>
                  
                  {/* Horizontal Bar */}
                  <div className="flex-1 relative">
                    <div className="h-6 bg-muted/30 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: barColor,
                        }}
                      >
                        {day.tasksCompleted > 0 && (
                          <span className="text-xs font-medium text-white">
                            {day.tasksCompleted}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Productivity */}
                  <div className="text-xs text-muted-foreground w-12 text-right">
                    {day.productivity}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend - Compact */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Mükemmel</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-muted-foreground">İyi</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-muted-foreground">Orta</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-muted-foreground">Zayıf</span>
          </div>
        </div>
      </div>
    </div>
  );
}