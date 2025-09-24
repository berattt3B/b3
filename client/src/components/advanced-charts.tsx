import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { TrendingUp, Target, Brain, AlertTriangle, BarChart3, Book, Calculator, Atom, FlaskConical, Dna, User, Calendar, TrendingDown, Check, CheckCircle } from "lucide-react";
import { ExamResult, QuestionLog } from "@shared/schema";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface MissingTopic {
  topic: string;
  subject: string;
  source: 'exam' | 'question';
  frequency: number;
  lastSeen: string;
  difficulty?: string;
  category?: string;
}

interface ExamNetData {
  date: string;
  examName: string;
  tytNet: number;
  aytNet: number;
  tytTarget: number;
  aytTarget: number;
}

interface SubjectAnalysisData {
  subject: string;
  correct: number;
  wrong: number;
  totalQuestions: number;
  netScore: number;
  color: string;
}

export function AdvancedCharts() {
  const [analysisMode, setAnalysisMode] = useState<'net' | 'subject'>('net');
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [celebratingTopics, setCelebratingTopics] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: examResults = [], isLoading: isLoadingExams } = useQuery<ExamResult[]>({
    queryKey: ["/api/exam-results"],
  });
  
  const { data: questionLogs = [], isLoading: isLoadingQuestions } = useQuery<QuestionLog[]>({
    queryKey: ["/api/question-logs"],
  });

  const isLoading = isLoadingExams || isLoadingQuestions;

  // Process Missing Topics - combining data from both question logs and exam results
  const missingTopics = useMemo(() => {
    const topicMap = new Map<string, MissingTopic>();

    // Process question logs
    questionLogs.forEach(log => {
      if (log.wrong_topics && log.wrong_topics.length > 0) {
        log.wrong_topics.forEach(topicItem => {
          // Handle both string[] and object[] formats
          const topic = typeof topicItem === 'string' ? topicItem : topicItem.topic;
          if (topic) {
            const key = `${log.subject}-${topic}`;
            if (topicMap.has(key)) {
              const existing = topicMap.get(key)!;
              existing.frequency += 1;
              existing.lastSeen = log.study_date > existing.lastSeen ? log.study_date : existing.lastSeen;
            } else {
              topicMap.set(key, {
                topic,
                subject: log.subject,
                source: 'question',
                frequency: 1,
                lastSeen: log.study_date,
                difficulty: typeof topicItem === 'object' ? topicItem.difficulty : undefined,
                category: typeof topicItem === 'object' ? topicItem.category : undefined
              });
            }
          }
        });
      }
    });

    // Process exam results - we need to extract missing topics from subjects_data
    examResults.forEach(exam => {
      if (exam.subjects_data) {
        try {
          const subjectsData = JSON.parse(exam.subjects_data);
          Object.entries(subjectsData).forEach(([subjectKey, data]: [string, any]) => {
            if (data.wrong_topics && data.wrong_topics.length > 0) {
              const subjectNameMap: {[key: string]: string} = {
                'turkce': 'Türkçe',
                'matematik': 'Matematik',
                'sosyal': 'Sosyal',
                'fen': 'Fen',
                'fizik': 'Fizik',
                'kimya': 'Kimya',
                'biyoloji': 'Biyoloji'
              };
              const subjectName = subjectNameMap[subjectKey] || subjectKey;
              
              data.wrong_topics.forEach((topic: string) => {
                const key = `${subjectName}-${topic}`;
                if (topicMap.has(key)) {
                  const existing = topicMap.get(key)!;
                  existing.frequency += 1;
                  existing.lastSeen = exam.exam_date > existing.lastSeen ? exam.exam_date : existing.lastSeen;
                } else {
                  topicMap.set(key, {
                    topic,
                    subject: subjectName,
                    source: 'exam',
                    frequency: 1,
                    lastSeen: exam.exam_date
                  });
                }
              });
            }
          });
        } catch (e) {
          console.error('Error parsing subjects_data:', e);
        }
      }
    });

    return Array.from(topicMap.values()).sort((a, b) => b.frequency - a.frequency);
  }, [questionLogs, examResults]);

  // Process Net Analysis Data
  const netAnalysisData = useMemo(() => {
    return examResults.map(exam => ({
      date: new Date(exam.exam_date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
      examName: exam.exam_name,
      tytNet: parseFloat(exam.tyt_net) || 0,
      aytNet: parseFloat(exam.ayt_net) || 0,
      tytTarget: 90,
      aytTarget: 50,
      sortDate: exam.exam_date
    })).sort((a, b) => new Date(a.sortDate).getTime() - new Date(b.sortDate).getTime());
  }, [examResults]);

  // Process Subject Analysis Data - For both card view and radar chart
  const subjectAnalysisData = useMemo(() => {
    const subjectMap = new Map<string, { correct: number; wrong: number; total: number }>();
    
    // Process exam results for subject data
    examResults.forEach(exam => {
      if (exam.subjects_data) {
        try {
          const subjectsData = JSON.parse(exam.subjects_data);
          Object.entries(subjectsData).forEach(([subjectKey, data]: [string, any]) => {
            const subjectNameMap: {[key: string]: string} = {
              'turkce': 'Türkçe',
              'matematik': 'Matematik', 
              'sosyal': 'Sosyal',
              'fen': 'Fen',
              'fizik': 'Fizik',
              'kimya': 'Kimya',
              'biyoloji': 'Biyoloji'
            };
            const subjectName = subjectNameMap[subjectKey] || subjectKey;
            const correct = parseInt(data.correct) || 0;
            const wrong = parseInt(data.wrong) || 0;
            
            if (correct > 0 || wrong > 0) {
              if (subjectMap.has(subjectName)) {
                const existing = subjectMap.get(subjectName)!;
                existing.correct += correct;
                existing.wrong += wrong;
                existing.total += (correct + wrong);
              } else {
                subjectMap.set(subjectName, {
                  correct,
                  wrong,
                  total: correct + wrong
                });
              }
            }
          });
        } catch (e) {
          console.error('Error parsing subjects_data:', e);
        }
      }
    });

    const subjectColors: {[key: string]: string} = {
      'Türkçe': '#ef4444',
      'Matematik': '#3b82f6', 
      'Sosyal': '#f59e0b',
      'Fen': '#10b981',
      'Fizik': '#8b5cf6',
      'Kimya': '#ec4899',
      'Biyoloji': '#06b6d4'
    };

    return Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      correct: data.correct,
      wrong: data.wrong,
      totalQuestions: data.total,
      netScore: data.correct - (data.wrong * 0.25),
      color: subjectColors[subject] || '#6b7280',
      correctRate: data.total > 0 ? (data.correct / data.total) * 100 : 0,
      wrongRate: data.total > 0 ? (data.wrong / data.total) * 100 : 0
    }));
  }, [examResults]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-lg border p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analiz verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Missing Topics Section - Bigger and More Modern */}
      <Card className="bg-gradient-to-br from-red-50/70 via-white to-orange-50/60 dark:from-red-950/40 dark:via-slate-800/60 dark:to-orange-950/30 backdrop-blur-lg border-2 border-red-200/40 dark:border-red-800/40 shadow-2xl hover:shadow-3xl transition-all duration-700 group relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-red-500/15 to-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-orange-500/15 to-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-red-400/5 to-orange-400/5 rounded-full blur-2xl"></div>
        
        <CardHeader className="bg-gradient-to-r from-red-500/15 to-orange-500/15 rounded-t-lg border-b border-red-200/40 pb-8 relative">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-red-500 via-red-600 to-orange-500 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
              <AlertTriangle className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                🎯 Eksik Olduğum Konular
              </CardTitle>
              <p className="text-sm text-red-600/70 dark:text-red-400/70 font-medium mt-2">
                Soru çözümü ve deneme sınavlarından toplanan eksik konu analizi
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-8 relative min-h-[400px]">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full mb-6 shadow-lg">
                <div className="animate-spin w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full"></div>
              </div>
              <h4 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-3">Eksik konular analiz ediliyor...</h4>
              <div className="flex justify-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce"></div>
                <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce delay-100"></div>
                <div className="w-3 h-3 rounded-full bg-red-600 animate-bounce delay-200"></div>
              </div>
            </div>
          ) : missingTopics.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Target className="h-12 w-12 text-green-500" />
              </div>
              <h4 className="text-2xl font-semibold text-green-700 dark:text-green-300 mb-3">Harika! Henüz eksik konu yok</h4>
              <p className="text-base opacity-75">Soru çözümü ve deneme sınavı ekledikçe eksik konular burada görünecek</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {missingTopics.slice(0, 15).map((topic, index) => (
                <div key={index} className={`bg-white/70 dark:bg-gray-900/70 rounded-2xl p-6 border border-red-200/50 dark:border-red-700/50 hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm relative overflow-hidden group/card ${
                  celebratingTopics.has(`${topic.subject}-${topic.topic}`) ? 'animate-pulse bg-green-100/80 dark:bg-green-900/40 border-green-300 dark:border-green-600' : ''
                } ${
                  completedTopics.has(`${topic.subject}-${topic.topic}`) && !celebratingTopics.has(`${topic.subject}-${topic.topic}`) ? 'opacity-50 transform scale-95' : ''
                }`}>
                  <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${
                    celebratingTopics.has(`${topic.subject}-${topic.topic}`) 
                      ? 'bg-gradient-to-br from-green-200/60 to-emerald-200/40 dark:from-green-800/40 dark:to-emerald-800/30 opacity-100' 
                      : 'from-red-50/50 to-orange-50/30 dark:from-red-950/20 dark:to-orange-950/10 opacity-0 group-hover/card:opacity-100'
                  }`}></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-bold text-red-700 dark:text-red-300">{topic.subject}</span>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={completedTopics.has(`${topic.subject}-${topic.topic}`)}
                          onCheckedChange={(checked) => {
                            const topicKey = `${topic.subject}-${topic.topic}`;
                            if (checked) {
                              setCompletedTopics(prev => new Set([...prev, topicKey]));
                              setCelebratingTopics(prev => new Set([...prev, topicKey]));
                              toast({ title: "🎉 Tebrikler!", description: `${topic.topic} konusunu tamamladınız!` });
                              
                              // Remove celebrating animation after 3 seconds
                              setTimeout(() => {
                                setCelebratingTopics(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(topicKey);
                                  return newSet;
                                });
                                // Remove completed topic after celebration
                                setTimeout(() => {
                                  setCompletedTopics(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(topicKey);
                                    return newSet;
                                  });
                                }, 500);
                              }, 3000);
                            }
                          }}
                          className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-base text-gray-700 dark:text-gray-300 font-medium leading-relaxed flex-1">{topic.topic}</p>
                      {celebratingTopics.has(`${topic.subject}-${topic.topic}`) && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 animate-bounce">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-bold">Tebrikler!</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className={`px-3 py-1.5 rounded-full font-medium shadow-sm ${topic.source === 'exam' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>
                        {topic.source === 'exam' ? '🎯 Deneme' : '📝 Soru'}
                      </span>
                      <span className="text-xs font-medium">{new Date(topic.lastSeen).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Error Frequency Analysis Section - Bigger and More Modern */}
      <Card className="bg-gradient-to-br from-orange-50/70 via-white to-red-50/60 dark:from-orange-950/40 dark:via-slate-800/60 dark:to-red-950/30 backdrop-blur-lg border-2 border-orange-200/40 dark:border-orange-800/40 shadow-2xl hover:shadow-3xl transition-all duration-700 group relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-orange-500/15 to-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-red-500/15 to-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-orange-400/5 to-red-400/5 rounded-full blur-2xl"></div>
        
        <CardHeader className="bg-gradient-to-r from-orange-500/15 to-red-500/15 rounded-t-lg border-b border-orange-200/40 pb-8 relative">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110">
              <Brain className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                🔍 Hata Sıklığı Analizi
              </CardTitle>
              <p className="text-sm text-orange-600/70 dark:text-orange-400/70 font-medium mt-2">
                Yanlış konu analizi ve kategori bazında hata sıklığı takibi
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-8 relative min-h-[400px]">
          {(() => {
            // Collect ALL wrong topic data from both question logs and exam results
            let allWrongTopicData: Array<{
              topic: string;
              source: 'question' | 'exam';
              subject: string;
              exam_type: string;
              wrong_count: number;
              study_date: string;
              difficulty?: 'kolay' | 'orta' | 'zor';
              category?: 'kavram' | 'hesaplama' | 'analiz' | 'dikkatsizlik';
            }> = [];

            // Process question logs - both structured (wrong_topics_json) and simple (wrong_topics)
            questionLogs.forEach(log => {
              if (log.wrong_topics && log.wrong_topics.length > 0) {
                // First try to parse structured data from wrong_topics_json
                let structuredTopics: Array<{
                  topic: string;
                  difficulty: 'kolay' | 'orta' | 'zor';
                  category: 'kavram' | 'hesaplama' | 'analiz' | 'dikkatsizlik';
                }> = [];
                
                try {
                  if (log.wrong_topics_json && log.wrong_topics_json.trim() !== '' && log.wrong_topics_json !== 'null' && log.wrong_topics_json !== '[]') {
                    structuredTopics = JSON.parse(log.wrong_topics_json);
                  }
                } catch (e) {
                  console.error('Error parsing wrong_topics_json:', e);
                }

                // Add structured topics if available
                if (structuredTopics.length > 0) {
                  structuredTopics.forEach(topicItem => {
                    allWrongTopicData.push({
                      topic: topicItem.topic,
                      source: 'question',
                      subject: log.subject,
                      exam_type: log.exam_type,
                      wrong_count: parseInt(log.wrong_count) || 0,
                      study_date: log.study_date,
                      difficulty: topicItem.difficulty,
                      category: topicItem.category
                    });
                  });
                } else {
                  // Fall back to simple wrong_topics array
                  log.wrong_topics.forEach(topic => {
                    const topicName = typeof topic === 'string' ? topic : topic.topic || '';
                    if (topicName) {
                      allWrongTopicData.push({
                        topic: topicName,
                        source: 'question',
                        subject: log.subject,
                        exam_type: log.exam_type,
                        wrong_count: parseInt(log.wrong_count) || 0,
                        study_date: log.study_date
                      });
                    }
                  });
                }
              }
            });

            // Process exam results
            examResults.forEach(exam => {
              if (exam.subjects_data) {
                try {
                  const subjectsData = JSON.parse(exam.subjects_data);
                  Object.entries(subjectsData).forEach(([subjectKey, data]: [string, any]) => {
                    if (data.wrong_topics && data.wrong_topics.length > 0) {
                      const subjectNameMap: {[key: string]: string} = {
                        'turkce': 'Türkçe',
                        'matematik': 'Matematik',
                        'sosyal': 'Sosyal',
                        'fen': 'Fen',
                        'fizik': 'Fizik',
                        'kimya': 'Kimya',
                        'biyoloji': 'Biyoloji'
                      };
                      const subjectName = subjectNameMap[subjectKey] || subjectKey;
                      
                      data.wrong_topics.forEach((topic: string) => {
                        allWrongTopicData.push({
                          topic: topic,
                          source: 'exam',
                          subject: subjectName,
                          exam_type: exam.exam_type || 'TYT',
                          wrong_count: parseInt(data.wrong) || 0,
                          study_date: exam.exam_date
                        });
                      });
                    }
                  });
                } catch (e) {
                  console.error('Error parsing subjects_data:', e);
                }
              }
            });

            // Group by topic and aggregate data
            const topicAggregated = allWrongTopicData.reduce((acc, item) => {
              const key = `${item.subject}-${item.topic}`;
              if (acc[key]) {
                acc[key].frequency += 1;
                acc[key].totalWrong += item.wrong_count;
                if (item.study_date > acc[key].lastSeen) {
                  acc[key].lastSeen = item.study_date;
                  acc[key].difficulty = item.difficulty;
                  acc[key].category = item.category;
                }
              } else {
                acc[key] = {
                  topic: item.topic,
                  subject: item.subject,
                  exam_type: item.exam_type,
                  frequency: 1,
                  totalWrong: item.wrong_count,
                  lastSeen: item.study_date,
                  difficulty: item.difficulty,
                  category: item.category,
                  sources: [item.source]
                };
              }
              return acc;
            }, {} as {[key: string]: any});

            const wrongTopicAnalysisData = Object.values(topicAggregated).sort((a: any, b: any) => b.frequency - a.frequency);
            
            if (isLoading) {
              return (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-full mb-6 shadow-lg">
                    <div className="animate-spin w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full"></div>
                  </div>
                  <h4 className="text-xl font-semibold text-orange-700 dark:text-orange-300 mb-3">Hata sıklığı analiz ediliyor...</h4>
                  <div className="flex justify-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce delay-100"></div>
                    <div className="w-3 h-3 rounded-full bg-orange-600 animate-bounce delay-200"></div>
                  </div>
                </div>
              );
            }
            
            if (wrongTopicAnalysisData.length === 0) {
              return (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Brain className="h-12 w-12 text-blue-500" />
                  </div>
                  <h4 className="text-2xl font-semibold text-blue-700 dark:text-blue-300 mb-3">Henüz hata analizi verisi yok</h4>
                  <p className="text-base opacity-75">Soru veya deneme ekleyip yanlış konuları girdikçe hata sıklığınız burada görünecek</p>
                </div>
              );
            }
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {wrongTopicAnalysisData.slice(0, 15).map((item: any, index) => (
                  <div key={index} className="bg-white/70 dark:bg-gray-900/70 rounded-2xl p-6 border border-orange-200/50 dark:border-orange-700/50 hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm relative overflow-hidden group/card">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-red-50/30 dark:from-orange-950/20 dark:to-red-950/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full shadow-md ${
                            item.exam_type === 'TYT' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}></div>
                          <span className="text-base font-bold text-orange-700 dark:text-orange-300">
                            {item.exam_type} {item.subject}
                          </span>
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-400 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 px-3 py-1.5 rounded-full font-semibold shadow-md">
                          {item.frequency} Kez
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="text-sm bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl">
                          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{item.topic}</div>
                          <div className="flex gap-2 flex-wrap">
                            {item.difficulty && (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                item.difficulty === 'kolay' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                item.difficulty === 'orta' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              }`}>
                                📊 {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                              </span>
                            )}
                            {item.category && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
                                🔍 {item.category === 'kavram' ? 'Kavram Eksikliği' :
                                    item.category === 'hesaplama' ? 'Hesaplama Hatası' :
                                    item.category === 'analiz' ? 'Analiz Sorunu' : 'Dikkatsizlik'}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              item.sources && item.sources.includes('exam') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                            }`}>
                              {item.sources && item.sources.includes('exam') ? '🎯 Deneme' : '📝 Soru'} Hatası
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-orange-200/40 dark:border-orange-700/40">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">{new Date(item.lastSeen).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          <span className="font-medium">Son hata</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Analysis Section */}
      <Card className="bg-gradient-to-br from-indigo-50/50 via-card to-purple-50/50 dark:from-indigo-950/30 dark:via-card dark:to-purple-950/30 backdrop-blur-sm border-2 border-indigo-200/30 dark:border-indigo-800/30 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-t-lg border-b border-indigo-200/30">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-indigo-500" />
                📊 Net & Ders Analizi
              </CardTitle>
              <p className="text-sm text-indigo-600/70 dark:text-indigo-400/70 font-medium">
                {analysisMode === 'net' ? 'Deneme net gelişim grafiği ve hedef karşılaştırması' : 'Ders bazında doğru/yanlış dağılımı'}
              </p>
            </div>
            
            {/* Analysis Mode Toggle */}
            <div className="flex bg-indigo-100/50 dark:bg-indigo-900/30 rounded-xl p-1 border border-indigo-200/50 dark:border-indigo-700/50">
              <Button
                variant={analysisMode === 'net' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAnalysisMode('net')}
                className={`px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
                  analysisMode === 'net' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                    : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200/50 dark:hover:bg-indigo-800/50'
                }`}
                data-testid="button-analysis-net"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                📈 Net Analiz
              </Button>
              <Button
                variant={analysisMode === 'subject' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAnalysisMode('subject')}
                className={`px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
                  analysisMode === 'subject' 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                    : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200/50 dark:hover:bg-indigo-800/50'
                }`}
                data-testid="button-analysis-subject"
              >
                <Target className="h-4 w-4 mr-2" />
                🎯 Ders Analiz
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {analysisMode === 'net' ? (
            // Net Analysis Chart with TYT/AYT targets display
            netAnalysisData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <TrendingUp className="h-10 w-10 text-blue-500" />
                </div>
                <h4 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">Henüz deneme verisi yok</h4>
                <p className="text-sm opacity-75 mb-4">Deneme sonucu ekleyerek net analizinizi görüntüleyin</p>
                {/* Show targets even when no data */}
                <div className="flex justify-center gap-8 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">TYT Hedef: 90</div>
                    <div className="text-sm text-blue-500 dark:text-blue-400">TYT DENEME: 0 net</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">AYT Hedef: 50</div>
                    <div className="text-sm text-green-500 dark:text-green-400">AYT DENEME: 0 net</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Targets and Current Nets Display */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50/80 dark:bg-blue-950/30 rounded-xl p-4 text-center border border-blue-200/50 dark:border-blue-800/40">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-1">TYT Hedef: 90</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      TYT DENEME: {netAnalysisData.length > 0 ? netAnalysisData[netAnalysisData.length - 1].tytNet : 0} net
                    </div>
                  </div>
                  <div className="bg-green-50/80 dark:bg-green-950/30 rounded-xl p-4 text-center border border-green-200/50 dark:border-green-800/40">
                    <div className="text-lg font-bold text-green-700 dark:text-green-300 mb-1">AYT Hedef: 50</div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      AYT DENEME: {netAnalysisData.length > 0 ? netAnalysisData[netAnalysisData.length - 1].aytNet : 0} net
                    </div>
                  </div>
                </div>
                
                <div className="h-96 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={netAnalysisData} margin={{ top: 40, right: 60, bottom: 50, left: 40 }}>
                    <defs>
                      <linearGradient id="tytGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="aytGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="currentColor" opacity={0.15} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fontWeight: 600 }}
                      className="text-foreground"
                      axisLine={{ stroke: 'currentColor', opacity: 0.4 }}
                      tickLine={{ stroke: 'currentColor', opacity: 0.4 }}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fontWeight: 600 }}
                      className="text-foreground"
                      axisLine={{ stroke: 'currentColor', opacity: 0.4 }}
                      tickLine={{ stroke: 'currentColor', opacity: 0.4 }}
                      label={{ value: 'Net Sayısı', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontWeight: 600 } }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '2px solid hsl(var(--border))',
                        borderRadius: '16px',
                        fontSize: '14px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                        padding: '16px',
                        backdropFilter: 'blur(8px)'
                      }}
                      labelFormatter={(label, payload) => {
                        const data = payload?.[0]?.payload;
                        return data ? `📊 ${data.examName} - ${label}` : label;
                      }}
                      formatter={(value: any, name: any) => [
                        `${value} net`,
                        name === 'tytNet' ? '🔵 TYT Net' : name === 'aytNet' ? '🟢 AYT Net' : 
                        name === 'tytTarget' ? '🎯 TYT Hedef' : '🎯 AYT Hedef'
                      ]}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '30px', fontSize: '14px', fontWeight: 600 }}
                      iconType="line"
                    />
                    
                    {/* Target lines */}
                    <Line 
                      type="monotone" 
                      dataKey="tytTarget" 
                      stroke="#3b82f6" 
                      strokeDasharray="10 6" 
                      strokeWidth={3}
                      dot={false} 
                      connectNulls={false}
                      name="🎯 TYT Hedef (90)"
                      opacity={0.8}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="aytTarget" 
                      stroke="#059669" 
                      strokeDasharray="10 6" 
                      strokeWidth={3}
                      dot={false} 
                      connectNulls={false}
                      name="🎯 AYT Hedef (50)"
                      opacity={0.8}
                    />
                    
                    {/* Actual nets */}
                    <Line 
                      type="linear" 
                      dataKey="tytNet" 
                      stroke="#3b82f6" 
                      strokeWidth={5}
                      dot={{ fill: '#3b82f6', strokeWidth: 4, r: 8, stroke: '#ffffff', shadow: true }} 
                      activeDot={{ r: 12, stroke: '#3b82f6', strokeWidth: 4, fill: '#ffffff', shadow: '0 0 15px rgba(59, 130, 246, 0.6)' }}
                      connectNulls={true}
                      name="🔵 TYT Net"
                    />
                    <Line 
                      type="linear" 
                      dataKey="aytNet" 
                      stroke="#059669" 
                      strokeWidth={5}
                      dot={{ fill: '#059669', strokeWidth: 4, r: 8, stroke: '#ffffff', shadow: true }} 
                      activeDot={{ r: 12, stroke: '#059669', strokeWidth: 4, fill: '#ffffff', shadow: '0 0 15px rgba(5, 150, 105, 0.6)' }}
                      connectNulls={true}
                      name="🟢 AYT Net"
                    />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              </div>
            )
          ) : (
            // Subject Analysis - Polygon/Radar Chart
            subjectAnalysisData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Target className="h-10 w-10 text-purple-500" />
                </div>
                <h4 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">Ders verisi bulunmuyor</h4>
                <p className="text-sm opacity-75 mb-4">Deneme ekleyerek ders dağılımınızı analiz edin</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Polygon Chart */}
                <div className="h-[500px] bg-gradient-to-br from-purple-50/30 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-xl p-6 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={subjectAnalysisData} margin={{ top: 60, right: 80, bottom: 60, left: 80 }}>
                      <defs>
                        <linearGradient id="correctGlow" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#16a34a" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="wrongGlow" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#dc2626" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <PolarGrid 
                        stroke="currentColor" 
                        className="opacity-25" 
                        strokeWidth={1.5}
                        radialLines={true}
                      />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fontSize: 14, fontWeight: 700, fill: 'currentColor' }}
                        className="text-foreground"
                        radius={120}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]} 
                        tick={{ fontSize: 11, fontWeight: 600 }}
                        className="text-muted-foreground"
                        tickCount={6}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Radar
                        name="✅ Doğru Cevaplar"
                        dataKey="correctRate"
                        stroke="#22c55e"
                        fill="url(#correctGlow)"
                        strokeWidth={4}
                        dot={{ fill: '#22c55e', strokeWidth: 3, r: 8, stroke: '#ffffff' }}
                        activeDot={{ r: 10, stroke: '#22c55e', strokeWidth: 4, fill: '#ffffff' }}
                      />
                      <Radar
                        name="❌ Yanlış Cevaplar"
                        dataKey="wrongRate"
                        stroke="#ef4444"
                        fill="url(#wrongGlow)"
                        strokeWidth={4}
                        dot={{ fill: '#ef4444', strokeWidth: 3, r: 8, stroke: '#ffffff' }}
                        activeDot={{ r: 10, stroke: '#ef4444', strokeWidth: 4, fill: '#ffffff' }}
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
                          `${typeof value === 'number' ? value.toFixed(1) : value}%`,
                          name === 'correctRate' ? '✅ Doğru Oranı' : '❌ Yanlış Oranı'
                        ]}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                        formatter={(value) => value === 'Doğru Cevaplar' ? '✅ Doğru Cevaplar' : '❌ Yanlış Cevaplar'}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {subjectAnalysisData.map((subject, index) => (
                    <div key={index} className="bg-white/60 dark:bg-gray-900/60 rounded-xl p-4 border border-indigo-200/40 dark:border-indigo-700/40 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">{subject.subject}</h4>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }}></div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-green-600 dark:text-green-400">✓ Doğru</span>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">{subject.correct}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-red-600 dark:text-red-400">✗ Yanlış</span>
                          <span className="text-sm font-semibold text-red-600 dark:text-red-400">{subject.wrong}</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Net</span>
                          <span className="text-sm font-bold" style={{ color: subject.color }}>{subject.netScore.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      {/* Progress bars */}
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${subject.correctRate}%` }}
                          />
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${subject.wrongRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}