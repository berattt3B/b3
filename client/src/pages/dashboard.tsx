import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Link, useLocation } from "wouter";
import { TrendingUp, BarChart3, Target, Brain, BookOpen, Plus, CalendarDays, X, FlaskConical, Trash2, AlertTriangle, Sparkles, Award, Clock, Zap, Edit, Search, Tag, BookX, Lightbulb, Eye } from "lucide-react";
import { Task, Goal, QuestionLog, InsertQuestionLog, ExamResult, InsertExamResult } from "@shared/schema";
import { DashboardSummaryCards } from "@/components/dashboard-summary-cards";
import { AdvancedCharts } from "@/components/advanced-charts";
import { QuestionAnalysisCharts } from "@/components/question-analysis-charts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailySummary {
  date: string;
  tasksCompleted: number;
  totalTasks: number;
  moods: any[];
  productivity: number;
}

interface TopicStats {
  topic: string;
  wrongMentions: number;
  totalSessions: number;
  mentionFrequency: number;
}

interface PriorityTopic {
  topic: string;
  priority: number;
  lastSeen: string;
  improvementNeeded: boolean;
}

export default function Dashboard() {
  const [location] = useLocation();
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestionLog, setEditingQuestionLog] = useState<QuestionLog | null>(null);
  const [newQuestion, setNewQuestion] = useState({ 
    exam_type: "TYT", 
    subject: "Türkçe", 
    correct_count: "", 
    wrong_count: "", 
    blank_count: "", 
    study_date: new Date().toISOString().split('T')[0],
    wrong_topics: [] as Array<{
      topic: string;
      difficulty: 'kolay' | 'orta' | 'zor';
      category: 'kavram' | 'hesaplama' | 'analiz' | 'dikkatsizlik';
      notes?: string;
    }>,
    time_spent_minutes: ""
  });
  const [wrongTopicInput, setWrongTopicInput] = useState("");
  const [selectedTopicDifficulty, setSelectedTopicDifficulty] = useState<'kolay' | 'orta' | 'zor'>('orta');
  const [selectedTopicCategory, setSelectedTopicCategory] = useState<'kavram' | 'hesaplama' | 'analiz' | 'dikkatsizlik'>('kavram');
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [newExamResult, setNewExamResult] = useState({ 
    exam_name: "", 
    exam_date: new Date().toISOString().split('T')[0], 
    exam_type: "TYT" as "TYT" | "AYT",
    subjects: {
      turkce: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
      matematik: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
      sosyal: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
      fen: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
      fizik: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
      kimya: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
      biyoloji: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] }
    }
  });
  const [currentWrongTopics, setCurrentWrongTopics] = useState<{[key: string]: string}>({});
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<{
    date: string;
    count: number;
    questionCount: number;
    taskCount: number;
    intensity: number;
    dayActivities: {
      questions: any[];
      tasks: any[];
      exams: any[];
    };
  } | null>(null);

  // Delete all mutations
  const deleteAllQuestionLogsMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/question-logs/all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/question-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics/priority"] });
      toast({ title: "🗑️ Tüm soru kayıtları silindi", description: "Tüm soru çözüm kayıtlarınız başarıyla silindi." });
    },
    onError: () => {
      toast({ title: "❌ Hata", description: "Soru kayıtları silinemedi.", variant: "destructive" });
    },
  });

  const deleteAllExamResultsMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/exam-results/all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exam-subject-nets"] });
      toast({ title: "🗑️ Tüm denemeler silindi", description: "Tüm deneme sınav sonuçlarınız başarıyla silindi." });
    },
    onError: () => {
      toast({ title: "❌ Hata", description: "Denemeler silinemedi.", variant: "destructive" });
    },
  });
  const { toast } = useToast();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: dailySummary = [] } = useQuery<DailySummary[]>({
    queryKey: ["/api/summary/daily"],
  });
  
  const { data: questionLogs = [] } = useQuery<QuestionLog[]>({
    queryKey: ["/api/question-logs"],
  });
  
  const { data: examResults = [] } = useQuery<ExamResult[]>({
    queryKey: ["/api/exam-results"],
  });

  const { data: topicStats = [] } = useQuery<TopicStats[]>({
    queryKey: ["/api/topics/stats"],
  });

  const { data: priorityTopics = [] } = useQuery<PriorityTopic[]>({
    queryKey: ["/api/topics/priority"],
  });

  const createQuestionLogMutation = useMutation({
    mutationFn: (data: InsertQuestionLog) => apiRequest("POST", "/api/question-logs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/question-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics/priority"] });
      toast({ title: "✅ Soru kaydı eklendi", description: "Soru çözüm kaydınız eklendi ve analiz güncellendi!" });
      setShowQuestionDialog(false);
      setNewQuestion({ 
        exam_type: "TYT", 
        subject: "Türkçe", 
        correct_count: "", 
        wrong_count: "", 
        blank_count: "", 
        study_date: new Date().toISOString().split('T')[0],
        wrong_topics: [],
        time_spent_minutes: ""
      });
      setWrongTopicInput("");
    },
    onError: () => {
      toast({ title: "❌ Hata", description: "Soru kaydı eklenemedi.", variant: "destructive" });
    },
  });

  const deleteQuestionLogMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/question-logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/question-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics/priority"] });
      toast({ title: "🗑️ Soru kaydı silindi", description: "Soru çözüm kaydınız başarıyla silindi." });
    },
    onError: () => {
      toast({ title: "❌ Hata", description: "Soru kaydı silinemedi.", variant: "destructive" });
    },
  });

  const updateQuestionLogMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertQuestionLog> }) => 
      apiRequest("PUT", `/api/question-logs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/question-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics/priority"] });
      setEditingQuestionLog(null);
      setShowQuestionDialog(false);
      toast({ title: "📝 Soru kaydı güncellendi", description: "Soru çözüm kaydınız başarıyla güncellendi." });
    },
    onError: () => {
      toast({ title: "❌ Hata", description: "Soru kaydı güncellenemedi.", variant: "destructive" });
    },
  });
  
  const createExamResultMutation = useMutation({
    mutationFn: (data: InsertExamResult) => apiRequest("POST", "/api/exam-results", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exam-subject-nets"] });
      toast({ title: "Deneme sonucu eklendi", description: "Deneme sınav sonucunuz kaydedildi." });
      setShowExamDialog(false);
      setNewExamResult({ 
        exam_name: "", 
        exam_date: new Date().toISOString().split('T')[0], 
        exam_type: "TYT" as "TYT" | "AYT",
        subjects: {
          turkce: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
          matematik: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
          sosyal: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
          fen: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
          fizik: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
          kimya: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
          biyoloji: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] }
        }
      });
      setCurrentWrongTopics({}); // Clear all wrong topics input fields
    },
    onError: () => {
      toast({ title: "Hata", description: "Deneme sonucu eklenemedi.", variant: "destructive" });
    },
  });
  
  const deleteExamResultMutation = useMutation({
    mutationFn: (examId: string) => apiRequest("DELETE", `/api/exam-results/${examId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exam-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exam-subject-nets"] });
      toast({ title: "Deneme sonucu silindi", description: "Deneme sınav sonucunuz başarıyla silindi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Deneme sonucu silinemedi.", variant: "destructive" });
    },
  });

  // Subject options based on TYT/AYT
  const getSubjectOptions = (examType: string) => {
    if (examType === "TYT") {
      return ["Türkçe", "Sosyal Bilimler", "Matematik", "Fizik", "Kimya", "Biyoloji"];
    } else {
      return ["Matematik", "Fizik", "Kimya", "Biyoloji"];
    }
  };

  // Generate yearly heatmap data from January to current date
  const generateYearlyHeatmapData = () => {
    const data = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Start from January 1st of current year
    const startDate = new Date(currentYear, 0, 1); // January 1st
    
    // Generate data from January 1st to today (inclusive)
    const currentDate = new Date(startDate);
    const todayDateStr = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    
    // Continue until we've included today
    while (currentDate.toISOString().split('T')[0] <= todayDateStr) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Calculate activity intensity for this day
      const dayQuestions = questionLogs.filter(log => log.study_date === dateStr);
      const dayTasks = tasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
        return completedDate === dateStr;
      });
      
      const studyIntensity = Math.min((dayQuestions.length * 2 + dayTasks.length) / 10, 1);
      
      // Check if this is today - Fixed comparison
      const isToday = dateStr === todayDateStr;
      
      data.push({
        date: dateStr,
        day: currentDate.getDate(),
        month: currentDate.getMonth(),
        dayOfWeek: currentDate.getDay(), // 0 = Sunday, 1 = Monday, etc.
        dayOfWeekISO: currentDate.getDay() === 0 ? 7 : currentDate.getDay(), // 1 = Monday, 7 = Sunday
        intensity: studyIntensity,
        count: dayQuestions.length + dayTasks.length,
        questionCount: dayQuestions.length,
        taskCount: dayTasks.length,
        isToday: isToday
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  };

  // Organize heatmap data into weeks for proper grid display (Monday to Sunday)
  const organizeHeatmapIntoWeeks = (data: any[]) => {
    const weeks = [];
    
    if (data.length === 0) return weeks;
    
    // Create a map for fast lookup by date
    const dateMap = new Map();
    data.forEach(day => {
      dateMap.set(day.date, day);
    });
    
    // Find the first date and calculate the Monday of that week
    const firstDate = new Date(data[0].date);
    const firstDayOfWeek = firstDate.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysToMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Calculate days back to Monday
    
    // Start from the Monday of the first week
    const startDate = new Date(firstDate);
    startDate.setDate(firstDate.getDate() - daysToMonday);
    
    // Find the last date and calculate the Sunday of that week
    const lastDate = new Date(data[data.length - 1].date);
    const lastDayOfWeek = lastDate.getDay();
    const daysToSunday = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek; // Calculate days forward to Sunday
    
    const endDate = new Date(lastDate);
    endDate.setDate(lastDate.getDate() + daysToSunday);
    
    // Generate weeks from start Monday to end Sunday
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const week = [];
      
      // Generate 7 days for this week (Monday to Sunday)
      for (let i = 0; i < 7; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayData = dateMap.get(dateStr);
        
        week.push(dayData || null);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push(week);
    }
    
    return weeks;
  };

  const yearlyHeatmapData = generateYearlyHeatmapData();
  const heatmapWeeks = organizeHeatmapIntoWeeks(yearlyHeatmapData);

  // Handle heatmap day click to show details
  const handleHeatmapDayClick = (day: any) => {
    const dayQuestions = questionLogs.filter(log => log.study_date === day.date);
    const dayTasks = tasks.filter(task => {
      if (!task.completedAt) return false;
      const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
      return completedDate === day.date;
    });
    const dayExams = examResults.filter(exam => exam.exam_date === day.date);
    
    setSelectedHeatmapDay({
      ...day,
      dayActivities: {
        questions: dayQuestions,
        tasks: dayTasks,
        exams: dayExams
      }
    });
  };


  // Recent activities (last 10 items combined)
  const recentActivities = [
    ...questionLogs.slice(0, 5).map(log => ({
      type: 'question',
      title: `${log.exam_type} ${log.subject} - ${log.correct_count} doğru`,
      date: log.study_date,
      icon: Brain
    })),
    ...examResults.slice(0, 5).map(exam => ({
      type: 'exam',
      title: `${exam.exam_name} - TYT: ${exam.tyt_net}`,
      date: exam.exam_date,
      icon: BarChart3
    })),
    ...tasks.filter(t => t.completed).slice(0, 5).map(task => ({
      type: 'task',
      title: task.title,
      date: task.createdAt || new Date().toISOString(),
      icon: Target
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Header />
      
      {/* Centered Navigation */}
      <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center space-x-6">
          <Link href="/">
            <button 
              className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
                location === '/' 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'bg-secondary text-secondary-foreground hover:bg-accent hover:scale-105'
              }`}
              data-testid="link-homepage"
            >
              Anasayfa
            </button>
          </Link>
          <Link href="/tasks">
            <button 
              className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
                location === '/tasks' 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'bg-secondary text-secondary-foreground hover:bg-accent hover:scale-105'
              }`}
              data-testid="link-todos"
            >
              Yapılacaklar
            </button>
          </Link>
          <Link href="/dashboard">
            <button 
              className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
                location === '/dashboard' 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'bg-secondary text-secondary-foreground hover:bg-accent hover:scale-105'
              }`}
              data-testid="link-dashboard"
            >
              Raporlarım
            </button>
          </Link>
          <Link href="/net-calculator">
            <button 
              className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
                location === '/net-calculator' 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'bg-secondary text-secondary-foreground hover:bg-accent hover:scale-105'
              }`}
            >
              Net Hesapla
            </button>
          </Link>
          <Link href="/timer">
            <button 
              className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-200 ${
                location === '/timer' 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'bg-secondary text-secondary-foreground hover:bg-accent hover:scale-105'
              }`}
              data-testid="link-timer"
            >
              Sayaç
            </button>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Modern Dashboard Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
            📊 Raporlarım
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
          </h1>
          <p className="text-lg text-muted-foreground">Çalışma verilerinizin kapsamlı analizi ve kişiselleştirilmiş öneriler</p>
        </div>

        {/* Summary Cards */}
        <DashboardSummaryCards />
        
        {/* Monthly Study Heatmap */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-purple-50/50 via-card to-indigo-50/50 dark:from-purple-950/30 dark:via-card dark:to-indigo-950/30 backdrop-blur-sm border-2 border-purple-200/30 dark:border-purple-800/30 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-t-lg border-b border-purple-200/30">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-purple-500" />
                📈 Aylık Çalışma Heatmap
              </CardTitle>
              <p className="text-sm text-purple-600/70 dark:text-purple-400/70 font-medium">Ocak-Eylül 2025 çalışma yoğunluğu - Bugünkü tarih parlayan kutu</p>
            </CardHeader>
            <CardContent className="pt-6">
              {/* GitHub-style yearly contribution graph */}
              <div className="flex justify-center">
                <div className="inline-block min-w-0">
                  {/* Month labels */}
                  <div className="flex mb-2 relative">
                    <div className="w-8"></div> {/* Space for day labels */}
                    <div className="flex gap-1 relative" style={{ width: `${heatmapWeeks.length * 21}px` }}>
                      {(() => {
                        const monthNames = [
                          'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                          'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
                        ];
                        const currentMonth = new Date().getMonth();
                        const monthLabels = [];
                        
                        // Calculate which weeks each month spans
                        const monthWeekMap = new Map();
                        
                        heatmapWeeks.forEach((week, weekIndex) => {
                          week.forEach(day => {
                            if (day && day.month !== undefined) {
                              const monthKey = day.month;
                              if (!monthWeekMap.has(monthKey)) {
                                monthWeekMap.set(monthKey, { start: weekIndex, end: weekIndex });
                              } else {
                                monthWeekMap.get(monthKey).end = weekIndex;
                              }
                            }
                          });
                        });
                        
                        // Generate centered month labels
                        monthWeekMap.forEach((range, monthIndex) => {
                          const startWeek = range.start;
                          const endWeek = range.end;
                          const centerWeek = Math.floor((startWeek + endWeek) / 2);
                          const leftPosition = centerWeek * 21; // 20px width + 1px gap
                          const isCurrentMonth = monthIndex === currentMonth;
                          
                          monthLabels.push(
                            <div 
                              key={`month-${monthIndex}`} 
                              className={`absolute text-xs font-medium ${isCurrentMonth ? 'text-purple-700 dark:text-purple-300 font-bold' : 'text-muted-foreground'}`}
                              style={{ 
                                left: `${leftPosition}px`, 
                                transform: 'translateX(-50%)',
                                minWidth: 'fit-content',
                                textAlign: 'center'
                              }}
                            >
                              {monthNames[monthIndex]} {isCurrentMonth ? '⭐' : ''}
                            </div>
                          );
                        });
                        
                        return monthLabels;
                      })()}
                    </div>
                  </div>
                
                {/* Heatmap grid */}
                <div className="flex">
                  {/* Day labels */}
                  <div className="flex flex-col justify-between mr-3" style={{ height: '147px' }}>
                    <div className="text-xs text-muted-foreground h-5 flex items-center">Pzt</div>
                    <div className="text-xs text-transparent h-5">Sal</div>
                    <div className="text-xs text-muted-foreground h-5 flex items-center">Çar</div>
                    <div className="text-xs text-transparent h-5">Per</div>
                    <div className="text-xs text-muted-foreground h-5 flex items-center">Cum</div>
                    <div className="text-xs text-transparent h-5">Cmt</div>
                    <div className="text-xs text-muted-foreground h-5 flex items-center">Paz</div>
                  </div>
                  
                  {/* Weeks grid */}
                  <div className="flex gap-1">
                    {heatmapWeeks.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {week.map((day, dayIndex) => {
                          if (!day) {
                            return (
                              <div
                                key={dayIndex}
                                className="w-5 h-5 rounded-md bg-transparent"
                              />
                            );
                          }
                          
                          const opacity = day.intensity === 0 ? 0.1 : Math.max(0.2, day.intensity);
                          return (
                            <div
                              key={dayIndex}
                              className={`w-5 h-5 rounded-md border transition-all duration-200 hover:brightness-110 hover:shadow-md cursor-pointer relative ${
                                day.isToday 
                                  ? 'border-2 border-purple-400 dark:border-purple-300 shadow-lg shadow-purple-300 dark:shadow-purple-800 ring-2 ring-purple-200 dark:ring-purple-700' 
                                  : day.intensity === 0 
                                    ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700' 
                                    : 'border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500'
                              }`}
                              style={{
                                backgroundColor: day.isToday 
                                  ? (day.intensity > 0 ? `rgba(147, 51, 234, 0.9)` : `rgba(147, 51, 234, 0.4)`)
                                  : day.intensity > 0 ? `rgba(147, 51, 234, ${opacity})` : undefined,
                                animation: day.isToday ? 'breathing 1.8s ease-in-out infinite' : undefined,
                                boxShadow: day.isToday ? '0 0 20px rgba(147, 51, 234, 0.6)' : undefined
                              }}
                              title={`${day.date}${day.isToday ? ' (BUGÜN)' : ''}: ${day.count} aktivite (${day.questionCount} soru, ${day.taskCount} görev)`}
                              onClick={() => handleHeatmapDayClick(day)}
                            >
                              {day.isToday && (
                                <>
                                  <div className="absolute inset-0 rounded-md bg-white dark:bg-purple-300 opacity-40 animate-ping pointer-events-none"></div>
                                  <div className="absolute inset-0 rounded-md bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                                  <div className="absolute top-0 right-0 w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-between mt-6 text-xs text-muted-foreground">
                <span>Az</span>
                <div className="flex gap-1 items-center">
                  <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                  <div className="w-3 h-3 bg-purple-200 dark:bg-purple-900 rounded-sm"></div>
                  <div className="w-3 h-3 bg-purple-400 dark:bg-purple-700 rounded-sm"></div>
                  <div className="w-3 h-3 bg-purple-600 dark:bg-purple-500 rounded-sm"></div>
                  <div className="w-3 h-3 bg-purple-800 dark:bg-purple-300 rounded-sm"></div>
                </div>
                <span>Çok</span>
              </div>
            </CardContent>
          </Card>
        </div>
        

        {/* Solved Questions Count Section with CRUD */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50/50 via-card to-emerald-50/50 dark:from-green-950/30 dark:via-card dark:to-emerald-950/30 backdrop-blur-sm border-2 border-green-200/30 dark:border-green-800/30 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-t-lg border-b border-green-200/30">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                  📊 Çözülen Soru Sayısı
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowQuestionDialog(true)}
                    size="sm" 
                    variant="outline"
                    className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Soru Ekle
                  </Button>
                  {questionLogs.length > 0 && (
                    <Button 
                      onClick={() => {
                        if (window.confirm("Tüm soru kayıtlarını silmek istediğinizden emin misiniz?")) {
                          deleteAllQuestionLogsMutation.mutate();
                        }
                      }}
                      size="sm" 
                      variant="outline"
                      className="text-xs border-red-300 text-red-700 hover:bg-red-50"
                      disabled={deleteAllQuestionLogsMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {deleteAllQuestionLogsMutation.isPending ? 'Siliniyor...' : 'Tüm Soruları Sil'}
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {questionLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <h3 className="font-medium mb-1">Henüz soru kaydı yok</h3>
                  <p className="text-sm">Çözdüğünüz soruları kaydetmeye başlayın - istatistiklerinizi görmek için! 📊</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50">
                      <div className="text-2xl font-bold text-green-600">
                        {questionLogs.reduce((total, log) => total + parseInt(log.correct_count), 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Toplam Doğru</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-red-100/50 to-pink-100/50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl border border-red-200/50">
                      <div className="text-2xl font-bold text-red-600">
                        {questionLogs.reduce((total, log) => total + parseInt(log.wrong_count), 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Toplam Yanlış</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-yellow-100/50 to-amber-100/50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200/50">
                      <div className="text-2xl font-bold text-yellow-600">
                        {questionLogs.reduce((total, log) => total + parseInt(log.blank_count || '0'), 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Toplam Boş</div>
                    </div>
                  </div>

                  {/* Question Logs List with Edit/Delete */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {questionLogs.slice(0, 10).map((log, index) => (
                      <div key={log.id} className="p-4 bg-gradient-to-r from-green-100/30 to-emerald-100/30 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 transition-all hover:scale-102 hover:shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {log.exam_type} - {log.subject}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(log.study_date).toLocaleDateString('tr-TR')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => deleteQuestionLogMutation.mutate(log.id)}
                              disabled={deleteQuestionLogMutation.isPending}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Soru kaydını sil"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                            <div className="font-bold text-green-600">{log.correct_count}</div>
                            <div className="text-xs text-muted-foreground">Doğru</div>
                          </div>
                          <div className="text-center p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                            <div className="font-bold text-red-600">{log.wrong_count}</div>
                            <div className="text-xs text-muted-foreground">Yanlış</div>
                          </div>
                          <div className="text-center p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                            <div className="font-bold text-yellow-600">{log.blank_count || '0'}</div>
                            <div className="text-xs text-muted-foreground">Boş</div>
                          </div>
                        </div>
                        {log.wrong_topics && log.wrong_topics.length > 0 && (
                          <div className="mt-2 text-xs text-red-600">
                            <span className="font-medium">Yanlış Konular:</span> {log.wrong_topics.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Question Analysis - Move here after Solved Questions */}
        <div className="mb-8">
          <QuestionAnalysisCharts />
        </div>

        {/* Enhanced Deneme Sonuçları - Premium Styling */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-50/70 via-white to-green-50/40 dark:from-emerald-950/40 dark:via-slate-800/60 dark:to-green-950/30 rounded-3xl border border-emerald-200/50 dark:border-emerald-800/30 p-8 backdrop-blur-lg shadow-2xl hover:shadow-3xl transition-all duration-700 group relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-500/15 to-green-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-gradient-to-tr from-green-500/15 to-emerald-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-emerald-400/5 to-green-400/5 rounded-full blur-2xl"></div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
                    <Target className="h-7 w-7 text-white drop-shadow-lg" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 bg-clip-text text-transparent">
                      🎯 Deneme Sonuçları
                    </h3>
                    <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 font-medium">Detaylı performans analizi ve ilerleme takibi</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setShowExamDialog(true)}
                    size="lg" 
                    className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 px-6 py-3 rounded-xl text-base font-semibold hover:scale-105 group/btn relative overflow-hidden"
                    data-testid="button-add-exam-result"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                    <Plus className="h-5 w-5 mr-2 relative z-10" />
                    <span className="relative z-10">Deneme Ekle</span>
                  </Button>
                  {examResults.length > 0 && (
                    <Button 
                      onClick={() => {
                        if (window.confirm("Tüm deneme sonuçlarını silmek istediğinizden emin misiniz?")) {
                          deleteAllExamResultsMutation.mutate();
                        }
                      }}
                      size="lg" 
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30 px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300"
                      disabled={deleteAllExamResultsMutation.isPending}
                    >
                      <Trash2 className="h-5 w-5 mr-2" />
                      {deleteAllExamResultsMutation.isPending ? 'Siliniyor...' : 'Denemeleri Sil'}
                    </Button>
                  )}
                </div>
              </div>
            
            {examResults.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Target className="h-12 w-12 text-emerald-500" />
                </div>
                <h4 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Henüz deneme kaydı yok</h4>
                <p className="text-sm opacity-75 mb-6">İlk deneme sonucunuzu ekleyerek başlayın</p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce delay-200"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {examResults.map((exam, index) => {
                  // Emoji selection based on index
                  const emojis = ['🏆', '💯', '🏅', '✨', '🔥', '🚀', '🎆', '🎉', '🎨', '🏁', '📚', '🎯', '💡', '⚡', '🌟'];
                  const examEmoji = emojis[index % emojis.length];
                  
                  return (
                    <Card key={exam.id} className="bg-gradient-to-r from-white via-emerald-50/30 to-green-50/30 dark:from-slate-800/60 dark:via-emerald-900/20 dark:to-green-900/20 hover:shadow-lg transition-all duration-300 border-emerald-200/50 dark:border-emerald-700/40 hover:scale-[1.02]">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{examEmoji}</span>
                              <div>
                                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                  {exam.exam_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(exam.exam_date).toLocaleDateString('tr-TR', { 
                                    day: 'numeric', 
                                    month: 'long', 
                                    year: 'numeric' 
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="flex gap-4">
                              <div className="text-center p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20 rounded-xl border border-emerald-200 dark:border-emerald-700/50">
                                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">TYT Net</span>
                                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{exam.tyt_net}</div>
                              </div>
                              {exam.ayt_net !== "0" && (
                                <div className="text-center p-3 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700/50">
                                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">AYT Net</span>
                                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{exam.ayt_net}</div>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => deleteExamResultMutation.mutate(exam.id)}
                              disabled={deleteExamResultMutation.isPending}
                              className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Deneme sonucunu sil"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Analytics Charts - Keep these important analytics */}
        <div className="space-y-8 mb-8">
          <AdvancedCharts />
        </div>

      </main>

      {/* Heatmap Day Details Dialog */}
      <Dialog open={selectedHeatmapDay !== null} onOpenChange={(open) => !open && setSelectedHeatmapDay(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-purple-500" />
              {selectedHeatmapDay && (
                <>
                  {new Date(selectedHeatmapDay.date).toLocaleDateString('tr-TR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} Aktiviteleri
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedHeatmapDay && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{selectedHeatmapDay.dayActivities.questions.length}</div>
                  <div className="text-sm text-muted-foreground">Soru Çözümü</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{selectedHeatmapDay.dayActivities.tasks.length}</div>
                  <div className="text-sm text-muted-foreground">Tamamlanan Görev</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">{selectedHeatmapDay.dayActivities.exams.length}</div>
                  <div className="text-sm text-muted-foreground">Deneme Sınavı</div>
                </div>
              </div>

              {/* Detailed Activities */}
              {selectedHeatmapDay.dayActivities.questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-green-500" />
                    Çözülen Sorular
                  </h3>
                  <div className="space-y-2">
                    {selectedHeatmapDay.dayActivities.questions.map((question: any, index: number) => (
                      <div key={index} className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{question.exam_type} - {question.subject}</span>
                          <div className="text-xs text-muted-foreground">
                            {question.correct_count}D {question.wrong_count}Y {question.blank_count || 0}B
                          </div>
                        </div>
                        {question.wrong_topics && question.wrong_topics.length > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            Yanlış konular: {question.wrong_topics.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedHeatmapDay.dayActivities.tasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Tamamlanan Görevler
                  </h3>
                  <div className="space-y-2">
                    {selectedHeatmapDay.dayActivities.tasks.map((task: any, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground mt-1">{task.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedHeatmapDay.dayActivities.exams.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-500" />
                    Deneme Sınavları
                  </h3>
                  <div className="space-y-2">
                    {selectedHeatmapDay.dayActivities.exams.map((exam: any, index: number) => (
                      <div key={index} className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{exam.exam_name}</span>
                          <div className="text-xs text-muted-foreground">
                            TYT: {exam.tyt_net} {exam.ayt_net !== "0" && `• AYT: ${exam.ayt_net}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedHeatmapDay.count === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>Bu günde herhangi bir aktivite kaydedilmemiş.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionLog ? 'Soru Kaydını Düzenle' : 'Yeni Soru Kaydı'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sınav Türü</label>
                <Select value={newQuestion.exam_type} onValueChange={(value) => setNewQuestion({...newQuestion, exam_type: value as "TYT" | "AYT"})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TYT">TYT</SelectItem>
                    <SelectItem value="AYT">AYT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ders</label>
                <Select value={newQuestion.subject} onValueChange={(value) => setNewQuestion({...newQuestion, subject: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubjectOptions(newQuestion.exam_type).map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Doğru</label>
                <Input
                  type="number"
                  value={newQuestion.correct_count}
                  onChange={(e) => setNewQuestion({...newQuestion, correct_count: e.target.value})}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Yanlış</label>
                <Input
                  type="number"
                  value={newQuestion.wrong_count}
                  onChange={(e) => setNewQuestion({...newQuestion, wrong_count: e.target.value})}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Boş</label>
                <Input
                  type="number"
                  value={newQuestion.blank_count}
                  onChange={(e) => setNewQuestion({...newQuestion, blank_count: e.target.value})}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tarih</label>
                <Input
                  type="date"
                  value={newQuestion.study_date}
                  onChange={(e) => setNewQuestion({...newQuestion, study_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Süre (dk)</label>
                <Input
                  type="number"
                  value={newQuestion.time_spent_minutes}
                  onChange={(e) => setNewQuestion({...newQuestion, time_spent_minutes: e.target.value})}
                  placeholder="45"
                  min="0"
                />
              </div>
            </div>

            {/* Enhanced Wrong Topics Section */}
            <div className="bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-900/10 dark:to-orange-900/10 rounded-xl p-6 border border-red-200/30 dark:border-red-700/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg shadow-md">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <label className="text-lg font-semibold text-red-700 dark:text-red-300">🔍 Yanlış Konu Analizi</label>
                  <p className="text-sm text-red-600/70 dark:text-red-400/70">Detaylı hata analizi ile eksik konuları belirleyin</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Category and Difficulty Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-2">Hata Kategorisi</label>
                    <Select value={selectedTopicCategory} onValueChange={(value) => setSelectedTopicCategory(value as any)}>
                      <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 border-red-200 dark:border-red-700/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kavram">🧠 Kavram Eksikliği</SelectItem>
                        <SelectItem value="hesaplama">🔢 Hesaplama Hatası</SelectItem>
                        <SelectItem value="analiz">🔍 Analiz Sorunu</SelectItem>
                        <SelectItem value="dikkatsizlik">⚠️ Dikkatsizlik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-2">Zorluk Derecesi</label>
                    <Select value={selectedTopicDifficulty} onValueChange={(value) => setSelectedTopicDifficulty(value as any)}>
                      <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 border-red-200 dark:border-red-700/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kolay">🟢 Kolay</SelectItem>
                        <SelectItem value="orta">🟡 Orta</SelectItem>
                        <SelectItem value="zor">🔴 Zor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Enhanced Topic Input */}
                <div className="relative">
                  <Input
                    value={wrongTopicInput}
                    onChange={(e) => setWrongTopicInput(e.target.value)}
                    placeholder="Konu adını yazın ve Enter'a basın..."
                    className="pl-10 pr-16 h-12 text-base bg-white/80 dark:bg-gray-800/80 border-red-200 dark:border-red-700/50 focus:border-red-400 dark:focus:border-red-500 rounded-xl shadow-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && wrongTopicInput.trim()) {
                        setNewQuestion({
                          ...newQuestion, 
                          wrong_topics: [...newQuestion.wrong_topics, {
                            topic: wrongTopicInput.trim(),
                            difficulty: selectedTopicDifficulty,
                            category: selectedTopicCategory
                          }]
                        });
                        setWrongTopicInput("");
                      }
                    }}
                    data-testid="input-wrong-topics"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-400 dark:text-red-500" />
                  {wrongTopicInput.trim() && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                      onClick={() => {
                        if (wrongTopicInput.trim()) {
                          setNewQuestion({
                            ...newQuestion, 
                            wrong_topics: [...newQuestion.wrong_topics, {
                              topic: wrongTopicInput.trim(),
                              difficulty: selectedTopicDifficulty,
                              category: selectedTopicCategory
                            }]
                          });
                          setWrongTopicInput("");
                        }
                      }}
                      data-testid="button-add-topic"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Enhanced Topic Tags Display */}
                {newQuestion.wrong_topics.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Tag className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        Eklenen Konular ({newQuestion.wrong_topics.length})
                      </span>
                    </div>
                    <div className="space-y-3">
                      {newQuestion.wrong_topics.map((topicData, index) => {
                        const getDifficultyIcon = (difficulty: string) => {
                          switch(difficulty) {
                            case 'kolay': return '🟢';
                            case 'orta': return '🟡';
                            case 'zor': return '🔴';
                            default: return '⚪';
                          }
                        };
                        
                        const getCategoryIcon = (category: string) => {
                          switch(category) {
                            case 'kavram': return '🧠';
                            case 'hesaplama': return '🔢';
                            case 'analiz': return '🔍';
                            case 'dikkatsizlik': return '⚠️';
                            default: return '📝';
                          }
                        };
                        
                        const getDifficultyBg = (difficulty: string) => {
                          switch(difficulty) {
                            case 'kolay': return 'from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 border-green-200 dark:border-green-700/50';
                            case 'orta': return 'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40 border-yellow-200 dark:border-yellow-700/50';
                            case 'zor': return 'from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 border-red-200 dark:border-red-700/50';
                            default: return 'from-gray-100 to-slate-100 dark:from-gray-900/40 dark:to-slate-900/40 border-gray-200 dark:border-gray-700/50';
                          }
                        };
                        
                        return (
                          <div
                            key={index}
                            className={`group bg-gradient-to-r ${getDifficultyBg(topicData.difficulty)} border rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105`}
                            data-testid={`topic-tag-${index}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{getCategoryIcon(topicData.category)}</span>
                                    <span className="text-lg font-bold text-red-700 dark:text-red-300">
                                      {topicData.topic}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-sm">
                                    <span>{getDifficultyIcon(topicData.difficulty)}</span>
                                    <span className="capitalize text-muted-foreground">
                                      {topicData.difficulty}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="capitalize">
                                    {topicData.category === 'kavram' && 'Kavram Eksikliği'}
                                    {topicData.category === 'hesaplama' && 'Hesaplama Hatası'}
                                    {topicData.category === 'analiz' && 'Analiz Sorunu'}
                                    {topicData.category === 'dikkatsizlik' && 'Dikkatsizlik'}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-full"
                                onClick={() => {
                                  setNewQuestion({
                                    ...newQuestion,
                                    wrong_topics: newQuestion.wrong_topics.filter((_, i) => i !== index)
                                  });
                                }}
                                data-testid={`button-remove-topic-${index}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Enhanced Topic Preview */}
                {wrongTopicInput.trim() && (
                  <div className="p-4 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-indigo-50/50 dark:from-blue-950/30 dark:via-purple-950/20 dark:to-indigo-950/30 rounded-xl border border-blue-200/40 dark:border-blue-800/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Önizleme</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <span className="text-lg">
                        {selectedTopicCategory === 'kavram' && '🧠'}
                        {selectedTopicCategory === 'hesaplama' && '🔢'}
                        {selectedTopicCategory === 'analiz' && '🔍'}
                        {selectedTopicCategory === 'dikkatsizlik' && '⚠️'}
                      </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{wrongTopicInput.trim()}</span>
                      <span className="text-sm">
                        {selectedTopicDifficulty === 'kolay' && '🟢'}
                        {selectedTopicDifficulty === 'orta' && '🟡'}
                        {selectedTopicDifficulty === 'zor' && '🔴'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  // Convert enhanced wrong topics to simple string array for backend compatibility
                  const wrong_topics_converted = newQuestion.wrong_topics.map(topic => 
                    typeof topic === 'string' ? topic : `${topic.topic} [${topic.category}, ${topic.difficulty}]`
                  );

                  if (editingQuestionLog) {
                    updateQuestionLogMutation.mutate({
                      id: editingQuestionLog.id,
                      data: {
                        exam_type: newQuestion.exam_type as "TYT" | "AYT",
                        subject: newQuestion.subject,
                        correct_count: newQuestion.correct_count,
                        wrong_count: newQuestion.wrong_count,
                        blank_count: newQuestion.blank_count || "0",
                        study_date: newQuestion.study_date,
                        wrong_topics: wrong_topics_converted,
                        time_spent_minutes: parseInt(newQuestion.time_spent_minutes) || null
                      }
                    });
                  } else {
                    createQuestionLogMutation.mutate({
                      exam_type: newQuestion.exam_type as "TYT" | "AYT",
                      subject: newQuestion.subject,
                      correct_count: newQuestion.correct_count,
                      wrong_count: newQuestion.wrong_count,
                      blank_count: newQuestion.blank_count || "0",
                      study_date: newQuestion.study_date,
                      wrong_topics: wrong_topics_converted,
                      time_spent_minutes: parseInt(newQuestion.time_spent_minutes) || null
                    });
                  }
                }}
                disabled={!newQuestion.correct_count || !newQuestion.wrong_count || createQuestionLogMutation.isPending}
                className="flex-1"
              >
                {createQuestionLogMutation.isPending ? 'Kaydediliyor...' : (editingQuestionLog ? 'Güncelle' : 'Kaydet')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowQuestionDialog(false);
                  setEditingQuestionLog(null);
                  setNewQuestion({ 
                    exam_type: "TYT", 
                    subject: "Türkçe", 
                    correct_count: "", 
                    wrong_count: "", 
                    blank_count: "", 
                    study_date: new Date().toISOString().split('T')[0],
                    wrong_topics: [],
                    time_spent_minutes: ""
                  });
                  setWrongTopicInput("");
                }}
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exam Result Dialog */}
      <Dialog open={showExamDialog} onOpenChange={setShowExamDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Deneme Sonucu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Deneme Adı</label>
                <Input
                  value={newExamResult.exam_name}
                  onChange={(e) => setNewExamResult({...newExamResult, exam_name: e.target.value})}
                  placeholder="YKS Deneme"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tarih</label>
                <Input
                  type="date"
                  value={newExamResult.exam_date}
                  onChange={(e) => setNewExamResult({...newExamResult, exam_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Alan</label>
              <Select value={newExamResult.exam_type} onValueChange={(value: "TYT" | "AYT") => setNewExamResult({...newExamResult, exam_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TYT">TYT</SelectItem>
                  <SelectItem value="AYT">Sayısal(AYT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* TYT Subjects */}
            {newExamResult.exam_type === "TYT" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">TYT Dersleri</h3>
                
                {/* Türkçe */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-green-600">Türkçe</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Doğru</label>
                      <Input
                        type="number"
                        min="0"
                        max="40"
                        value={newExamResult.subjects.turkce.correct}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            turkce: { ...newExamResult.subjects.turkce, correct: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Yanlış</label>
                      <Input
                        type="number"
                        min="0"
                        max="40"
                        value={newExamResult.subjects.turkce.wrong}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            turkce: { ...newExamResult.subjects.turkce, wrong: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Boş</label>
                      <Input
                        type="number"
                        min="0"
                        max="40"
                        value={newExamResult.subjects.turkce.blank}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            turkce: { ...newExamResult.subjects.turkce, blank: e.target.value }
                          }
                        })}
                      />
                    </div>
                  </div>
                  {parseInt(newExamResult.subjects.turkce.wrong) > 0 && (
                    <div className="bg-gradient-to-br from-red-50/80 via-white/60 to-orange-50/60 dark:from-red-950/30 dark:via-gray-800/60 dark:to-orange-950/30 rounded-2xl p-5 border-2 border-red-200/50 dark:border-red-700/40 shadow-lg backdrop-blur-sm mt-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                          <Search className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
                            🔍 Türkçe Yanlış Konu Analizi
                            <div className="text-xs bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-full text-red-700 dark:text-red-300">
                              {parseInt(newExamResult.subjects.turkce.wrong)} yanlış
                            </div>
                          </label>
                          <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                            Eksik konuları belirterek öncelik listesine ekleyin
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Input
                          value={currentWrongTopics.turkce || ""}
                          onChange={(e) => {
                            setCurrentWrongTopics({...currentWrongTopics, turkce: e.target.value});
                            const topics = e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                            setNewExamResult({
                              ...newExamResult,
                              subjects: {
                                ...newExamResult.subjects,
                                turkce: { ...newExamResult.subjects.turkce, wrong_topics: topics }
                              }
                            });
                          }}
                          placeholder="Örnek: cümle çözümleme, sözcük türleri, yazım kuralları..."
                          className="bg-white/90 dark:bg-gray-800/90 border-red-300/60 dark:border-red-600/50 focus:border-red-500 dark:focus:border-red-400 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800/50 rounded-xl shadow-sm text-sm"
                        />
                        {currentWrongTopics.turkce && (
                          <div className="flex items-center gap-2 p-3 bg-red-100/60 dark:bg-red-900/30 rounded-xl border border-red-200/60 dark:border-red-700/40">
                            <Lightbulb className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <div className="text-xs text-red-700/90 dark:text-red-300/90">
                              <strong>{currentWrongTopics.turkce.split(',').length} konu</strong> öncelik listesine eklenecek ve hata sıklığı analizinde gösterilecek
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Matematik */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-blue-600">Matematik</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Doğru</label>
                      <Input
                        type="number"
                        min="0"
                        max="40"
                        value={newExamResult.subjects.matematik.correct}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            matematik: { ...newExamResult.subjects.matematik, correct: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Yanlış</label>
                      <Input
                        type="number"
                        min="0"
                        max="40"
                        value={newExamResult.subjects.matematik.wrong}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            matematik: { ...newExamResult.subjects.matematik, wrong: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Boş</label>
                      <Input
                        type="number"
                        min="0"
                        max="40"
                        value={newExamResult.subjects.matematik.blank}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            matematik: { ...newExamResult.subjects.matematik, blank: e.target.value }
                          }
                        })}
                      />
                    </div>
                  </div>
                  {parseInt(newExamResult.subjects.matematik.wrong) > 0 && (
                    <div className="bg-gradient-to-br from-blue-50/80 via-white/60 to-cyan-50/60 dark:from-blue-950/30 dark:via-gray-800/60 dark:to-cyan-950/30 rounded-2xl p-5 border-2 border-blue-200/50 dark:border-blue-700/40 shadow-lg backdrop-blur-sm mt-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                          <Search className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                            🔍 Matematik Yanlış Konu Analizi
                            <div className="text-xs bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded-full text-blue-700 dark:text-blue-300">
                              {parseInt(newExamResult.subjects.matematik.wrong)} yanlış
                            </div>
                          </label>
                          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                            Eksik konuları belirterek öncelik listesine ekleyin
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Input
                          value={currentWrongTopics.matematik || ""}
                          onChange={(e) => {
                            setCurrentWrongTopics({...currentWrongTopics, matematik: e.target.value});
                            const topics = e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                            setNewExamResult({
                              ...newExamResult,
                              subjects: {
                                ...newExamResult.subjects,
                                matematik: { ...newExamResult.subjects.matematik, wrong_topics: topics }
                              }
                            });
                          }}
                          placeholder="Örnek: türev, integral, trigonometri, fonksiyonlar..."
                          className="bg-white/90 dark:bg-gray-800/90 border-blue-300/60 dark:border-blue-600/50 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800/50 rounded-xl shadow-sm text-sm"
                        />
                        {currentWrongTopics.matematik && (
                          <div className="flex items-center gap-2 p-3 bg-blue-100/60 dark:bg-blue-900/30 rounded-xl border border-blue-200/60 dark:border-blue-700/40">
                            <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <div className="text-xs text-blue-700/90 dark:text-blue-300/90">
                              <strong>{currentWrongTopics.matematik.split(',').length} konu</strong> öncelik listesine eklenecek ve hata sıklığı analizinde gösterilecek
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sosyal */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-purple-600">Sosyal Bilimler</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Doğru</label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={newExamResult.subjects.sosyal.correct}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            sosyal: { ...newExamResult.subjects.sosyal, correct: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Yanlış</label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={newExamResult.subjects.sosyal.wrong}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            sosyal: { ...newExamResult.subjects.sosyal, wrong: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Boş</label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={newExamResult.subjects.sosyal.blank}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            sosyal: { ...newExamResult.subjects.sosyal, blank: e.target.value }
                          }
                        })}
                      />
                    </div>
                  </div>
                  {parseInt(newExamResult.subjects.sosyal.wrong) > 0 && (
                    <div className="bg-gradient-to-br from-purple-50/80 via-white/60 to-indigo-50/60 dark:from-purple-950/30 dark:via-gray-800/60 dark:to-indigo-950/30 rounded-2xl p-5 border-2 border-purple-200/50 dark:border-purple-700/40 shadow-lg backdrop-blur-sm mt-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                          <Search className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-purple-800 dark:text-purple-200 flex items-center gap-2">
                            🔍 Sosyal Bilimler Yanlış Konu Analizi
                            <div className="text-xs bg-purple-100 dark:bg-purple-900/40 px-2 py-1 rounded-full text-purple-700 dark:text-purple-300">
                              {parseInt(newExamResult.subjects.sosyal.wrong)} yanlış
                            </div>
                          </label>
                          <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">
                            Eksik konuları belirterek öncelik listesine ekleyin
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Input
                          value={currentWrongTopics.sosyal || ""}
                          onChange={(e) => {
                            setCurrentWrongTopics({...currentWrongTopics, sosyal: e.target.value});
                            const topics = e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                            setNewExamResult({
                              ...newExamResult,
                              subjects: {
                                ...newExamResult.subjects,
                                sosyal: { ...newExamResult.subjects.sosyal, wrong_topics: topics }
                              }
                            });
                          }}
                          placeholder="Örnek: tarih dönemleri, coğrafya, vatandaşlık, felsefe..."
                          className="bg-white/90 dark:bg-gray-800/90 border-purple-300/60 dark:border-purple-600/50 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800/50 rounded-xl shadow-sm text-sm"
                        />
                        {currentWrongTopics.sosyal && (
                          <div className="flex items-center gap-2 p-3 bg-purple-100/60 dark:bg-purple-900/30 rounded-xl border border-purple-200/60 dark:border-purple-700/40">
                            <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                            <div className="text-xs text-purple-700/90 dark:text-purple-300/90">
                              <strong>{currentWrongTopics.sosyal.split(',').length} konu</strong> öncelik listesine eklenecek ve hata sıklığı analizinde gösterilecek
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fen */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-orange-600">Fen Bilimleri</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Doğru</label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={newExamResult.subjects.fen.correct}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            fen: { ...newExamResult.subjects.fen, correct: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Yanlış</label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={newExamResult.subjects.fen.wrong}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            fen: { ...newExamResult.subjects.fen, wrong: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Boş</label>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={newExamResult.subjects.fen.blank}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            fen: { ...newExamResult.subjects.fen, blank: e.target.value }
                          }
                        })}
                      />
                    </div>
                  </div>
                  {parseInt(newExamResult.subjects.fen.wrong) > 0 && (
                    <div className="bg-gradient-to-br from-orange-50/80 via-white/60 to-amber-50/60 dark:from-orange-950/30 dark:via-gray-800/60 dark:to-amber-950/30 rounded-2xl p-5 border-2 border-orange-200/50 dark:border-orange-700/40 shadow-lg backdrop-blur-sm mt-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                          <Search className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                            🔍 Fen Bilimleri Yanlış Konu Analizi
                            <div className="text-xs bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded-full text-orange-700 dark:text-orange-300">
                              {parseInt(newExamResult.subjects.fen.wrong)} yanlış
                            </div>
                          </label>
                          <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
                            Eksik konuları belirterek öncelik listesine ekleyin
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Input
                          value={currentWrongTopics.fen || ""}
                          onChange={(e) => {
                            setCurrentWrongTopics({...currentWrongTopics, fen: e.target.value});
                          const topics = e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                          setNewExamResult({
                            ...newExamResult,
                            subjects: {
                              ...newExamResult.subjects,
                              fen: { ...newExamResult.subjects.fen, wrong_topics: topics }
                            }
                          });
                        }}
                          placeholder="Örnek: fizik konuları, kimya bağları, biyoloji sistemleri..."
                          className="bg-white/90 dark:bg-gray-800/90 border-orange-300/60 dark:border-orange-600/50 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800/50 rounded-xl shadow-sm text-sm"
                        />
                        {currentWrongTopics.fen && (
                          <div className="flex items-center gap-2 p-3 bg-orange-100/60 dark:bg-orange-900/30 rounded-xl border border-orange-200/60 dark:border-orange-700/40">
                            <Lightbulb className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            <div className="text-xs text-orange-700/90 dark:text-orange-300/90">
                              <strong>{currentWrongTopics.fen.split(',').length} konu</strong> öncelik listesine eklenecek ve hata sıklığı analizinde gösterilecek
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AYT Sayısal Subjects */}
            {newExamResult.exam_type === "AYT" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">AYT Sayısal Dersleri</h3>
                
                {/* Matematik */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-blue-600">Matematik</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Doğru</label>
                      <Input
                        type="number"
                        min="0"
                        max="40"
                        value={newExamResult.subjects.matematik.correct}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            matematik: { ...newExamResult.subjects.matematik, correct: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Yanlış</label>
                      <Input
                        type="number"
                        min="0"
                        max="40"
                        value={newExamResult.subjects.matematik.wrong}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            matematik: { ...newExamResult.subjects.matematik, wrong: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Boş</label>
                      <Input
                        type="number"
                        min="0"
                        max="40"
                        value={newExamResult.subjects.matematik.blank}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            matematik: { ...newExamResult.subjects.matematik, blank: e.target.value }
                          }
                        })}
                      />
                    </div>
                  </div>
                  {parseInt(newExamResult.subjects.matematik.wrong) > 0 && (
                    <div>
                      <label className="block text-xs font-medium mb-1 text-red-600">Eksik konuları yazınız (virgülle ayırın)</label>
                      <Input
                        value={currentWrongTopics.matematik || ""}
                        onChange={(e) => {
                          setCurrentWrongTopics({...currentWrongTopics, matematik: e.target.value});
                          const topics = e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                          setNewExamResult({
                            ...newExamResult,
                            subjects: {
                              ...newExamResult.subjects,
                              matematik: { ...newExamResult.subjects.matematik, wrong_topics: topics }
                            }
                          });
                        }}
                        placeholder="konu1, konu2, konu3"
                      />
                    </div>
                  )}
                </div>

                {/* Fizik */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-red-600">Fizik</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Doğru</label>
                      <Input
                        type="number"
                        min="0"
                        max="14"
                        value={newExamResult.subjects.fizik.correct}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            fizik: { ...newExamResult.subjects.fizik, correct: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Yanlış</label>
                      <Input
                        type="number"
                        min="0"
                        max="14"
                        value={newExamResult.subjects.fizik.wrong}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            fizik: { ...newExamResult.subjects.fizik, wrong: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Boş</label>
                      <Input
                        type="number"
                        min="0"
                        max="14"
                        value={newExamResult.subjects.fizik.blank}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            fizik: { ...newExamResult.subjects.fizik, blank: e.target.value }
                          }
                        })}
                      />
                    </div>
                  </div>
                  {parseInt(newExamResult.subjects.fizik.wrong) > 0 && (
                    <div className="bg-gradient-to-r from-indigo-50/70 to-blue-50/50 dark:from-indigo-900/20 dark:to-blue-900/15 rounded-xl p-4 border border-indigo-200/40 dark:border-indigo-700/30 mt-3">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-indigo-500" />
                        <label className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">🔍 Fizik Eksik Konular</label>
                      </div>
                      <Input
                        value={currentWrongTopics.fizik || ""}
                        onChange={(e) => {
                          setCurrentWrongTopics({...currentWrongTopics, fizik: e.target.value});
                          const topics = e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                          setNewExamResult({
                            ...newExamResult,
                            subjects: {
                              ...newExamResult.subjects,
                              fizik: { ...newExamResult.subjects.fizik, wrong_topics: topics }
                            }
                          });
                        }}
                        placeholder="konu1, konu2, konu3 şeklinde virgülle ayırarak yazın..."
                        className="bg-white/80 dark:bg-gray-800/80 border-indigo-200 dark:border-indigo-700/50 focus:border-indigo-400 dark:focus:border-indigo-500 rounded-xl shadow-sm"
                      />
                      {currentWrongTopics.fizik && (
                        <div className="mt-2 text-xs text-indigo-600/70 dark:text-indigo-400/70">
                          💡 Bu konular öncelik listesine eklenecek
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Kimya */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-green-600">Kimya</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Doğru</label>
                      <Input
                        type="number"
                        min="0"
                        max="13"
                        value={newExamResult.subjects.kimya.correct}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            kimya: { ...newExamResult.subjects.kimya, correct: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Yanlış</label>
                      <Input
                        type="number"
                        min="0"
                        max="13"
                        value={newExamResult.subjects.kimya.wrong}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            kimya: { ...newExamResult.subjects.kimya, wrong: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Boş</label>
                      <Input
                        type="number"
                        min="0"
                        max="13"
                        value={newExamResult.subjects.kimya.blank}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            kimya: { ...newExamResult.subjects.kimya, blank: e.target.value }
                          }
                        })}
                      />
                    </div>
                  </div>
                  {parseInt(newExamResult.subjects.kimya.wrong) > 0 && (
                    <div className="bg-gradient-to-r from-green-50/70 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/15 rounded-xl p-4 border border-green-200/40 dark:border-green-700/30 mt-3">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-green-500" />
                        <label className="text-sm font-semibold text-green-700 dark:text-green-300">🔍 Kimya Eksik Konular</label>
                      </div>
                      <Input
                        value={currentWrongTopics.kimya || ""}
                        onChange={(e) => {
                          setCurrentWrongTopics({...currentWrongTopics, kimya: e.target.value});
                          const topics = e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                          setNewExamResult({
                            ...newExamResult,
                            subjects: {
                              ...newExamResult.subjects,
                              kimya: { ...newExamResult.subjects.kimya, wrong_topics: topics }
                            }
                          });
                        }}
                        placeholder="konu1, konu2, konu3 şeklinde virgülle ayırarak yazın..."
                        className="bg-white/80 dark:bg-gray-800/80 border-green-200 dark:border-green-700/50 focus:border-green-400 dark:focus:border-green-500 rounded-xl shadow-sm"
                      />
                      {currentWrongTopics.kimya && (
                        <div className="mt-2 text-xs text-green-600/70 dark:text-green-400/70">
                          💡 Bu konular öncelik listesine eklenecek
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Biyoloji */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-teal-600">Biyoloji</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Doğru</label>
                      <Input
                        type="number"
                        min="0"
                        max="13"
                        value={newExamResult.subjects.biyoloji.correct}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            biyoloji: { ...newExamResult.subjects.biyoloji, correct: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Yanlış</label>
                      <Input
                        type="number"
                        min="0"
                        max="13"
                        value={newExamResult.subjects.biyoloji.wrong}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            biyoloji: { ...newExamResult.subjects.biyoloji, wrong: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Boş</label>
                      <Input
                        type="number"
                        min="0"
                        max="13"
                        value={newExamResult.subjects.biyoloji.blank}
                        onChange={(e) => setNewExamResult({
                          ...newExamResult,
                          subjects: {
                            ...newExamResult.subjects,
                            biyoloji: { ...newExamResult.subjects.biyoloji, blank: e.target.value }
                          }
                        })}
                      />
                    </div>
                  </div>
                  {parseInt(newExamResult.subjects.biyoloji.wrong) > 0 && (
                    <div className="bg-gradient-to-r from-teal-50/70 to-cyan-50/50 dark:from-teal-900/20 dark:to-cyan-900/15 rounded-xl p-4 border border-teal-200/40 dark:border-teal-700/30 mt-3">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-teal-500" />
                        <label className="text-sm font-semibold text-teal-700 dark:text-teal-300">🔍 Biyoloji Eksik Konular</label>
                      </div>
                      <Input
                        value={currentWrongTopics.biyoloji || ""}
                        onChange={(e) => {
                          setCurrentWrongTopics({...currentWrongTopics, biyoloji: e.target.value});
                          const topics = e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
                          setNewExamResult({
                            ...newExamResult,
                            subjects: {
                              ...newExamResult.subjects,
                              biyoloji: { ...newExamResult.subjects.biyoloji, wrong_topics: topics }
                            }
                          });
                        }}
                        placeholder="konu1, konu2, konu3 şeklinde virgülle ayırarak yazın..."
                        className="bg-white/80 dark:bg-gray-800/80 border-teal-200 dark:border-teal-700/50 focus:border-teal-400 dark:focus:border-teal-500 rounded-xl shadow-sm"
                      />
                      {currentWrongTopics.biyoloji && (
                        <div className="mt-2 text-xs text-teal-600/70 dark:text-teal-400/70">
                          💡 Bu konular öncelik listesine eklenecek
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  // Calculate total net based on subjects
                  let totalNet = 0;
                  Object.values(newExamResult.subjects).forEach(subject => {
                    const correct = parseInt(subject.correct) || 0;
                    const wrong = parseInt(subject.wrong) || 0;
                    totalNet += correct - (wrong * 0.25);
                  });
                  
                  createExamResultMutation.mutate({
                    exam_name: newExamResult.exam_name,
                    exam_date: newExamResult.exam_date,
                    tyt_net: newExamResult.exam_type === "TYT" ? totalNet.toString() : "0",
                    ayt_net: newExamResult.exam_type === "AYT" ? totalNet.toString() : "0",
                    subjects_data: JSON.stringify(newExamResult.subjects)
                  });
                }}
                disabled={!newExamResult.exam_name || createExamResultMutation.isPending}
                className="flex-1"
              >
                {createExamResultMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowExamDialog(false);
                  setNewExamResult({ 
                    exam_name: "", 
                    exam_date: new Date().toISOString().split('T')[0], 
                    exam_type: "TYT" as "TYT" | "AYT",
                    subjects: {
                      turkce: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
                      matematik: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
                      sosyal: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
                      fen: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
                      fizik: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
                      kimya: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] },
                      biyoloji: { correct: "", wrong: "", blank: "", wrong_topics: [] as string[] }
                    }
                  });
                  setCurrentWrongTopics({}); // Clear all wrong topics input fields
                }}
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}