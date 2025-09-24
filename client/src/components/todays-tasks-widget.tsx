import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { CheckCircle2, Circle, Plus, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function TodaysTasksWidget() {
  const { toast } = useToast();
  
  // Get today's date in YYYY-MM-DD format (locale-safe)
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  const { data: todaysData, isLoading } = useQuery<{
    date: string;
    dayNumber: number;
    daysRemaining: number;
    tasks: Task[];
    tasksCount: number;
  }>({
    queryKey: ["/api/calendar", todayStr],
    queryFn: async () => {
      const response = await fetch(`/api/calendar/${todayStr}`);
      if (!response.ok) throw new Error('Failed to fetch today\'s tasks');
      return response.json();
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: (taskId: string) => 
      apiRequest("PATCH", `/api/tasks/${taskId}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar", todayStr] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Görev güncellendi",
        description: "Görev durumu başarıyla değiştirildi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Görev durumu değiştirilemedi.",
        variant: "destructive",
      });
    },
  });

  const tasks = todaysData?.tasks || [];
  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 transition-colors duration-300 h-full">
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary" />
          Bugün Yapılacaklar
        </h3>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 transition-colors duration-300 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary" />
          Bugün Yapılacaklar
        </h3>
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-full px-3 py-1" data-testid="text-today-counts">
          {completedCount}/{totalCount}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Bugün için görev bulunmuyor</p>
          <p className="text-xs mt-1">Yeni görevler eklemek için Yapılacaklar sayfasına gidin</p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="w-full bg-secondary rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            ></div>
          </div>

          {/* Tasks list */}
          <div className="space-y-3 flex-1 min-h-0 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:bg-muted/50 ${
                  task.completed 
                    ? 'bg-muted/30 border-muted' 
                    : 'bg-background border-border/50 hover:border-border'
                }`}
                style={{
                  borderLeft: `4px solid ${task.color || '#8B5CF6'}`,
                }}
                data-testid={`list-task-${task.id}`}
              >
                <button
                  onClick={() => toggleTaskMutation.mutate(task.id)}
                  className={`flex-shrink-0 transition-colors duration-200 ${
                    task.completed 
                      ? 'text-primary hover:text-primary/80' 
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                  disabled={toggleTaskMutation.isPending}
                  data-testid={`button-toggle-task-${task.id}`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm transition-all duration-200 ${
                    task.completed 
                      ? 'line-through text-muted-foreground' 
                      : 'text-foreground'
                  }`}>
                    {task.title}
                  </div>
                  
                  {task.description && (
                    <div className={`text-xs mt-1 transition-all duration-200 ${
                      task.completed 
                        ? 'line-through text-muted-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {task.description.length > 80 
                        ? `${task.description.substring(0, 80)}...` 
                        : task.description}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'high' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </span>
                    
                    <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-1">
                      {task.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {tasks.length > 0 && (
            <div className="mt-auto pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground text-center">
                {completedCount === totalCount 
                  ? "🎉 Tüm günlük görevler tamamlandı!" 
                  : `${totalCount - completedCount} görev kaldı`
                }
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}