import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Cell } from "recharts";
import { TrendingUp, Target, Activity, AlertTriangle, BarChart3, Brain, Loader2, List, BarChart as BarChartIcon, Calendar, Clock, RefreshCw } from "lucide-react";
import { ExamResult, ExamSubjectNet } from "@shared/schema";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopicStats {
  topic: string;
  wrongMentions: number;
  totalSessions: number;
  mentionFrequency: number;
}

interface PriorityTopic {
  topic: string;
  wrongMentions: number;
  mentionFrequency: number;
  priority: number;
  improvementNeeded: boolean;
  lastSeen: string;
  color: string;
}

export function AdvancedCharts() {
  // State for Priority Topics Analysis view toggle
  const [priorityViewMode, setPriorityViewMode] = useState<'chart' | 'text'>('text');
  // State for Error Frequency Analysis view toggle
  const [errorViewMode, setErrorViewMode] = useState<'chart' | 'text'>('text');
  // State for Bottom Charts toggle - NEW!
  const [bottomChartMode, setBottomChartMode] = useState<'net' | 'subject'>('net');
  // State for date filtering
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: examResults = [], isLoading: isLoadingExams } = useQuery<ExamResult[]>({
    queryKey: ["/api/exam-results"],
  });
  
  const { data: examSubjectNets = [], isLoading: isLoadingNets } = useQuery<ExamSubjectNet[]>({
    queryKey: ["/api/exam-subject-nets"],
  });

  // NEW: Topic analytics queries
  const { data: topicStats = [], isLoading: isLoadingTopics } = useQuery<TopicStats[]>({
    queryKey: ["/api/topics/stats"],
  });

  const { data: priorityTopics = [], isLoading: isLoadingPriority } = useQuery<PriorityTopic[]>({
    queryKey: ["/api/topics/priority"],
  });

  // Flashcard error analytics
  const { data: flashcardErrors = [], isLoading: isLoadingFlashcards } = useQuery<any[]>({
    queryKey: ["/api/flashcards/errors"],
  });

  const isLoading = isLoadingExams || isLoadingNets || isLoadingTopics || isLoadingPriority || isLoadingFlashcards;

  // Filter exam results based on date range
  const filteredExamResults = useMemo(() => {
    if (!useCustomDates) {
      return examResults;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return examResults.filter(exam => {
      const examDate = new Date(exam.exam_date);
      return examDate >= start && examDate <= end;
    });
  }, [examResults, useCustomDates, startDate, endDate]);

  // Prepare line chart data for net progression over time
  const netProgressionData = useMemo(() => {
    // Sort exams by date descending to get latest 10, then reverse for chronological order
    const sortedExams = [...filteredExamResults]
      .sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())
      .slice(0, 10)
      .reverse();
    
    return sortedExams.map((exam, index) => ({
      exam: `Deneme ${index + 1}`,
      examName: exam.exam_name.length > 15 ? `${exam.exam_name.substring(0, 15)}...` : exam.exam_name,
      date: new Date(exam.exam_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
      TYT: exam.tyt_net != null && exam.tyt_net !== '' ? parseFloat(exam.tyt_net.toString()) : null,
      AYT: exam.ayt_net != null && exam.ayt_net !== '' ? parseFloat(exam.ayt_net.toString()) : null,
      TYTTarget: 80, // Target line for TYT
      AYTTarget: 40  // Target line for AYT
    }));
  }, [filteredExamResults]);

  // Prepare enhanced hexagonal chart data for subject distribution (latest exam with fallback)
  const radarChartData = useMemo(() => {
    if (filteredExamResults.length === 0) return [];
    
    // Sort exams by date descending to get the actual latest exam
    const sortedExams = [...filteredExamResults].sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
    const latestExam = sortedExams[0];
    
    // Try to parse subjects data from the latest exam (new format)
    let subjectsData = {};
    try {
      subjectsData = latestExam.subjects_data ? JSON.parse(latestExam.subjects_data) : {};
    } catch (e) {
      console.error('Failed to parse subjects data:', e);
      subjectsData = {};
    }
    
    // Subject configuration with key mappings for both formats
    const subjectConfig: { [key: string]: { 
      max: number, 
      displayName: string, 
      emoji: string,
      legacyName?: string // For mapping from examSubjectNets
    } } = {
      'turkce': { max: 40, displayName: 'Türkçe', emoji: '📚', legacyName: 'Türkçe' },
      'matematik': { max: 40, displayName: 'Matematik', emoji: '📐', legacyName: 'Matematik' },
      'sosyal': { max: 20, displayName: 'Sosyal', emoji: '🏛️', legacyName: 'Sosyal Bilimler' },
      'fen': { max: 20, displayName: 'Fen', emoji: '🔬', legacyName: 'Fen Bilimleri' },
      'fizik': { max: 14, displayName: 'Fizik', emoji: '⚛️', legacyName: 'Fizik' },
      'kimya': { max: 13, displayName: 'Kimya', emoji: '🧪', legacyName: 'Kimya' },
      'biyoloji': { max: 13, displayName: 'Biyoloji', emoji: '🧬', legacyName: 'Biyoloji' }
    };
    
    // If subjects_data exists and has data, use new format
    if (Object.keys(subjectsData).length > 0) {
      return Object.entries(subjectsData).map(([subjectKey, data]: [string, any]) => {
        const correct = parseInt(data.correct) || 0;
        const wrong = parseInt(data.wrong) || 0;
        const blank = parseInt(data.blank) || 0;
        const config = subjectConfig[subjectKey];
        
        if (!config || (correct === 0 && wrong === 0 && blank === 0)) {
          return null;
        }
        
        const netScore = correct - (wrong * 0.25);
        const totalQuestions = correct + wrong + blank;
        const successRate = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
        
        return {
          subject: `${config.emoji} ${config.displayName}`,
          netScore: Math.max(0, netScore),
          successRate,
          fullMark: config.max
        };
      }).filter(Boolean);
    }
    
    // Fallback to examSubjectNets if subjects_data is not available
    const subjectGroups = examSubjectNets.reduce((acc, net) => {
      if (net.exam_id === latestExam.id) {
        const subject = net.subject;
        const netScore = parseFloat(net.net_score) || 0;
        const correct = parseInt(net.correct_count) || 0;
        const wrong = parseInt(net.wrong_count) || 0;
        const blank = parseInt(net.blank_count) || 0;
        const total = correct + wrong + blank;
        const successRate = total > 0 ? (correct / total) * 100 : 0;
        
        // Find matching config
        const configEntry = Object.entries(subjectConfig).find(([key, config]) => 
          config.legacyName === subject || config.displayName === subject
        );
        
        if (configEntry) {
          const [, config] = configEntry;
          acc.push({
            subject: `${config.emoji} ${config.displayName}`,
            netScore: Math.max(0, netScore),
            successRate,
            fullMark: config.max
          });
        }
      }
      return acc;
    }, [] as any[]);
    
    return subjectGroups;
  }, [filteredExamResults, examSubjectNets]);

  const lineChartData = netProgressionData;

  // NEW: Prepare priority topics data for bar chart
  const preparePriorityTopicsData = () => {
    return priorityTopics.slice(0, 8).map(topic => ({
      topic: topic.topic.length > 15 ? `${topic.topic.substring(0, 15)}...` : topic.topic,
      fullTopic: topic.topic,
      wrongMentions: topic.wrongMentions,
      priority: typeof topic.priority === 'number' ? topic.priority : 0,
      mentionFrequency: topic.mentionFrequency,
      improvementNeeded: topic.improvementNeeded || false,
      lastSeen: topic.lastSeen || new Date().toISOString(),
      color: topic.color
    }));
  };

  // NEW: Prepare combined topic error frequency data (from both question logs and flashcards)
  const prepareTopicErrorData = () => {
    // Combine topic stats from question logs and flashcard errors
    const topicErrorMap = new Map();
    
    // Add from topicStats (question logs)
    topicStats.forEach(stat => {
      const key = stat.topic;
      if (!topicErrorMap.has(key)) {
        topicErrorMap.set(key, { 
          topic: key, 
          errors: 0, 
          frequency: 0, 
          sessions: 0 
        });
      }
      const data = topicErrorMap.get(key);
      data.errors += stat.wrongMentions;
      data.frequency = stat.mentionFrequency;
      data.sessions = stat.totalSessions;
    });
    
    // Add from flashcard errors
    flashcardErrors.forEach(error => {
      const key = error.topic || 'Bilinmeyen Konu';
      if (!topicErrorMap.has(key)) {
        topicErrorMap.set(key, { 
          topic: key, 
          errors: 0, 
          frequency: 0, 
          sessions: 0 
        });
      }
      const data = topicErrorMap.get(key);
      data.errors += 1; // Each flashcard error counts as 1
    });
    
    // Convert to array and sort by error count
    const combinedData = Array.from(topicErrorMap.values())
      .sort((a, b) => b.errors - a.errors)
      .slice(0, 10);
    
    return combinedData;
  };

  const priorityTopicsData = preparePriorityTopicsData();
  const topicErrorData = prepareTopicErrorData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 space-x-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-lg font-medium">Analiz verileri yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* REDESIGNED: Horizontal Priority Topics Section */}
      <div className="bg-gradient-to-br from-red-50/60 via-card to-orange-50/40 dark:from-red-950/30 dark:via-card dark:to-orange-950/25 rounded-2xl border-2 border-red-200/40 dark:border-red-800/40 p-6 relative overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-tr from-orange-500/10 to-red-500/10 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 rounded-lg shadow-lg">
                <AlertTriangle className="h-5 w-5 text-white drop-shadow-lg" />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-red-700 bg-clip-text text-transparent">
                  🔥 Öncelik Konuları
                </h3>
                <p className="text-sm text-red-600/70 dark:text-red-400/70 font-medium">
                  Yanlış konu analizlerinden en çok çalışılması gerekenler
                </p>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground bg-red-100/60 dark:bg-red-900/30 px-3 py-1 rounded-full border border-red-200/50 dark:border-red-700/50">
              {priorityTopicsData.length} konu
            </div>
          </div>
            
          {/* HORIZONTAL Priority Topics Display */}
          {priorityTopicsData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h4 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Henüz öncelik verisi yok</h4>
              <p className="text-sm opacity-75 mb-3">Soru analizi yaparken yanlış konular ekleyince burada görünecek</p>
            </div>
          ) : (
            /* HORIZONTAL Grid Layout */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {priorityTopics.slice(0, 8).map((topic, index) => (
                <div 
                  key={index}
                  className="group bg-gradient-to-br from-white/90 to-red-50/50 dark:from-slate-800/90 dark:to-red-950/50 rounded-xl border border-red-200/50 dark:border-red-700/30 p-4 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
                  data-testid={`priority-topic-item-${index}`}
                >
                  {/* Priority Ranking Badge */}
                  <div className="absolute top-2 right-2">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shadow-lg ${
                      topic.improvementNeeded 
                        ? 'bg-gradient-to-br from-red-500 to-red-600' 
                        : topic.priority > 70 
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                          : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Topic Name */}
                    <h4 className="font-bold text-sm text-red-800 dark:text-red-200 group-hover:text-red-600 transition-colors pr-8">
                      {topic.topic.length > 20 ? `${topic.topic.substring(0, 20)}...` : topic.topic}
                    </h4>
                    
                    {/* Priority Percentage */}
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600 dark:text-red-400">
                        %{typeof topic.priority === 'number' ? topic.priority.toFixed(0) : topic.priority}
                      </div>
                      <div className="text-xs text-red-600/70 dark:text-red-400/70">öncelik</div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`text-center px-2 py-1 rounded-full text-xs font-medium ${
                      topic.improvementNeeded
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                        : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                    }`}>
                      {topic.improvementNeeded ? '🔥 Acil' : '⚠️ Dikkat'}
                    </div>
                    
                    {/* Wrong Mentions Count */}
                    <div className="text-center text-xs text-muted-foreground">
                      {topic.wrongMentions} yanlış
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-red-100 dark:bg-red-900/30 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-700 ${
                          topic.improvementNeeded 
                            ? 'bg-gradient-to-r from-red-500 to-red-600' 
                            : topic.priority > 70 
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                              : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        }`}
                        style={{ width: `${topic.priority}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MOVED: Error Frequency Analysis below Priority Topics */}
      <div className="bg-gradient-to-br from-blue-50/60 via-card to-purple-50/40 dark:from-blue-950/30 dark:via-card dark:to-purple-950/25 rounded-2xl border-2 border-blue-200/40 dark:border-blue-800/40 p-8 relative overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-xl shadow-lg">
                <Brain className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                  📊 Hata Sıklığı Analizi
                </h3>
                <p className="text-sm text-blue-600/70 dark:text-blue-400/70 font-medium">
                  Yanlış konu analizlerinden en sık yapılan hatalar
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-xs text-muted-foreground bg-blue-100/60 dark:bg-blue-900/30 px-4 py-2 rounded-full border border-blue-200/50 dark:border-blue-700/50">
                Toplam {topicErrorData.reduce((sum, item) => sum + item.errors, 0)} hata
              </div>
              
              {/* View Toggle Buttons */}
              <div className="flex bg-blue-100/50 dark:bg-blue-900/30 rounded-xl p-1 border border-blue-200/50 dark:border-blue-700/50">
                <Button
                  variant={errorViewMode === 'chart' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setErrorViewMode('chart')}
                  className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                    errorViewMode === 'chart' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                      : 'text-blue-600 dark:text-blue-400 hover:bg-blue-200/50 dark:hover:bg-blue-800/50'
                  }`}
                  data-testid="button-error-chart-view"
                >
                  <BarChartIcon className="h-4 w-4 mr-2" />
                  Grafik
                </Button>
                <Button
                  variant={errorViewMode === 'text' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setErrorViewMode('text')}
                  className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                    errorViewMode === 'text' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                      : 'text-blue-600 dark:text-blue-400 hover:bg-blue-200/50 dark:hover:bg-blue-800/50'
                  }`}
                  data-testid="button-error-text-view"
                >
                  <List className="h-4 w-4 mr-2" />
                  Liste
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-xl shadow-lg">
                  <Brain className="h-6 w-6 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                    📊 Hata Sıklığı Analizi
                  </h3>
                  <p className="text-sm text-blue-600/70 dark:text-blue-400/70 font-medium">
                    En sık yapılan hataların detayı
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-xs text-muted-foreground bg-blue-100/60 dark:bg-blue-900/30 px-4 py-2 rounded-full border border-blue-200/50 dark:border-blue-700/50">
                  Toplam {topicErrorData.reduce((sum, item) => sum + item.errors, 0)} hata
                </div>
                
                {/* View Toggle Buttons */}
                <div className="flex bg-blue-100/50 dark:bg-blue-900/30 rounded-xl p-1 border border-blue-200/50 dark:border-blue-700/50">
                  <Button
                    variant={errorViewMode === 'chart' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setErrorViewMode('chart')}
                    className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                      errorViewMode === 'chart' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-200/50 dark:hover:bg-blue-800/50'
                    }`}
                    data-testid="button-error-chart-view"
                  >
                    <BarChartIcon className="h-4 w-4 mr-2" />
                    Grafik
                  </Button>
                  <Button
                    variant={errorViewMode === 'text' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setErrorViewMode('text')}
                    className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                      errorViewMode === 'text' 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                        : 'text-blue-600 dark:text-blue-400 hover:bg-blue-200/50 dark:hover:bg-blue-800/50'
                    }`}
                    data-testid="button-error-text-view"
                  >
                    <List className="h-4 w-4 mr-2" />
                    Liste
                  </Button>
                </div>
              </div>
            </div>
            
            {topicErrorData.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <BarChart3 className="h-10 w-10 text-blue-500" />
                </div>
                <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">Henüz hata verisi bulunmuyor</h4>
                <p className="text-sm opacity-75 mb-4">Yanlış yaptığınız konuları işaretlemeye başlayın</p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-200"></div>
                </div>
              </div>
            ) : errorViewMode === 'chart' ? (
              /* Chart View */
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicErrorData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="topic"
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 11, textAnchor: 'end' }}
                      angle={-45}
                      height={80}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Hata Sayısı', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '13px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: any, name: any, props: any) => [
                        `${value} hata`,
                        '🚫 Hata Sayısı'
                      ]}
                      labelFormatter={(label: any) => `📚 ${label}`}
                    />
                    <Bar dataKey="errors" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              /* Text View */
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {topicErrorData.slice(0, 10).map((topic, index) => (
                  <div 
                    key={index}
                    className="group bg-gradient-to-r from-white/90 to-blue-50/50 dark:from-slate-800/90 dark:to-blue-950/50 rounded-2xl border border-blue-200/50 dark:border-blue-700/30 p-5 hover:shadow-xl transition-all duration-500 hover:scale-[1.02] relative overflow-hidden"
                    data-testid={`error-topic-item-${index}`}
                  >
                    {/* Error Ranking Badge */}
                    <div className="absolute top-3 left-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold shadow-lg ${
                        topic.errors >= 10 
                          ? 'bg-gradient-to-br from-red-500 to-red-600' 
                          : topic.errors >= 5 
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>
                        #{index + 1}
                      </div>
                    </div>
                    
                    <div className="pl-12 space-y-3">
                      {/* Topic Name and Error Count */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-lg text-blue-800 dark:text-blue-200 group-hover:text-blue-600 transition-colors">
                          {topic.topic}
                        </h4>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {topic.errors}
                          </div>
                          <div className="text-xs text-blue-600/70 dark:text-blue-400/70">hata</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-700 ${
                            topic.errors >= 10 
                              ? 'bg-gradient-to-r from-red-500 to-red-600' 
                              : topic.errors >= 5 
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                                : topic.errors >= 3
                                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                  : 'bg-gradient-to-r from-green-500 to-green-600'
                          }`}
                          style={{ width: `${Math.min((topic.errors / 10) * 100, 100)}%` }}
                        />
                      </div>
                      
                      {/* Frequency Indicator */}
                      <div className="text-xs text-blue-600/60 dark:text-blue-400/60">
                        Sıklık Oranı: %{typeof topic.frequency === 'number' ? topic.frequency.toFixed(1) : topic.frequency}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Bottom Charts - Single Column with Toggle */}
      <div className="bg-gradient-to-br from-indigo-50/60 via-card to-purple-50/40 dark:from-indigo-950/30 dark:via-card dark:to-purple-950/25 rounded-2xl border-2 border-indigo-200/40 dark:border-indigo-800/40 p-8 relative overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            {/* LEFT SIDE: Header + Date Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
                    📊 Gelişim & Dağılım Analizi
                  </h3>
                  <p className="text-sm text-indigo-600/70 dark:text-indigo-400/70 font-medium">
                    {bottomChartMode === 'net' ? 'Net ve soru verilerini görüntüle' : 'Ders başarı dağılımını analiz et'}
                  </p>
                </div>
              </div>
              
              {/* DATE CONTROLS - NOW ON LEFT SIDE */}
              {bottomChartMode === 'net' && (
                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                  <Button
                    variant={useCustomDates ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUseCustomDates(!useCustomDates)}
                    className={`text-xs px-3 py-2 font-medium transition-all duration-200 ${
                      useCustomDates
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                        : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600'
                    }`}
                    data-testid="button-chart-dates"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {useCustomDates ? 'Tarih Aralığı' : 'Tarih Seç'}
                  </Button>
                  {!useCustomDates && (
                    <div className="text-xs text-muted-foreground bg-indigo-100/60 dark:bg-indigo-900/30 px-3 py-2 rounded-lg border border-indigo-200/50 dark:border-indigo-700/50">
                      Tüm veriler
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* RIGHT SIDE: Chart Type Toggle Buttons - FIXED WIDTH */}
            <div className="flex-shrink-0">
              <div className="flex bg-indigo-100/50 dark:bg-indigo-900/30 rounded-xl p-1 border border-indigo-200/50 dark:border-indigo-700/50">
                <Button
                  variant={bottomChartMode === 'net' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBottomChartMode('net')}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
                    bottomChartMode === 'net' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200/50 dark:hover:bg-indigo-800/50'
                  }`}
                  data-testid="button-chart-net"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  📈 Net Gelişim
                </Button>
                <Button
                  variant={bottomChartMode === 'subject' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBottomChartMode('subject')}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
                    bottomChartMode === 'subject' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200/50 dark:hover:bg-indigo-800/50'
                  }`}
                  data-testid="button-chart-subject"
                >
                  <Target className="h-4 w-4 mr-2" />
                  🎯 Ders Dağılımı
                </Button>
              </div>
            </div>
          </div>
          
          {/* Conditional Content based on chart mode */}
          {bottomChartMode === 'net' ? (
            <div>

            {/* Custom Date Range Inputs */}
            {useCustomDates && (
              <div className="mb-6 p-4 bg-white/30 dark:bg-gray-900/30 rounded-xl border border-green-200/50 dark:border-green-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-green-700 dark:text-green-300">Başlangıç:</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm border-green-200 dark:border-green-700 focus:border-green-500 focus:ring-green-500"
                      data-testid="input-chart-start-date"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-green-700 dark:text-green-300">Bitiş:</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-sm border-green-200 dark:border-green-700 focus:border-green-500 focus:ring-green-500"
                      data-testid="input-chart-end-date"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const today = new Date();
                      const threeMonthsAgo = new Date();
                      threeMonthsAgo.setMonth(today.getMonth() - 3);
                      setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
                      setEndDate(today.toISOString().split('T')[0]);
                    }}
                    className="text-sm hover:bg-green-50 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
                    data-testid="button-chart-reset-dates"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Sıfırla
                  </Button>
                  <div className="text-sm text-muted-foreground bg-green-100/60 dark:bg-green-900/30 px-3 py-1 rounded-full border border-green-200/50 dark:border-green-700/50 font-medium">
                    {filteredExamResults.length} deneme
                  </div>
                </div>
              </div>
            )}
            
            {lineChartData.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Activity className="h-10 w-10 text-green-500" />
                </div>
                <h4 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">Yeterli deneme verisi bulunmuyor</h4>
                <p className="text-sm opacity-75 mb-4">En az 2 deneme kaydı gerekli</p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-green-600 animate-bounce delay-200"></div>
                </div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="currentColor" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      stroke="currentColor"
                      axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                    />
                    <YAxis 
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 11, fontWeight: 500 }}
                      stroke="currentColor"
                      axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                      label={{ value: 'Net Sayısı', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
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
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return data ? `📊 ${data.examName}` : label;
                      }}
                      formatter={(value: any, name: any) => [
                        `${value} net`,
                        name === 'TYT' ? '🎯 TYT Net' : name === 'AYT' ? '🎯 AYT Net' : 
                        name === 'TYTTarget' ? '📍 TYT Hedef' : '📍 AYT Hedef'
                      ]}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    
                    {/* Enhanced Target lines */}
                    <Line 
                      type="monotone" 
                      dataKey="TYTTarget" 
                      stroke="#3b82f6" 
                      strokeDasharray="8 4" 
                      strokeWidth={2}
                      dot={false} 
                      connectNulls={false}
                      name="TYT Hedef (80)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="AYTTarget" 
                      stroke="#059669" 
                      strokeDasharray="8 4" 
                      strokeWidth={2}
                      dot={false} 
                      connectNulls={false}
                      name="AYT Hedef (40)"
                    />
                    
                    {/* Enhanced Main lines */}
                    <Line 
                      type="monotone" 
                      dataKey="TYT" 
                      stroke="#3b82f6" 
                      strokeWidth={4}
                      dot={{ fill: '#3b82f6', strokeWidth: 3, r: 6, stroke: '#ffffff' }} 
                      activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 3, fill: '#ffffff' }}
                      connectNulls={false}
                      name="TYT Net"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="AYT" 
                      stroke="#059669" 
                      strokeWidth={4}
                      dot={{ fill: '#059669', strokeWidth: 3, r: 6, stroke: '#ffffff' }} 
                      activeDot={{ r: 8, stroke: '#059669', strokeWidth: 3, fill: '#ffffff' }}
                      connectNulls={false}
                      name="AYT Net"
                    />
                    
                    {/* Gradient Definitions */}
                    <defs>
                      <linearGradient id="tytGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1e40af" />
                      </linearGradient>
                      <linearGradient id="aytGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            </div>
          ) : (
            /* Subject Distribution Chart */
            <div>
            
            {radarChartData.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Target className="h-10 w-10 text-purple-500" />
                </div>
                <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">Ders verisi bulunmuyor</h4>
                <p className="text-sm opacity-75 mb-4">Deneme ekleyerek ders dağılımınızı analiz edin</p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce delay-200"></div>
                </div>
              </div>
            ) : (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarChartData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                    <PolarGrid className="opacity-30" stroke="currentColor" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      className="text-xs text-muted-foreground font-medium"
                      tick={{ fontSize: 11, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 'dataMax']}
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 10 }}
                    />
                    
                    {/* Net Score Radar */}
                    <Radar 
                      name="Net Puan" 
                      dataKey="netScore" 
                      stroke="#8b5cf6" 
                      fill="rgba(139, 92, 246, 0.2)" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                    />
                    
                    {/* Success Rate Radar */}
                    <Radar 
                      name="Başarı Oranı %" 
                      dataKey="successRate" 
                      stroke="#6366f1" 
                      fill="rgba(99, 102, 241, 0.1)" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    />
                    
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '13px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: any, name: any, props: any) => [
                        name === 'Net Puan' ? `${value} net` : `%${value}`,
                        name === 'Net Puan' ? '📊 Net Puan' : '📈 Başarı Oranı'
                      ]}
                      labelFormatter={(label: any) => `📚 ${label}`}
                    />
                    
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}