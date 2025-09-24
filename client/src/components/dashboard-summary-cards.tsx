import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Target, BookOpen, Award, Brain, Zap, Calendar, BarChart3, Sparkles } from "lucide-react";
import { ExamResult, QuestionLog } from "@shared/schema";
import { useState, useEffect } from "react";

export function DashboardSummaryCards() {
  const [animationDelay, setAnimationDelay] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const { data: examResults = [], isLoading: examLoading } = useQuery<ExamResult[]>({
    queryKey: ["/api/exam-results"],
  });
  
  const { data: questionLogs = [], isLoading: questionLoading } = useQuery<QuestionLog[]>({
    queryKey: ["/api/question-logs"],
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = examLoading || questionLoading;
  

  // Calculate TYT/AYT averages from last 5 exams
  const calculateNetAverages = () => {
    // Sort by exam date descending to get actual last 5 exams
    const sortedExams = [...examResults].sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
    const last5Exams = sortedExams.slice(0, 5);
    const tytNets = last5Exams.filter(exam => exam.tyt_net !== undefined && exam.tyt_net !== null && exam.tyt_net !== '').map(exam => parseFloat(exam.tyt_net.toString()));
    const aytNets = last5Exams.filter(exam => exam.ayt_net !== undefined && exam.ayt_net !== null && exam.ayt_net !== '').map(exam => parseFloat(exam.ayt_net.toString()));
    
    const tytAvg = tytNets.length > 0 ? tytNets.reduce((sum, net) => sum + net, 0) / tytNets.length : 0;
    const aytAvg = aytNets.length > 0 ? aytNets.reduce((sum, net) => sum + net, 0) / aytNets.length : 0;
    
    return { tytAvg: tytAvg.toFixed(1), aytAvg: aytAvg.toFixed(1), examCount: last5Exams.length };
  };

  // Calculate total solved questions and daily average
  const calculateQuestionStats = () => {
    const totalCorrect = questionLogs.reduce((total, log) => total + (Number(log.correct_count) || 0), 0);
    const totalWrong = questionLogs.reduce((total, log) => total + (Number(log.wrong_count) || 0), 0);
    const totalBlank = questionLogs.reduce((total, log) => total + (Number(log.blank_count) || 0), 0);
    const totalQuestions = totalCorrect + totalWrong + totalBlank;
    
    // Calculate daily average based on unique dates
    const uniqueDates = Array.from(new Set(questionLogs.map(log => log.study_date)));
    const dailyAverage = uniqueDates.length > 0 ? (totalQuestions / uniqueDates.length).toFixed(1) : '0';
    
    // Find most active day
    const dayActivity: { [key: string]: number } = {};
    questionLogs.forEach(log => {
      const date = log.study_date;
      const count = (Number(log.correct_count) || 0) + (Number(log.wrong_count) || 0) + (Number(log.blank_count) || 0);
      dayActivity[date] = (dayActivity[date] || 0) + count;
    });
    
    let mostActiveDay: string | null = null;
    let maxActivity = 0;
    Object.entries(dayActivity).forEach(([date, count]) => {
      if (count > maxActivity) {
        maxActivity = count;
        mostActiveDay = date;
      }
    });
    
    return { 
      totalQuestions, 
      dailyAverage, 
      totalCorrect, 
      totalWrong,
      activeDays: uniqueDates.length,
      mostActiveDay,
      maxActivity
    };
  };

  // Calculate strongest and weakest subjects based on success rates
  const calculateSubjectPerformance = () => {
    const subjectStats: { [key: string]: { correct: number; attempted: number } } = {};
    
    questionLogs.forEach(log => {
      const subject = log.subject;
      const correct = Number(log.correct_count) || 0;
      const wrong = Number(log.wrong_count) || 0;
      const blank = Number(log.blank_count) || 0;
      // Calculate success rate excluding blanks (correct / (correct + wrong))
      const attempted = correct + wrong;
      const total = attempted + blank;
      
      if (!subjectStats[subject]) {
        subjectStats[subject] = { correct: 0, attempted: 0 };
      }
      
      subjectStats[subject].correct += correct;
      subjectStats[subject].attempted += attempted;
    });
    
    const subjects = Object.entries(subjectStats)
      .map(([subject, stats]) => ({
        subject,
        successRate: stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0,
        totalQuestions: stats.attempted
      }))
      .filter(s => s.totalQuestions >= 5) // Only consider subjects with at least 5 attempted questions
      .sort((a, b) => b.successRate - a.successRate);
    
    const strongest = subjects[0];
    const weakest = subjects[subjects.length - 1];
    
    return { strongest, weakest };
  };

  const netAverages = calculateNetAverages();
  const questionStats = calculateQuestionStats();
  const subjectPerformance = calculateSubjectPerformance();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-900/50 dark:to-gray-800/30 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-8 relative overflow-hidden animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-400/10 dark:to-blue-400/10"></div>
            <div className="relative space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Performans Özeti
          </h2>
        </div>
        <p className="text-muted-foreground">Deneme sonuçları ve soru çözüm istatistikleriniz</p>
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Enhanced TYT/AYT Net Averages Card */}
        <div className="group bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-8 relative overflow-hidden hover:scale-[1.02] transition-all duration-500 shadow-lg hover:shadow-2xl" data-testid="card-exam-averages">
          {/* Animated Background Elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-green-500/15 to-emerald-600/15 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
          
          {/* Sparkle Animation */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Deneme Ortalamaları</h3>
                  <p className="text-sm text-muted-foreground">Son {netAverages.examCount} deneme</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1" data-testid="text-tyt-average">
                      {netAverages.tytAvg}
                    </div>
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">TYT Net Ortalama</div>
                    <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((parseFloat(netAverages.tytAvg) / 120) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">TYT</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-green-200/30 dark:border-green-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-1" data-testid="text-ayt-average">
                      {netAverages.aytAvg}
                    </div>
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">AYT Net Ortalama</div>
                    <div className="w-full bg-green-100 dark:bg-green-900/30 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((parseFloat(netAverages.aytAvg) / 80) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400">AYT</span>
                  </div>
                </div>
              </div>
              
              {netAverages.examCount === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium mb-1">Henüz deneme kaydı bulunmuyor</p>
                  <p className="text-sm">İlk denemenizi ekleyerek başlayın</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Question Statistics Card */}
        <div className="group bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-8 relative overflow-hidden hover:scale-[1.02] transition-all duration-500 shadow-lg hover:shadow-2xl" data-testid="card-question-stats">
          {/* Animated Background Elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-orange-500/15 to-red-600/15 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
          
          {/* Energy Icon Animation */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Zap className="h-5 w-5 text-yellow-500 animate-bounce" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Soru İstatistikleri</h3>
                <p className="text-sm text-muted-foreground">
                  {questionStats.mostActiveDay ? (
                    <span className="flex items-center gap-1">
                      En Aktif Olunan Gün → 
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {new Date(questionStats.mostActiveDay).toLocaleDateString('tr-TR', { 
                          day: 'numeric', 
                          month: 'short'
                        })} ({questionStats.maxActivity} soru)
                      </span>
                    </span>
                  ) : (
                    'Henüz aktif gün bulunmuyor'
                  )}
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-purple-200/30 dark:border-purple-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-3xl font-black text-purple-600 dark:text-purple-400" data-testid="text-total-questions">
                      {questionStats.totalQuestions.toLocaleString('tr-TR')}
                    </div>
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Toplam Çözülen Soru</div>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400" data-testid="text-daily-average">
                      {questionStats.dailyAverage}
                    </div>
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Günlük Ortalama</div>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-700/30">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">
                    Doğru: <span className="font-bold">{questionStats.totalCorrect}</span>
                  </div>
                  <div className="text-sm font-medium text-red-700 dark:text-red-300">
                    Yanlış: <span className="font-bold">{questionStats.totalWrong}</span>
                  </div>
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">
                    Başarı: <span className="font-bold">{(questionStats.totalQuestions - (questionLogs.reduce((total, log) => total + (Number(log.blank_count) || 0), 0))) > 0 ? ((questionStats.totalCorrect / (questionStats.totalQuestions - (questionLogs.reduce((total, log) => total + (Number(log.blank_count) || 0), 0)))) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div className="w-full bg-green-200 dark:bg-green-800/30 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(questionStats.totalQuestions - (questionLogs.reduce((total, log) => total + (Number(log.blank_count) || 0), 0))) > 0 ? ((questionStats.totalCorrect / (questionStats.totalQuestions - (questionLogs.reduce((total, log) => total + (Number(log.blank_count) || 0), 0)))) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Subject Performance Card */}
        <div className="group bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30 p-8 relative overflow-hidden hover:scale-[1.02] transition-all duration-500 shadow-lg hover:shadow-2xl" data-testid="card-subject-performance">
          {/* Animated Background Elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-yellow-500/15 to-orange-600/15 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
          
          {/* Trophy Animation */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Award className="h-5 w-5 text-yellow-500 animate-pulse" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Ders Performansı</h3>
                <p className="text-sm text-muted-foreground">En güçlü ve zayıf dersler</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {subjectPerformance.strongest ? (
                <>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500 rounded-lg">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-green-700 dark:text-green-300" data-testid="text-strongest-subject">
                            {subjectPerformance.strongest.subject}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">En güçlü ders</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-green-600 dark:text-green-400">
                          {subjectPerformance.strongest.successRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          {subjectPerformance.strongest.totalQuestions} soru
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-green-200 dark:bg-green-800/30 rounded-full h-2 mt-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${subjectPerformance.strongest.successRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {subjectPerformance.weakest && subjectPerformance.weakest.subject !== subjectPerformance.strongest.subject && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-red-200/50 dark:border-red-700/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-red-700 dark:text-red-300" data-testid="text-weakest-subject">
                              {subjectPerformance.weakest.subject}
                            </div>
                            <div className="text-xs text-red-600 dark:text-red-400">Geliştirilmesi gereken</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-red-600 dark:text-red-400">
                            {subjectPerformance.weakest.successRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-400">
                            {subjectPerformance.weakest.totalQuestions} soru
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-red-200 dark:bg-red-800/30 rounded-full h-2 mt-3">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-pink-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${subjectPerformance.weakest.successRate}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="relative mb-4">
                    <Brain className="h-16 w-16 mx-auto opacity-30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-full animate-spin"></div>
                    </div>
                  </div>
                  <p className="font-medium text-lg mb-2">Yeterli veri bulunmuyor</p>
                  <p className="text-sm">Her dersten en az 5 soru çözün</p>
                  <div className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full text-xs font-medium text-purple-700 dark:text-purple-300 inline-block">
                    Analiz için veri topluyoruz...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}