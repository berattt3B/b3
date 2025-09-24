import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Link, useLocation } from "wouter";
import { TrendingUp, BarChart3, Target, Brain, BookOpen, Plus, CalendarDays, X, FlaskConical, Trash2, AlertTriangle, Sparkles, Award, Clock, Zap, Edit } from "lucide-react";
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
    wrong_topics: [] as string[],
    time_spent_minutes: ""
  });
  const [wrongTopicInput, setWrongTopicInput] = useState("");
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [newExamResult, setNewExamResult] = useState({ exam_name: "", exam_date: new Date().toISOString().split('T')[0], tyt_net: "", ayt_net: "", ranking: "", notes: "" });
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
      setNewExamResult({ exam_name: "", exam_date: new Date().toISOString().split('T')[0], tyt_net: "", ayt_net: "", ranking: "", notes: "" });
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

        {/* Advanced Charts */}
        <AdvancedCharts />

        {/* Question Analysis Charts */}
        <QuestionAnalysisCharts />

        {/* Top Row - Heatmap and Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Activity Heatmap */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-primary" />
              Aktivite Haritası (Son 90 Gün)
            </h3>
            <div className="grid grid-cols-15 gap-1">
              {heatmapData.map((day, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-sm transition-all hover:scale-110 ${
                    day.intensity === 0 ? 'bg-muted/30' :
                    day.intensity < 0.25 ? 'bg-green-200 dark:bg-green-900/40' :
                    day.intensity < 0.5 ? 'bg-green-300 dark:bg-green-800/60' :
                    day.intensity < 0.75 ? 'bg-green-500 dark:bg-green-700/80' :
                    'bg-green-600 dark:bg-green-600'
                  }`}
                  title={`${day.date}: ${day.count} görev`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>Az</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-muted/30 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-200 dark:bg-green-900/40 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-300 dark:bg-green-800/60 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-500 dark:bg-green-700/80 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-600 dark:bg-green-600 rounded-sm"></div>
              </div>
              <span>Çok</span>
            </div>
          </div>

          {/* Net & Deneme Snapshot */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                Net & Deneme
              </div>
              <Button 
                onClick={() => setShowExamDialog(true)}
                size="sm" 
                variant="outline"
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Ekle
              </Button>
            </h3>
            
            {examResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Henüz deneme kaydı yok</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {/* Exam results list */}
                {examResults.slice(0, 5).map((exam, index) => (
                  <div key={exam.id} className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-foreground">
                        {index === 0 ? 'Son Deneme' : `${index + 1}. Deneme`}
                      </div>
                      <button
                        onClick={() => deleteExamResultMutation.mutate(exam.id)}
                        disabled={deleteExamResultMutation.isPending}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Deneme sonucunu sil"
                        data-testid={`button-delete-exam-${exam.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">{exam.exam_name}</div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {new Date(exam.exam_date).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="flex gap-2 text-sm">
                        <span className="text-blue-600">TYT: {exam.tyt_net}</span>
                        {exam.ayt_net && (
                          <span className="text-green-600">AYT: {exam.ayt_net}</span>
                        )}
                      </div>
                      {exam.ranking && (
                        <div className="text-xs text-orange-600">Sıralama: {exam.ranking}</div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Question stats */}
                <div className="p-3 bg-muted/20 rounded-lg">
                  <div className="text-sm font-medium text-foreground mb-2">Soru İstatistikleri</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-green-600 font-medium">
                        {questionLogs.reduce((total, log) => total + parseInt(log.correct_count), 0)}
                      </div>
                      <div className="text-muted-foreground">Doğru</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-medium">
                        {questionLogs.reduce((total, log) => total + parseInt(log.wrong_count), 0)}
                      </div>
                      <div className="text-muted-foreground">Yanlış</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">
                        {questionLogs.reduce((total, log) => total + parseInt(log.blank_count || '0'), 0)}
                      </div>
                      <div className="text-muted-foreground">Boş</div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowQuestionDialog(true)}
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Soru Ekle
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities - Full Width */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Son Aktiviteler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentActivities.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Henüz aktivite yok</p>
              </div>
            ) : (
              recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'question' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                      activity.type === 'exam' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                      'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{activity.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(activity.date || new Date()).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
      
      {/* Add Question Log Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Soru Çözüm Kaydı Ekle
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Sınav Türü</label>
                <Select value={newQuestion.exam_type} onValueChange={(value) => {
                  setNewQuestion({ ...newQuestion, exam_type: value, subject: getSubjectOptions(value)[0] });
                }}>
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
                <label className="block text-sm font-medium text-foreground mb-2">Ders</label>
                <Select value={newQuestion.subject} onValueChange={(value) => setNewQuestion({ ...newQuestion, subject: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubjectOptions(newQuestion.exam_type).map((subject) => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">✅ Doğru</label>
                <Input
                  type="number"
                  value={newQuestion.correct_count}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correct_count: e.target.value })}
                  placeholder="0"
                  className="text-center font-semibold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">❌ Yanlış</label>
                <Input
                  type="number"
                  value={newQuestion.wrong_count}
                  onChange={(e) => setNewQuestion({ ...newQuestion, wrong_count: e.target.value })}
                  placeholder="0"
                  className="text-center font-semibold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">⭕ Boş</label>
                <Input
                  type="number"
                  value={newQuestion.blank_count}
                  onChange={(e) => setNewQuestion({ ...newQuestion, blank_count: e.target.value })}
                  placeholder="0"
                  className="text-center font-semibold"
                />
              </div>
            </div>

            {/* Wrong Topics Input - NEW FEATURE */}
            {parseInt(newQuestion.wrong_count) > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 p-4 rounded-xl border border-red-200 dark:border-red-800/50">
                <label className="block text-sm font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  🎯 Yanlış Yaptığın Konular (virgülle ayır)
                </label>
                <Input
                  type="text"
                  value={wrongTopicInput}
                  onChange={(e) => setWrongTopicInput(e.target.value)}
                  placeholder="Örn: Analitik geometri, Trigonometri, Parabol"
                  className="border-red-300 focus:border-red-500 dark:border-red-700 dark:focus:border-red-400 bg-white dark:bg-red-950/20"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {wrongTopicInput.split(',').filter(t => t.trim()).map((topic, index) => (
                    <Badge key={index} className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
                      {topic.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Time Spent Input - NEW FEATURE */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                ⏱️ Harcadığın Süre (dakika)
              </label>
              <Input
                type="number"
                value={newQuestion.time_spent_minutes}
                onChange={(e) => setNewQuestion({ ...newQuestion, time_spent_minutes: e.target.value })}
                placeholder="30"
                className="text-center font-semibold"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tarih</label>
              <Input
                type="date"
                value={newQuestion.study_date}
                onChange={(e) => setNewQuestion({ ...newQuestion, study_date: e.target.value })}
              />
            </div>
            
            <div className="flex space-x-3 pt-2">
              <Button 
                onClick={() => {
                  if (!newQuestion.correct_count && !newQuestion.wrong_count && !newQuestion.blank_count) {
                    toast({ title: "⚠️ Uyarı", description: "Lütfen en az bir alan doldurun.", variant: "destructive" });
                    return;
                  }
                  
                  // Parse wrong topics from input
                  const wrongTopics = wrongTopicInput
                    .split(',')
                    .map(topic => topic.trim())
                    .filter(topic => topic.length > 0);
                  
                  createQuestionLogMutation.mutate({
                    exam_type: newQuestion.exam_type as "TYT" | "AYT",
                    subject: newQuestion.subject,
                    correct_count: newQuestion.correct_count || "0",
                    wrong_count: newQuestion.wrong_count || "0",
                    blank_count: newQuestion.blank_count || "0",
                    study_date: newQuestion.study_date,
                    wrong_topics: wrongTopics,
                    time_spent_minutes: newQuestion.time_spent_minutes ? parseInt(newQuestion.time_spent_minutes) : null
                  });
                }}
                disabled={createQuestionLogMutation.isPending}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
              >
                {createQuestionLogMutation.isPending ? "⏳ Ekleniyor..." : "✅ Ekle"}
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setShowQuestionDialog(false)}
                className="flex-1"
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Exam Result Dialog */}
      <Dialog open={showExamDialog} onOpenChange={setShowExamDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Deneme Sınav Sonucu Ekle
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Deneme Adı <span className="text-red-500">*</span></label>
              <Input
                value={newExamResult.exam_name}
                onChange={(e) => setNewExamResult({ ...newExamResult, exam_name: e.target.value })}
                placeholder="Örn: YKS Deneme 1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tarih <span className="text-red-500">*</span></label>
              <Input
                type="date"
                value={newExamResult.exam_date}
                onChange={(e) => setNewExamResult({ ...newExamResult, exam_date: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">TYT Net <span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  step="0.1"
                  value={newExamResult.tyt_net}
                  onChange={(e) => setNewExamResult({ ...newExamResult, tyt_net: e.target.value })}
                  placeholder="0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">AYT Net <span className="text-red-500">*</span></label>
                <Input
                  type="number"
                  step="0.1"
                  value={newExamResult.ayt_net}
                  onChange={(e) => setNewExamResult({ ...newExamResult, ayt_net: e.target.value })}
                  placeholder="0.0"
                />
              </div>
            </div>
            
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Yanlış Yapılan Konular <span className="text-red-500">*</span></label>
              <Textarea
                value={newExamResult.notes}
                onChange={(e) => setNewExamResult({ ...newExamResult, notes: e.target.value })}
                placeholder="Yanlış yaptığınız konuları belirtin..."
                className="h-20"
              />
            </div>
            
            <div className="flex space-x-3 pt-2">
              <Button 
                onClick={() => {
                  if (!newExamResult.exam_name || !newExamResult.tyt_net) {
                    toast({ title: "Uyarı", description: "Lütfen gerekli alanları doldurun.", variant: "destructive" });
                    return;
                  }
                  createExamResultMutation.mutate({
                    ...newExamResult,
                    tyt_net: newExamResult.tyt_net,
                    ayt_net: newExamResult.ayt_net || "0"
                  });
                }}
                disabled={createExamResultMutation.isPending}
                className="flex-1"
              >
                {createExamResultMutation.isPending ? "Ekleniyor..." : "Ekle"}
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setShowExamDialog(false)}
                className="flex-1"
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