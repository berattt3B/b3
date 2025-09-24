import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Cell } from "recharts";
import { TrendingUp, Target, Activity, AlertTriangle, BarChart3, Brain, Loader2, List, BarChart as BarChartIcon, Calendar, Clock } from "lucide-react";
import { ExamResult, ExamSubjectNet } from "@shared/schema";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

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

export function AdvancedCharts() {
  // State for Priority Topics Analysis view toggle
  const [priorityViewMode, setPriorityViewMode] = useState<'chart' | 'text'>('chart');
  // State for Error Frequency Analysis view toggle
  const [errorViewMode, setErrorViewMode] = useState<'chart' | 'text'>('chart');

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

  // Prepare line chart data for net progression over time
  const netProgressionData = useMemo(() => {
    // Sort exams by date descending to get latest 10, then reverse for chronological order
    const sortedExams = [...examResults]
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
  }, [examResults]);

  // Prepare radar chart data for subject distribution (latest exam)
  const radarChartData = useMemo(() => {
    if (examResults.length === 0) return [];
    
    // Sort exams by date descending to get the actual latest exam
    const sortedExams = [...examResults].sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
    const latestExam = sortedExams[0];
    const latestExamNets = examSubjectNets.filter(net => net.exam_id === latestExam.id);
    
    if (latestExamNets.length === 0) {
      return []; // No mock data - show empty state
    }
    
    // Subject max values for percentage calculation
    const subjectMaxValues: { [key: string]: number } = {
      'Türkçe': 40, 'Sosyal Bilimler': 20, 'Matematik': 40, 'Fizik': 14, 'Kimya': 13, 'Biyoloji': 13
    };
    
    return latestExamNets.map(net => {
      const netScore = parseFloat(net.net_score) || 0;
      const maxValue = subjectMaxValues[net.subject] || 40; // Default to 40 if subject not found
      const percentage = Math.min(Math.round((netScore / maxValue) * 100), 100); // Clamp to 100
      
      return {
        subject: net.subject,
        net: netScore,
        percentage: isNaN(percentage) ? 0 : percentage,
        maxPercentage: 100
      };
    });
  }, [examResults, examSubjectNets]);

  // NEW: Prepare priority topics data for bar chart
  const preparePriorityTopicsData = () => {
    return priorityTopics.slice(0, 8).map(topic => ({
      topic: topic.topic.length > 15 ? `${topic.topic.substring(0, 15)}...` : topic.topic,
      fullTopic: topic.topic,
      priority: topic.priority,
      improvementNeeded: topic.improvementNeeded,
      color: topic.improvementNeeded ? '#ef4444' : topic.priority > 70 ? '#f97316' : '#eab308'
    }));
  };

  // NEW: Prepare combined topic error frequency data (from both question logs and flashcards)
  const prepareTopicErrorData = () => {
    // Combine topic stats from question logs and flashcard errors
    const combinedStats = new Map<string, { errors: number; frequency: number; sessions: number; source: string[] }>();
    
    // Add stats from question logs
    topicStats.forEach(stat => {
      const existing = combinedStats.get(stat.topic) || { errors: 0, frequency: 0, sessions: 0, source: [] };
      existing.errors += stat.wrongMentions;
      existing.frequency += stat.mentionFrequency;
      existing.sessions += stat.totalSessions;
      existing.source.push('Soru Çözümü');
      combinedStats.set(stat.topic, existing);
    });
    
    // Add stats from flashcard errors - group by topic
    const flashcardTopicStats = new Map<string, number>();
    flashcardErrors.forEach(error => {
      const topic = error.topic || 'Genel';
      flashcardTopicStats.set(topic, (flashcardTopicStats.get(topic) || 0) + 1);
    });
    
    flashcardTopicStats.forEach((count, topic) => {
      const existing = combinedStats.get(topic) || { errors: 0, frequency: 0, sessions: 0, source: [] };
      existing.errors += count;
      existing.frequency += count * 10; // Weight flashcard errors higher
      if (!existing.source.includes('Tekrar Kartları')) {
        existing.source.push('Tekrar Kartları');
      }
      combinedStats.set(topic, existing);
    });
    
    // Convert to array and sort by total errors
    return Array.from(combinedStats.entries())
      .map(([topic, stats]) => ({
        topic: topic.length > 12 ? `${topic.substring(0, 12)}...` : topic,
        fullTopic: topic,
        errors: stats.errors,
        frequency: stats.frequency,
        sessions: stats.sessions,
        source: stats.source.join(' + '),
        color: stats.errors >= 8 ? '#dc2626' : stats.errors >= 5 ? '#ea580c' : stats.errors >= 3 ? '#f59e0b' : '#22c55e'
      }))
      .sort((a, b) => b.errors - a.errors)
      .slice(0, 8); // Show top 8 most problematic topics
  };

  const lineChartData = netProgressionData;
  const priorityTopicsData = preparePriorityTopicsData();
  const topicErrorData = prepareTopicErrorData();

  return (
    <div className="space-y-8">
      {/* First Row - Priority & Error Analysis Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Enhanced Priority Topics Analysis with Toggle */}
        <div className="bg-gradient-to-br from-red-50/60 via-card to-orange-50/40 dark:from-red-950/30 dark:via-card dark:to-orange-950/25 rounded-2xl border-2 border-red-200/40 dark:border-red-800/40 p-8 relative overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-orange-500/10 to-red-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 rounded-xl shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-red-700 bg-clip-text text-transparent">
                    🎯 Öncelik Konuları Analizi
                  </h3>
                  <p className="text-sm text-red-600/70 dark:text-red-400/70 font-medium">
                    En çok dikkat gerektiren konular
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-xs text-muted-foreground bg-red-100/60 dark:bg-red-900/30 px-4 py-2 rounded-full border border-red-200/50 dark:border-red-700/50">
                  {priorityTopicsData.length} sorunlu konu
                </div>
                
                {/* View Toggle Buttons */}
                <div className="flex bg-red-100/50 dark:bg-red-900/30 rounded-xl p-1 border border-red-200/50 dark:border-red-700/50">
                  <Button
                    variant={priorityViewMode === 'chart' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPriorityViewMode('chart')}
                    className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                      priorityViewMode === 'chart' 
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg' 
                        : 'text-red-600 dark:text-red-400 hover:bg-red-200/50 dark:hover:bg-red-800/50'
                    }`}
                    data-testid="button-priority-chart-view"
                  >
                    <BarChartIcon className="h-4 w-4 mr-2" />
                    Grafik
                  </Button>
                  <Button
                    variant={priorityViewMode === 'text' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPriorityViewMode('text')}
                    className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                      priorityViewMode === 'text' 
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg' 
                        : 'text-red-600 dark:text-red-400 hover:bg-red-200/50 dark:hover:bg-red-800/50'
                    }`}
                    data-testid="button-priority-text-view"
                  >
                    <List className="h-4 w-4 mr-2" />
                    Liste
                  </Button>
                </div>
              </div>
            </div>
            
            {priorityTopicsData.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>
                <h4 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Henüz öncelik verisi yok</h4>
                <p className="text-sm opacity-75 mb-4">Yanlış konular ekleyince burada görünecek</p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-bounce delay-200"></div>
                </div>
              </div>
            ) : priorityViewMode === 'chart' ? (
              /* Chart View */
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityTopicsData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                      label={{ value: 'Öncelik %', angle: -90, position: 'insideLeft' }}
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
                        `%${value.toFixed(1)}`,
                        props.payload.improvementNeeded ? '🔥 Acil Öncelik' : '⚠️ Dikkat Gerekli'
                      ]}
                      labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullTopic || label}
                    />
                    <Bar dataKey="priority" radius={[4, 4, 0, 0]}>
                      {priorityTopicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              /* Text View */
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {priorityTopics.slice(0, 10).map((topic, index) => (
                  <div 
                    key={index}
                    className="group bg-gradient-to-r from-white/90 to-red-50/50 dark:from-slate-800/90 dark:to-red-950/50 rounded-2xl border border-red-200/50 dark:border-red-700/30 p-5 hover:shadow-xl transition-all duration-500 hover:scale-[1.02] relative overflow-hidden"
                    data-testid={`priority-topic-item-${index}`}
                  >
                    {/* Priority Ranking Badge */}
                    <div className="absolute top-3 left-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold shadow-lg ${
                        topic.improvementNeeded 
                          ? 'bg-gradient-to-br from-red-500 to-red-600' 
                          : topic.priority > 70 
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                            : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                      }`}>
                        #{index + 1}
                      </div>
                    </div>
                    
                    <div className="pl-12 space-y-3">
                      {/* Topic Name and Priority */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-lg text-red-800 dark:text-red-200 group-hover:text-red-600 transition-colors">
                          {topic.topic}
                        </h4>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            %{topic.priority.toFixed(1)}
                          </div>
                          <div className="text-xs text-red-600/70 dark:text-red-400/70">öncelik</div>
                        </div>
                      </div>
                      
                      {/* Status and Last Seen */}
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          topic.improvementNeeded
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                            : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                        }`}>
                          {topic.improvementNeeded ? (
                            <>
                              <AlertTriangle className="h-3 w-3" />
                              🔥 Acil Öncelik
                            </>
                          ) : (
                            <>
                              <Target className="h-3 w-3" />
                              ⚠️ Dikkat Gerekli
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-red-600/70 dark:text-red-400/70">
                          <Clock className="h-3 w-3" />
                          Son: {new Date(topic.lastSeen).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-red-100 dark:bg-red-900/30 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-700 ${
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

        {/* Enhanced Error Frequency Analysis with Toggle */}
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
                        `Kaynak: ${props.payload.source}`
                      ]}
                      labelFormatter={(label: any, payload: any) => payload?.[0]?.payload?.fullTopic || label}
                    />
                    <Bar dataKey="errors" radius={[4, 4, 0, 0]}>
                      {topicErrorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
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
                    {/* Error Count Badge */}
                    <div className="absolute top-3 left-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold shadow-lg ${
                        topic.errors >= 8 
                          ? 'bg-gradient-to-br from-red-500 to-red-600' 
                          : topic.errors >= 5 
                            ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                            : topic.errors >= 3
                              ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                              : 'bg-gradient-to-br from-green-500 to-green-600'
                      }`}>
                        {topic.errors}
                      </div>
                    </div>
                    
                    <div className="pl-12 space-y-3">
                      {/* Topic Name and Error Count */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-lg text-blue-800 dark:text-blue-200 group-hover:text-blue-600 transition-colors">
                          {topic.fullTopic}
                        </h4>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {topic.errors}
                          </div>
                          <div className="text-xs text-blue-600/70 dark:text-blue-400/70">hata sayısı</div>
                        </div>
                      </div>
                      
                      {/* Source and Frequency */}
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          topic.errors >= 8
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                            : topic.errors >= 5
                              ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                              : topic.errors >= 3
                                ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                                : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                        }`}>
                          <Activity className="h-3 w-3" />
                          {topic.source}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-blue-600/70 dark:text-blue-400/70">
                          <BarChart3 className="h-3 w-3" />
                          {topic.sessions} oturum
                        </div>
                      </div>
                      
                      {/* Error Progress Bar */}
                      <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-700 ${
                            topic.errors >= 8 
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
                        Sıklık Oranı: %{topic.frequency.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Second Row - Net Progress and Subject Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Enhanced Net Progress Chart */}
        <div className="bg-gradient-to-br from-green-50/60 via-card to-teal-50/40 dark:from-green-950/30 dark:via-card dark:to-teal-950/25 rounded-2xl border-2 border-green-200/40 dark:border-green-800/40 p-8 relative overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-teal-500/10 to-green-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-green-500 via-teal-500 to-green-600 rounded-xl shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-green-700 bg-clip-text text-transparent">
                    📈 Net Gelişim Grafiği
                  </h3>
                  <p className="text-sm text-green-600/70 dark:text-green-400/70 font-medium">
                    Deneme performans ilerlemesi
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-green-100/60 dark:bg-green-900/30 px-4 py-2 rounded-full border border-green-200/50 dark:border-green-700/50">
                Son {lineChartData.length} deneme
              </div>
            </div>
            
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
                      stroke="#10b981" 
                      strokeDasharray="8 4" 
                      strokeWidth={2}
                      dot={false} 
                      connectNulls={false}
                      name="AYT Hedef (40)"
                    />
                    
                    {/* Enhanced Actual performance lines */}
                    <Line 
                      type="monotone" 
                      dataKey="TYT" 
                      stroke="url(#tytGradient)" 
                      strokeWidth={4}
                      dot={{ fill: '#1e40af', strokeWidth: 3, r: 6, stroke: '#ffffff' }} 
                      activeDot={{ r: 8, stroke: '#1e40af', strokeWidth: 3, fill: '#ffffff' }}
                      connectNulls={false}
                      name="TYT Net"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="AYT" 
                      stroke="url(#aytGradient)" 
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
        </div>

        {/* Enhanced Subject Distribution Radar Chart */}
        <div className="bg-gradient-to-br from-purple-50/60 via-card to-indigo-50/40 dark:from-purple-950/30 dark:via-card dark:to-indigo-950/25 rounded-2xl border-2 border-purple-200/40 dark:border-purple-800/40 p-8 relative overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
                    🎯 Ders Net Dağılımı
                  </h3>
                  <p className="text-sm text-purple-600/70 dark:text-purple-400/70 font-medium">
                    Ders bazında performans analizi
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-purple-100/60 dark:bg-purple-900/30 px-4 py-2 rounded-full border border-purple-200/50 dark:border-purple-700/50">
                {examResults.length > 0 && radarChartData.length > 0 ? 'Son deneme' : 'Veri yok'}
              </div>
            </div>
            
            {radarChartData.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Target className="h-10 w-10 text-purple-500" />
                </div>
                <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">Ders net verisi bulunmuyor</h4>
                <p className="text-sm opacity-75 mb-4">Deneme ekleyip ders netlerini girin</p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce delay-200"></div>
                </div>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarChartData} margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                    <PolarGrid 
                      className="opacity-30" 
                      stroke="currentColor"
                      strokeWidth={1}
                      fill="transparent"
                    />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      className="text-xs text-foreground"
                      tick={{ fontSize: 12, fontWeight: 600, fill: 'currentColor' }}
                      tickFormatter={(value) => value.length > 8 ? `${value.substring(0, 8)}...` : value}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      className="text-xs text-muted-foreground"
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      tickCount={6}
                      stroke="currentColor"
                      strokeWidth={1}
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
                        `%${typeof value === 'number' ? value.toFixed(1) : value}`,
                        '📊 Başarı Oranı'
                      ]}
                      labelFormatter={(label) => `📚 ${label}`}
                    />
                    <Radar
                      name="percentage"
                      dataKey="percentage"
                      stroke="url(#radarGradient)"
                      fill="url(#radarFillGradient)"
                      fillOpacity={0.2}
                      strokeWidth={3}
                      dot={{ fill: "url(#radarDotGradient)", strokeWidth: 2, r: 5, stroke: '#ffffff' }}
                      activeDot={{ r: 7, stroke: '#8b5cf6', strokeWidth: 3, fill: '#ffffff' }}
                    />
                    
                    {/* Enhanced Gradient Definitions */}
                    <defs>
                      <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                      <radialGradient id="radarFillGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.1" />
                      </radialGradient>
                      <linearGradient id="radarDotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}