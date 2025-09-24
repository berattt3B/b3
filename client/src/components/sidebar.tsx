import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";

export function Sidebar() {
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const workTasks = tasks.filter(task => task.category === "work").length;
  const personalTasks = tasks.filter(task => task.category === "personal").length;
  const shoppingTasks = tasks.filter(task => task.category === "shopping").length;

  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const currentWeekday = currentDate.toLocaleDateString("tr-TR", { weekday: "long" });

  // Generate calendar days for current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const calendarDays = [];
  for (let i = 0; i < 35; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    calendarDays.push(date);
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="bg-card rounded-lg border border-border p-6 transition-colors duration-300">
        <h3 className="text-lg font-semibold text-foreground mb-4">Dashboard</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Toplam Görev</span>
            <span className="font-semibold text-foreground" data-testid="text-total-tasks">{totalTasks}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Tamamlanan</span>
            <span className="font-semibold text-green-600" data-testid="text-completed-tasks">{completedTasks}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Bekleyen</span>
            <span className="font-semibold text-orange-600" data-testid="text-pending-tasks">{pendingTasks}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground">%{completionPercentage} tamamlandı</p>
        </div>
      </div>

      {/* Calendar Widget */}
      <div className="bg-card rounded-lg border border-border p-6 transition-colors duration-300">
        <h3 className="text-lg font-semibold text-foreground mb-4">Takvim</h3>
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-foreground" data-testid="text-current-day">{currentDay}</div>
          <div className="text-sm text-muted-foreground" data-testid="text-current-date">{currentMonth}</div>
          <div className="text-xs text-muted-foreground" data-testid="text-current-weekday">{currentWeekday}</div>
        </div>
        {/* Mini Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-xs">
          <div className="text-center text-muted-foreground p-1">P</div>
          <div className="text-center text-muted-foreground p-1">S</div>
          <div className="text-center text-muted-foreground p-1">Ç</div>
          <div className="text-center text-muted-foreground p-1">P</div>
          <div className="text-center text-muted-foreground p-1">C</div>
          <div className="text-center text-muted-foreground p-1">C</div>
          <div className="text-center text-muted-foreground p-1">P</div>
          {calendarDays.slice(0, 28).map((date, index) => {
            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.getDate() === currentDay && isCurrentMonth;
            
            return (
              <div
                key={index}
                className={`text-center p-1 ${
                  isToday
                    ? "bg-primary text-primary-foreground rounded"
                    : isCurrentMonth
                    ? "hover:bg-secondary rounded cursor-pointer"
                    : "text-muted-foreground/50"
                }`}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card rounded-lg border border-border p-6 transition-colors duration-300">
        <h3 className="text-lg font-semibold text-foreground mb-4">Kategoriler</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 hover:bg-secondary rounded-lg cursor-pointer transition-colors">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-foreground">İş</span>
            </div>
            <span className="text-xs text-muted-foreground" data-testid="text-work-tasks">{workTasks}</span>
          </div>
          <div className="flex items-center justify-between p-2 hover:bg-secondary rounded-lg cursor-pointer transition-colors">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-foreground">Kişisel</span>
            </div>
            <span className="text-xs text-muted-foreground" data-testid="text-personal-tasks">{personalTasks}</span>
          </div>
          <div className="flex items-center justify-between p-2 hover:bg-secondary rounded-lg cursor-pointer transition-colors">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-foreground">Alışveriş</span>
            </div>
            <span className="text-xs text-muted-foreground" data-testid="text-shopping-tasks">{shoppingTasks}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
