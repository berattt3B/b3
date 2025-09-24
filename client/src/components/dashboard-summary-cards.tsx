import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Target, BookOpen, Award, Brain } from "lucide-react";
import { ExamResult, QuestionLog } from "@shared/schema";

export function DashboardSummaryCards() {
  const { data: examResults = [] } = useQuery<ExamResult[]>({
    queryKey: ["/api/exam-results"],
  });
  
  const { data: questionLogs = [] } = useQuery<QuestionLog[]>({
    queryKey: ["/api/question-logs"],
  });
  

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
    
    return { totalQuestions, dailyAverage, totalCorrect, activeDays: uniqueDates.length };
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* TYT/AYT Net Averages Card */}
      <div className="bg-card rounded-xl border border-border p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              <h3 className="text-lg font-semibold text-foreground">Deneme Net Ortalamaları</h3>
            </div>
            <div className="text-xs text-muted-foreground">Son {netAverages.examCount} deneme</div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600" data-testid="text-tyt-average">
                  {netAverages.tytAvg}
                </div>
                <div className="text-sm text-muted-foreground">TYT Ortalama</div>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs font-medium text-blue-600">TYT</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600" data-testid="text-ayt-average">
                  {netAverages.aytAvg}
                </div>
                <div className="text-sm text-muted-foreground">AYT Ortalama</div>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-xs font-medium text-green-600">AYT</div>
              </div>
            </div>
            
            {netAverages.examCount === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Henüz deneme kaydı bulunmuyor
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Question Statistics Card */}
      <div className="bg-card rounded-xl border border-border p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
              <h3 className="text-lg font-semibold text-foreground">Soru İstatistikleri</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-foreground" data-testid="text-total-questions">
                  {questionStats.totalQuestions.toLocaleString('tr-TR')}
                </div>
                <div className="text-sm text-muted-foreground">Toplam Çözülen Soru</div>
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Brain className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600" data-testid="text-daily-average">
                  {questionStats.dailyAverage}
                </div>
                <div className="text-sm text-muted-foreground">Günlük Ortalama</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {questionStats.activeDays} aktif gün
              </div>
            </div>
            
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Doğru: {questionStats.totalCorrect}</span>
                <span className="text-muted-foreground">
                  Başarı: {(questionStats.totalQuestions - (questionLogs.reduce((total, log) => total + (Number(log.blank_count) || 0), 0))) > 0 ? ((questionStats.totalCorrect / (questionStats.totalQuestions - (questionLogs.reduce((total, log) => total + (Number(log.blank_count) || 0), 0)))) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Performance Card */}
      <div className="bg-card rounded-xl border border-border p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-orange-600" />
              <h3 className="text-lg font-semibold text-foreground">Ders Performansı</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            {subjectPerformance.strongest ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                    <div>
                      <div className="font-medium text-foreground" data-testid="text-strongest-subject">
                        {subjectPerformance.strongest.subject}
                      </div>
                      <div className="text-sm text-muted-foreground">En güçlü ders</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {subjectPerformance.strongest.successRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {subjectPerformance.strongest.totalQuestions} soru
                    </div>
                  </div>
                </div>
                
                {subjectPerformance.weakest && subjectPerformance.weakest.subject !== subjectPerformance.strongest.subject && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                      <div>
                        <div className="font-medium text-foreground" data-testid="text-weakest-subject">
                          {subjectPerformance.weakest.subject}
                        </div>
                        <div className="text-sm text-muted-foreground">Geliştirilmesi gereken</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        {subjectPerformance.weakest.successRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {subjectPerformance.weakest.totalQuestions} soru
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Yeterli veri bulunmuyor</p>
                <p className="text-xs">Her dersten en az 5 soru çözün</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}