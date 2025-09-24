import { type Task, type InsertTask, type Mood, type InsertMood, type Goal, type InsertGoal, type QuestionLog, type InsertQuestionLog, type ExamResult, type InsertExamResult, type Flashcard, type InsertFlashcard, type ExamSubjectNet, type InsertExamSubjectNet } from "@shared/schema";
import { randomUUID } from "crypto";
import { sampleFlashcards, type FlashcardError } from "./flashcard-data";

export interface IStorage {
  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  toggleTaskComplete(id: string): Promise<Task | undefined>;
  getTasksByDate(dateISO: string): Promise<Task[]>;
  getDailySummary(rangeDays: number): Promise<any>;
  
  // Mood operations
  getMoods(): Promise<Mood[]>;
  getLatestMood(): Promise<Mood | undefined>;
  createMood(mood: InsertMood): Promise<Mood>;
  
  // Goal operations
  getGoals(): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, updates: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<boolean>;
  
  // Question log operations
  getQuestionLogs(): Promise<QuestionLog[]>;
  createQuestionLog(log: InsertQuestionLog): Promise<QuestionLog>;
  getQuestionLogsByDateRange(startDate: string, endDate: string): Promise<QuestionLog[]>;
  deleteQuestionLog(id: string): Promise<boolean>;
  deleteAllQuestionLogs(): Promise<boolean>;
  
  // Topic statistics operations
  getTopicStats(): Promise<Array<{ topic: string; wrongMentions: number; totalSessions: number; mentionFrequency: number }>>;
  getPriorityTopics(): Promise<Array<{ topic: string; wrongMentions: number; mentionFrequency: number; priority: 'critical' | 'high' | 'medium' | 'low'; color: string }>>;
  getSubjectSolvedStats(): Promise<Array<{ subject: string; totalQuestions: number; totalTimeMinutes: number; averageTimePerQuestion: number }>>;
  
  // Exam result operations
  getExamResults(): Promise<ExamResult[]>;
  createExamResult(result: InsertExamResult): Promise<ExamResult>;
  deleteExamResult(id: string): Promise<boolean>;
  deleteAllExamResults(): Promise<boolean>;
  
