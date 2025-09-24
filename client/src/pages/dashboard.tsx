import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Link, useLocation } from "wouter";
import { TrendingUp, BarChart3, Target, Brain, BookOpen, Plus, CalendarDays, X, FlaskConical, Trash2, AlertTriangle, Sparkles, Award, Clock, Zap, Edit, Search, Tag, BookX, Lightbulb } from "lucide-react";
import { Task, Goal, QuestionLog, InsertQuestionLog, ExamResult, InsertExamResult } from "@shared/schema";
import { DashboardSummaryCards } from "@/components/dashboard-summary-cards";
import { WeeklyActivitySummary } from "@/components/weekly-activity-summary";
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
    wrong_topics: [] as string[],
    time_spent_minutes: ""
  });
  const [wrongTopicInput, setWrongTopicInput] = useState("");
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

  // Generate heatmap data for last 3 months
  const generateHeatmapData = () => {
    const data = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find matching daily summary
      const daySummary = dailySummary.find(d => d.date === dateStr);
      const intensity = daySummary ? Math.min(daySummary.tasksCompleted / 5, 1) : 0;
      
      data.push({
        date: dateStr,
        day: date.getDate(),
        month: date.getMonth(),
        intensity,
        count: daySummary?.tasksCompleted || 0
      });
    }
    return data;
  };

  const heatmapData = generateHeatmapData();


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
        
        {/* Weekly Activity Summary */}
        <div className="mb-8">
          <WeeklyActivitySummary />
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
                <Button 
                  onClick={() => setShowQuestionDialog(true)}
                  size="sm" 
                  variant="outline"
                  className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Soru Ekle
                </Button>
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
                {/* Enhanced Exam Results List */}
                {examResults.slice(0, 5).map((exam, index) => (
                  <div 
                    key={exam.id} 
                    className="group/item bg-gradient-to-r from-white/80 to-emerald-50/50 dark:from-slate-800/80 dark:to-emerald-950/50 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 p-5 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] hover:border-emerald-300/60 relative overflow-hidden"
                    data-testid={`exam-result-${exam.id}`}
                  >
                    {/* Ranking Badge for Top Result */}
                    {index === 0 && (
                      <div className="absolute top-3 left-3">
                        <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          <Award className="h-3 w-3" />
                          Son Deneme
                        </div>
                      </div>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteExamResultMutation.mutate(exam.id)}
                      disabled={deleteExamResultMutation.isPending}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-2 hover:bg-red-100/50 dark:hover:bg-red-900/30 rounded-xl transition-all duration-300 opacity-0 group-hover/item:opacity-100 hover:scale-110"
                      title="Deneme sonucunu sil"
                      data-testid={`button-delete-exam-${exam.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <div className="space-y-4 mt-8">
                      {/* Exam Header Info */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg">
                          <FlaskConical className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-emerald-800 dark:text-emerald-200 group-hover/item:text-emerald-600 transition-colors">
                            {exam.exam_name}
                          </h4>
                          <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(exam.exam_date).toLocaleDateString('tr-TR', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {/* Score Display */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">TYT SONUCU</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {exam.tyt_net}
                          </div>
                          <div className="text-xs text-blue-600/70 dark:text-blue-400/70">net puan</div>
                        </div>
                        
                        {exam.ayt_net && (
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/30">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">AYT SONUCU</span>
                            </div>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                              {exam.ayt_net}
                            </div>
                            <div className="text-xs text-purple-600/70 dark:text-purple-400/70">net puan</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Performance Indicator */}
                      <div className="flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-700/30">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Performans Değerlendirmesi</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                i < Math.min(Math.ceil((parseFloat(exam.tyt_net) / 120) * 5), 5) 
                                  ? 'bg-emerald-500' 
                                  : 'bg-emerald-200 dark:bg-emerald-800'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* View All Results Link */}
                {examResults.length > 5 && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950/30"
                      data-testid="button-view-all-exams"
                    >
                      Tüm Sonuçları Gör ({examResults.length - 5} tane daha)
                    </Button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* All Charts - Organized according to user specifications */}
        <div className="space-y-8 mb-8">
          <AdvancedCharts />
          <QuestionAnalysisCharts />
        </div>

        {/* Latest Activities and 90-Day Activities - Enhanced Styling */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Activities - Enhanced */}
          <div className="bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/30 dark:from-blue-950/30 dark:via-slate-800/50 dark:to-indigo-950/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-8 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-500 group relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-blue-500/10 rounded-full blur-2xl"></div>
            
            <div className="relative">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 mr-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    🕒 Son Aktiviteler
                  </span>
                  <p className="text-sm text-muted-foreground font-normal">Güncel hareket özeti</p>
                </div>
              </h3>
              
              {recentActivities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-lg font-medium">Henüz aktivite yok</p>
                  <p className="text-sm opacity-75">İlk aktivitenizi gerçekleştirin</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                  {recentActivities.slice(0, 8).map((activity, index) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={index} className="flex items-center gap-4 p-4 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md group/item">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center group-hover/item:shadow-lg transition-all duration-300">
                          <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate group-hover/item:text-blue-600 transition-colors">
                            {activity.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.date).toLocaleDateString('tr-TR', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 90-Day Activities - Enhanced */}
          <div className="bg-gradient-to-br from-purple-50/80 via-white to-pink-50/30 dark:from-purple-950/30 dark:via-slate-800/50 dark:to-pink-950/20 rounded-2xl border border-purple-200/50 dark:border-purple-800/30 p-8 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-500 group relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-violet-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
            
            <div className="relative">
              <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 mr-4">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                    📈 Aktivitelerim
                  </span>
                  <p className="text-sm text-muted-foreground font-normal">90 günlük genel bakış</p>
                </div>
              </h3>
              
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-lg font-medium">Veri analizi hazırlanıyor</p>
                <p className="text-sm opacity-75 mb-4">90 günlük aktivite özeti</p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse delay-75"></div>
                  <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg shadow-md">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <label className="text-lg font-semibold text-red-700 dark:text-red-300">Yanlış Konular</label>
                  <p className="text-sm text-red-600/70 dark:text-red-400/70">Eksik olan konuları ekleyerek gelişim alanlarınızı belirleyin</p>
                </div>
              </div>
              
              <div className="space-y-4">
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
                          wrong_topics: [...newQuestion.wrong_topics, wrongTopicInput.trim()]
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
                            wrong_topics: [...newQuestion.wrong_topics, wrongTopicInput.trim()]
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
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        Eklenen Konular ({newQuestion.wrong_topics.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newQuestion.wrong_topics.map((topic, index) => (
                        <div
                          key={index}
                          className="group flex items-center gap-2 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 border border-red-200 dark:border-red-700/50 rounded-lg px-3 py-2 transition-all duration-200 hover:shadow-md hover:scale-105"
                          data-testid={`topic-tag-${index}`}
                        >
                          <BookX className="h-3 w-3 text-red-600 dark:text-red-400" />
                          <span className="text-sm font-medium text-red-700 dark:text-red-300 select-none">
                            {topic}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-full"
                            onClick={() => {
                              setNewQuestion({
                                ...newQuestion,
                                wrong_topics: newQuestion.wrong_topics.filter((_, i) => i !== index)
                              });
                            }}
                            data-testid={`button-remove-topic-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Helper Text */}
                <div className="flex items-start gap-2 p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg border border-red-200/50 dark:border-red-700/30">
                  <Lightbulb className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-600/80 dark:text-red-400/80">
                    <p className="font-medium mb-1">💡 İpucu:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Spesifik konu başlıklarını ekleyin (örn: "İkinci Dereceden Denklemler")</li>
                      <li>• Her yanlış konu için ayrı etiket oluşturun</li>
                      <li>• Daha sonra bu konular üzerinde odaklanarak çalışabilirsiniz</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
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
                        wrong_topics: newQuestion.wrong_topics,
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
                      wrong_topics: newQuestion.wrong_topics,
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
                    <div>
                      <label className="block text-xs font-medium mb-1 text-red-600">Eksik konuları yazınız (virgülle ayırın)</label>
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
                        placeholder="konu1, konu2, konu3"
                      />
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
                    <div>
                      <label className="block text-xs font-medium mb-1 text-red-600">Eksik konuları yazınız (virgülle ayırın)</label>
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
                        placeholder="konu1, konu2, konu3"
                      />
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
                    <div>
                      <label className="block text-xs font-medium mb-1 text-red-600">Eksik konuları yazınız (virgülle ayırın)</label>
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
                        placeholder="konu1, konu2, konu3"
                      />
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
                    <div>
                      <label className="block text-xs font-medium mb-1 text-red-600">Eksik konuları yazınız (virgülle ayırın)</label>
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
                        placeholder="konu1, konu2, konu3"
                      />
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
                    <div>
                      <label className="block text-xs font-medium mb-1 text-red-600">Eksik konuları yazınız (virgülle ayırın)</label>
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
                        placeholder="konu1, konu2, konu3"
                      />
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
                    <div>
                      <label className="block text-xs font-medium mb-1 text-red-600">Eksik konuları yazınız (virgülle ayırın)</label>
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
                        placeholder="konu1, konu2, konu3"
                      />
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
                  setCurrentWrongTopics({});
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