  // Flashcard operations
  getFlashcards(): Promise<Flashcard[]>;
  getFlashcard(id: string): Promise<Flashcard | undefined>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: string, updates: Partial<InsertFlashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: string): Promise<boolean>;
  getFlashcardsDue(): Promise<Flashcard[]>;
  reviewFlashcard(id: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<Flashcard | undefined>;
  seedSampleFlashcards(): Promise<void>;
  addFlashcardError(error: FlashcardError): Promise<void>;
  getFlashcardErrors(): Promise<FlashcardError[]>;
  getFlashcardErrorsByDifficulty(): Promise<{ easy: FlashcardError[]; medium: FlashcardError[]; hard: FlashcardError[] }>;
  
  // Exam subject nets operations
  getExamSubjectNets(): Promise<ExamSubjectNet[]>;
  getExamSubjectNetsByExamId(examId: string): Promise<ExamSubjectNet[]>;
  createExamSubjectNet(examSubjectNet: InsertExamSubjectNet): Promise<ExamSubjectNet>;
  updateExamSubjectNet(id: string, updates: Partial<InsertExamSubjectNet>): Promise<ExamSubjectNet | undefined>;
  deleteExamSubjectNet(id: string): Promise<boolean>;
  deleteExamSubjectNetsByExamId(examId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private tasks: Map<string, Task>;
  private moods: Map<string, Mood>;
  private goals: Map<string, Goal>;
  private questionLogs: Map<string, QuestionLog>;
  private examResults: Map<string, ExamResult>;
  private flashcards: Map<string, Flashcard>;
  private examSubjectNets: Map<string, ExamSubjectNet>;
  private flashcardErrors: FlashcardError[];

  constructor() {
    this.tasks = new Map();
    this.moods = new Map();
    this.goals = new Map();
    this.questionLogs = new Map();
    this.examResults = new Map();
    this.flashcards = new Map();
    this.examSubjectNets = new Map();
    this.flashcardErrors = [];
    
    // Initialize with some sample goals
    this.initializeSampleGoals();
  }
  
  private async initializeSampleGoals() {
    const sampleGoals = [
      {
        title: "TYT Net Hedefi",
        description: "2026 TYT'de 75 net hedefliyorum",
        targetValue: "75",
        currentValue: "68.75",
        unit: "net",
        category: "tyt" as const,
        timeframe: "aylık" as const,
        targetDate: "2026-06-20"
      },
      {
        title: "AYT Net Hedefi",
        description: "2026 AYT'de 60 net hedefliyorum",
        targetValue: "60",
        currentValue: "45.50",
        unit: "net",
        category: "ayt" as const,
        timeframe: "aylık" as const,
        targetDate: "2026-06-21"
      },
      {
        title: "Sıralama Hedefi",
        description: "10.000'inci sıranın üstünde olmak istiyorum",
        targetValue: "10000",
        currentValue: "15750",
        unit: "sıralama",
        category: "siralama" as const,
        timeframe: "yıllık" as const,
        targetDate: "2026-06-21"
      }
    ];
    
    for (const goal of sampleGoals) {
      await this.createGoal(goal);
    }
  }

  // Task operations
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => {
      // Sort by priority (high -> medium -> low) then by created date
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder];
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      id,
      description: insertTask.description ?? null,
      priority: insertTask.priority ?? "medium",
      category: insertTask.category ?? "genel",
      color: insertTask.color ?? "#8B5CF6", // Default purple
      completed: insertTask.completed ?? false,
      completedAt: null,
      dueDate: insertTask.dueDate ?? null,
      recurrenceType: insertTask.recurrenceType ?? "none",
      recurrenceEndDate: insertTask.recurrenceEndDate ?? null,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) {
      return undefined;
    }

    const updatedTask: Task = {
      ...existingTask,
      ...updates,
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async toggleTaskComplete(id: string): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) {
      return undefined;
    }

    const updatedTask: Task = {
      ...task,
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : null,
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Mood operations
  async getMoods(): Promise<Mood[]> {
    return Array.from(this.moods.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getLatestMood(): Promise<Mood | undefined> {
    const moods = await this.getMoods();
    return moods[0];
  }

  async createMood(insertMood: InsertMood): Promise<Mood> {
    const id = randomUUID();
    const mood: Mood = {
      ...insertMood,
      id,
      moodBg: insertMood.moodBg ?? null,
      note: insertMood.note ?? null,
      createdAt: new Date(),
    };
    this.moods.set(id, mood);
    return mood;
  }

  // New methods for enhanced functionality
  async getTasksByDate(dateISO: string): Promise<Task[]> {
    const tasks = await this.getTasks();
    const today = new Date().toISOString().split('T')[0];
    
    return tasks.filter(task => {
      // If task has a dueDate, check if it matches the requested date
      if (task.dueDate) {
        const taskDate = task.dueDate.split('T')[0]; // Handle both date strings and ISO strings
        return taskDate === dateISO;
      }
      
      // If task has no dueDate, include it in today's tasks only
      if (dateISO === today && task.createdAt) {
        const createdDate = new Date(task.createdAt).toISOString().split('T')[0];
        return createdDate === today;
      }
      
      return false;
    });
  }

  async getDailySummary(rangeDays: number = 30): Promise<any> {
    const tasks = await this.getTasks();
    const moods = await this.getMoods();
    
    const today = new Date();
    const summaryData = [];
    
    for (let i = 0; i < rangeDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTasks = tasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
        return completedDate === dateStr;
      });
      
      const dayMoods = moods.filter(mood => {
        if (!mood.createdAt) return false;
        const moodDate = new Date(mood.createdAt).toISOString().split('T')[0];
        return moodDate === dateStr;
      });
      
      summaryData.push({
        date: dateStr,
        tasksCompleted: dayTasks.length,
        totalTasks: tasks.filter(task => {
          if (!task.createdAt) return false;
          const createdDate = new Date(task.createdAt).toISOString().split('T')[0];
          return createdDate <= dateStr;
        }).length,
        moods: dayMoods,
        productivity: dayTasks.length > 0 ? Math.min(dayTasks.length * 20, 100) : 0
      });
    }
    
    return summaryData;
  }
  
  // Goal operations
  async getGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const goal: Goal = {
      ...insertGoal,
      id,
      description: insertGoal.description ?? null,
      category: insertGoal.category ?? "genel",
      targetDate: insertGoal.targetDate ?? null,
      completed: insertGoal.completed ?? false,
      currentValue: insertGoal.currentValue ?? "0",
      targetValue: insertGoal.targetValue ?? "100",
      unit: insertGoal.unit ?? "net",
      timeframe: insertGoal.timeframe ?? "aylık",
      createdAt: new Date(),
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: string, updates: Partial<InsertGoal>): Promise<Goal | undefined> {
    const existingGoal = this.goals.get(id);
    if (!existingGoal) {
      return undefined;
    }

    const updatedGoal: Goal = {
      ...existingGoal,
      ...updates,
    };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: string): Promise<boolean> {
    return this.goals.delete(id);
  }
  
  // Question log operations
  async getQuestionLogs(): Promise<QuestionLog[]> {
    return Array.from(this.questionLogs.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createQuestionLog(insertLog: InsertQuestionLog): Promise<QuestionLog> {
    const id = randomUUID();
    const log: QuestionLog = {
      ...insertLog,
      id,
      topic: insertLog.topic ?? null,
      blank_count: insertLog.blank_count ?? "0",
      wrong_topics: insertLog.wrong_topics ?? [],
      time_spent_minutes: insertLog.time_spent_minutes ?? null,
      createdAt: new Date(),
    };
    this.questionLogs.set(id, log);
    return log;
  }

  async getQuestionLogsByDateRange(startDate: string, endDate: string): Promise<QuestionLog[]> {
    const logs = Array.from(this.questionLogs.values());
    return logs.filter(log => {
      const logDate = log.study_date;
      return logDate >= startDate && logDate <= endDate;
    }).sort((a, b) => new Date(b.study_date).getTime() - new Date(a.study_date).getTime());
  }

  async deleteQuestionLog(id: string): Promise<boolean> {
    return this.questionLogs.delete(id);
  }

  async deleteAllQuestionLogs(): Promise<boolean> {
    this.questionLogs.clear();
    return true;
  }
  
  // Exam result operations
  async getExamResults(): Promise<ExamResult[]> {
    return Array.from(this.examResults.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createExamResult(insertResult: InsertExamResult): Promise<ExamResult> {
    const id = randomUUID();
    const result: ExamResult = {
      ...insertResult,
      id,
      notes: insertResult.notes ?? null,
      ranking: insertResult.ranking ?? null,
      tyt_net: insertResult.tyt_net ?? "0",
      ayt_net: insertResult.ayt_net ?? "0",
      subjects_data: insertResult.subjects_data ?? null,
      createdAt: new Date(),
    };
    this.examResults.set(id, result);
    return result;
  }

  async deleteExamResult(id: string): Promise<boolean> {
    const deleted = this.examResults.delete(id);
    if (deleted) {
      // Cascade delete associated exam subject nets
      await this.deleteExamSubjectNetsByExamId(id);
    }
    return deleted;
  }

  async deleteAllExamResults(): Promise<boolean> {
    this.examResults.clear();
    this.examSubjectNets.clear(); // Also clear all subject nets
    return true;
  }
  
  // Flashcard operations
  async getFlashcards(): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getFlashcard(id: string): Promise<Flashcard | undefined> {
    return this.flashcards.get(id);
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = randomUUID();
    const flashcard: Flashcard = {
      ...insertFlashcard,
      id,
      examType: insertFlashcard.examType ?? "TYT",
      subject: insertFlashcard.subject ?? "genel",
      topic: insertFlashcard.topic ?? null,
      difficulty: insertFlashcard.difficulty ?? "medium",
      lastReviewed: insertFlashcard.lastReviewed ?? null,
      nextReview: insertFlashcard.nextReview ?? new Date(),
      reviewCount: "0",
      createdAt: new Date(),
    };
    this.flashcards.set(id, flashcard);
    return flashcard;
  }

  async updateFlashcard(id: string, updates: Partial<InsertFlashcard>): Promise<Flashcard | undefined> {
    const existingFlashcard = this.flashcards.get(id);
    if (!existingFlashcard) {
      return undefined;
    }

    const updatedFlashcard: Flashcard = {
      ...existingFlashcard,
      ...updates,
    };
    this.flashcards.set(id, updatedFlashcard);
    return updatedFlashcard;
  }

  async deleteFlashcard(id: string): Promise<boolean> {
    return this.flashcards.delete(id);
  }

  async getFlashcardsDue(): Promise<Flashcard[]> {
    const now = new Date();
    return Array.from(this.flashcards.values())
      .filter(card => !card.nextReview || new Date(card.nextReview) <= now)
      .sort((a, b) => {
        // Prioritize cards that have never been reviewed
        if (!a.lastReviewed && b.lastReviewed) return -1;
        if (a.lastReviewed && !b.lastReviewed) return 1;
        
        // Then sort by next review date (oldest first)
        const aNext = a.nextReview ? new Date(a.nextReview).getTime() : 0;
        const bNext = b.nextReview ? new Date(b.nextReview).getTime() : 0;
        return aNext - bNext;
      });
  }

  async reviewFlashcard(id: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<Flashcard | undefined> {
    const flashcard = this.flashcards.get(id);
    if (!flashcard) {
      return undefined;
    }

    const now = new Date();
    const reviewCount = parseInt(flashcard.reviewCount) + 1;
    
    // Basic spaced repetition algorithm
    let daysToAdd = 1;
    switch (difficulty) {
      case 'easy':
        daysToAdd = Math.max(1, reviewCount * 3); // 3, 6, 9, 12... days
        break;
      case 'medium':
        daysToAdd = Math.max(1, reviewCount * 2); // 2, 4, 6, 8... days
        break;
      case 'hard':
        daysToAdd = 1; // Review again tomorrow
        break;
    }

    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + daysToAdd);

    const updatedFlashcard: Flashcard = {
      ...flashcard,
      difficulty,
      lastReviewed: now,
      nextReview,
      reviewCount: reviewCount.toString(),
    };

    this.flashcards.set(id, updatedFlashcard);
    return updatedFlashcard;
  }
  
  // Topic statistics operations (specific wrong topics mentioned by users)
  async getTopicStats(): Promise<Array<{ topic: string; wrongMentions: number; totalSessions: number; mentionFrequency: number }>> {
    const logs = Array.from(this.questionLogs.values());
    const examResults = Array.from(this.examResults.values());
    const topicStats = new Map<string, { wrongMentions: number; sessionsAppeared: Set<string> }>();

    // Process question logs
    logs.forEach(log => {
      // Only track specifically mentioned wrong topics, not general subjects
      if (log.wrong_topics && log.wrong_topics.length > 0) {
        log.wrong_topics.forEach(topic => {
          if (!topicStats.has(topic)) {
            topicStats.set(topic, { wrongMentions: 0, sessionsAppeared: new Set() });
          }
          const topicStat = topicStats.get(topic)!;
          topicStat.wrongMentions += 1; // Count how many times this topic was mentioned as wrong
          topicStat.sessionsAppeared.add(log.id); // Track unique sessions where this topic appeared
        });
      }
    });

    // Process exam results wrong topics
    examResults.forEach(exam => {
      if (exam.subjects_data) {
        try {
          const subjectsData = JSON.parse(exam.subjects_data);
          Object.values(subjectsData).forEach((subjectData: any) => {
            if (subjectData.wrong_topics && Array.isArray(subjectData.wrong_topics)) {
              subjectData.wrong_topics.forEach((topic: string) => {
                if (topic && topic.trim().length > 0) {
                  if (!topicStats.has(topic)) {
                    topicStats.set(topic, { wrongMentions: 0, sessionsAppeared: new Set() });
                  }
                  const topicStat = topicStats.get(topic)!;
                  topicStat.wrongMentions += 2; // Weight exam errors higher (2x)
                  topicStat.sessionsAppeared.add(`exam_${exam.id}`);
                }
              });
            }
          });
        } catch (e) {
          // Skip malformed JSON
        }
      }
    });

    const totalSessions = logs.length;
    
    return Array.from(topicStats.entries())
      .map(([topic, stats]) => ({
        topic,
        wrongMentions: stats.wrongMentions,
        totalSessions: stats.sessionsAppeared.size,
        mentionFrequency: totalSessions > 0 ? (stats.sessionsAppeared.size / totalSessions) * 100 : 0
      }))
      .filter(stat => stat.wrongMentions >= 2) // Only show topics mentioned at least twice to avoid noise
      .sort((a, b) => b.wrongMentions - a.wrongMentions);
  }

  async getPriorityTopics(): Promise<Array<{ topic: string; wrongMentions: number; mentionFrequency: number; priority: 'critical' | 'high' | 'medium' | 'low'; color: string }>> {
    const topicStats = await this.getTopicStats();
    
    return topicStats.map(stat => {
      let priority: 'critical' | 'high' | 'medium' | 'low';
      let color: string;
      
      // Priority based on wrong mention count and frequency
      if (stat.wrongMentions >= 10 || stat.mentionFrequency >= 50) {
        priority = 'critical';
        color = '#DC2626'; // Red
      } else if (stat.wrongMentions >= 6 || stat.mentionFrequency >= 30) {
        priority = 'high';
        color = '#EA580C'; // Orange
      } else if (stat.wrongMentions >= 3 || stat.mentionFrequency >= 15) {
        priority = 'medium';
        color = '#D97706'; // Amber
      } else {
        priority = 'low';
        color = '#16A34A'; // Green
      }
      
      return {
        topic: stat.topic,
        wrongMentions: stat.wrongMentions,
        mentionFrequency: stat.mentionFrequency,
        priority,
        color
      };
    });
  }

  async getSubjectSolvedStats(): Promise<Array<{ subject: string; totalQuestions: number; totalTimeMinutes: number; averageTimePerQuestion: number }>> {
    const logs = Array.from(this.questionLogs.values());
    const subjectStats = new Map<string, { totalQuestions: number; totalTimeMinutes: number }>();

    logs.forEach(log => {
      const totalQuestions = parseInt(log.correct_count) + parseInt(log.wrong_count) + parseInt(log.blank_count || "0");
      const timeSpent = log.time_spent_minutes || 0;
      
      if (!subjectStats.has(log.subject)) {
        subjectStats.set(log.subject, { totalQuestions: 0, totalTimeMinutes: 0 });
      }
      
      const stats = subjectStats.get(log.subject)!;
      stats.totalQuestions += totalQuestions;
      stats.totalTimeMinutes += timeSpent;
    });

    return Array.from(subjectStats.entries())
      .map(([subject, stats]) => ({
        subject,
        totalQuestions: stats.totalQuestions,
        totalTimeMinutes: stats.totalTimeMinutes,
        averageTimePerQuestion: stats.totalQuestions > 0 ? stats.totalTimeMinutes / stats.totalQuestions : 0
      }))
      .filter(stat => stat.totalQuestions > 0)
      .sort((a, b) => b.totalQuestions - a.totalQuestions);
  }

  // Exam subject nets operations
  async getExamSubjectNets(): Promise<ExamSubjectNet[]> {
    return Array.from(this.examSubjectNets.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getExamSubjectNetsByExamId(examId: string): Promise<ExamSubjectNet[]> {
    return Array.from(this.examSubjectNets.values())
      .filter(net => net.exam_id === examId)
      .sort((a, b) => a.subject.localeCompare(b.subject));
  }

  async createExamSubjectNet(insertNet: InsertExamSubjectNet): Promise<ExamSubjectNet> {
    // Validate that the exam exists
    const examExists = this.examResults.has(insertNet.exam_id);
    if (!examExists) {
      throw new Error(`Exam with id ${insertNet.exam_id} does not exist`);
    }
    
    const id = randomUUID();
    const examSubjectNet: ExamSubjectNet = {
      ...insertNet,
      id,
      correct_count: insertNet.correct_count ?? "0",
      wrong_count: insertNet.wrong_count ?? "0",
      blank_count: insertNet.blank_count ?? "0",
      createdAt: new Date(),
    };
    this.examSubjectNets.set(id, examSubjectNet);
    return examSubjectNet;
  }

  async updateExamSubjectNet(id: string, updates: Partial<InsertExamSubjectNet>): Promise<ExamSubjectNet | undefined> {
    const existing = this.examSubjectNets.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: ExamSubjectNet = {
      ...existing,
      ...updates,
    };
    this.examSubjectNets.set(id, updated);
    return updated;
  }

  async deleteExamSubjectNet(id: string): Promise<boolean> {
    return this.examSubjectNets.delete(id);
  }

  async deleteExamSubjectNetsByExamId(examId: string): Promise<boolean> {
    const netsToDelete = Array.from(this.examSubjectNets.entries())
      .filter(([_, net]) => net.exam_id === examId);
    
    let deletedAny = false;
    for (const [id, _] of netsToDelete) {
      if (this.examSubjectNets.delete(id)) {
        deletedAny = true;
      }
    }
    return deletedAny;
  }

  // Flashcard error tracking methods
  async seedSampleFlashcards(): Promise<void> {
    for (const cardData of sampleFlashcards) {
      await this.createFlashcard(cardData);
    }
  }

  async addFlashcardError(error: FlashcardError): Promise<void> {
    this.flashcardErrors.push(error);
  }

  async getFlashcardErrors(): Promise<FlashcardError[]> {
    return [...this.flashcardErrors];
  }

  async getFlashcardErrorsByDifficulty(): Promise<{ easy: FlashcardError[]; medium: FlashcardError[]; hard: FlashcardError[] }> {
    return {
      easy: this.flashcardErrors.filter(error => error.difficulty === 'easy'),
      medium: this.flashcardErrors.filter(error => error.difficulty === 'medium'),
      hard: this.flashcardErrors.filter(error => error.difficulty === 'hard')
    };
  }
}

export const storage = new MemStorage();
