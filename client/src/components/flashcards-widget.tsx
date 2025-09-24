import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Brain, RefreshCw, Shuffle, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  examType: 'TYT' | 'AYT';
  subject: string;
  topic?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date | null;
  nextReview?: Date | null;
  reviewCount: string;
  createdAt: Date;
}

export function FlashcardsWidget() {
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [newCard, setNewCard] = useState({
    question: '',
    answer: '',
    examType: 'TYT' as 'TYT' | 'AYT',
    subject: '',
    topic: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  });
  const queryClient = useQueryClient();

  const { data: dueCards = [], isLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards/due"],
  });

  const reviewCardMutation = useMutation({
    mutationFn: async ({ cardId, difficulty, isCorrect, userAnswer }: { cardId: string; difficulty: 'easy' | 'medium' | 'hard'; isCorrect: boolean; userAnswer: string }) => {
      const response = await fetch(`/api/flashcards/${cardId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, isCorrect, userAnswer }),
      });
      if (!response.ok) throw new Error('Failed to review card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/due"] });
      setUserAnswer('');
      setIsAnswered(false);
      setIsCorrect(null);
      setCurrentCard(null);
    }
  });

  const createCardMutation = useMutation({
    mutationFn: async (cardData: typeof newCard) => {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      });
      if (!response.ok) throw new Error('Failed to create card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/due"] });
      setNewCard({ question: '', answer: '', examType: 'TYT', subject: '', topic: '', difficulty: 'medium' });
      setIsCreatingCard(false);
    }
  });

  const handleCreateCard = () => {
    if (newCard.question.trim() && newCard.answer.trim() && newCard.subject.trim() && newCard.topic.trim()) {
      createCardMutation.mutate(newCard);
    }
  };

  const handleAnswerSubmit = () => {
    if (!currentCard || !userAnswer.trim()) return;
    
    const isAnswerCorrect = userAnswer.toLowerCase().trim() === currentCard.answer.toLowerCase().trim();
    setIsCorrect(isAnswerCorrect);
    setIsAnswered(true);
  };

  const handleNextCard = () => {
    if (!currentCard || !isAnswered) return;
    
    // Yanlış cevaplanan kartlar için daha sık tekrar
    const difficulty = isCorrect ? 'easy' : 'hard';
    
    reviewCardMutation.mutate({ 
      cardId: currentCard.id, 
      difficulty, 
      isCorrect: isCorrect || false, 
      userAnswer 
    });
  };

  const drawRandomCard = () => {
    if (dueCards.length === 0) return;
    
    const availableCards = dueCards.filter(card => !currentCard || card.id !== currentCard.id);
    if (availableCards.length === 0 && dueCards.length > 0) {
      setCurrentCard(dueCards[0]);
    } else if (availableCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      setCurrentCard(availableCards[randomIndex]);
    }
    
    setUserAnswer('');
    setIsAnswered(false);
    setIsCorrect(null);
    setIsStudyMode(true);
  };

  const getExamTypeColor = (examType: string) => {
    return examType === 'TYT' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
      case 'hard': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800';
    }
  };

  const getSubjectEmoji = (subject: string) => {
    const emojiMap: { [key: string]: string } = {
      'matematik': '📐',
      'turkce': '📚',
      'fizik': '⚛️',
      'kimya': '🧪',
      'biyoloji': '🧬',
      'tarih': '🏛️',
      'cografya': '🌍',
      'felsefe': '🤔',
      'genel': '📖'
    };
    return emojiMap[subject] || '📖';
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 transition-colors duration-300">
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-primary" />
          Tekrar Kartları
        </h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!isStudyMode || !currentCard) {
    return (
      <div className="bg-card rounded-xl border border-border p-4 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            Tekrar Kartları
          </h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
              {dueCards.length} kart hazır
            </div>
            <Dialog open={isCreatingCard} onOpenChange={setIsCreatingCard}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Yeni Tekrar Kartı Oluştur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Sınav Türü</label>
                    <Select value={newCard.examType} onValueChange={(value: 'TYT' | 'AYT') => setNewCard({...newCard, examType: value})}>
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
                    <label className="text-sm font-medium text-foreground">Ders</label>
                    <Select value={newCard.subject} onValueChange={(value) => setNewCard({...newCard, subject: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ders seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matematik">Matematik</SelectItem>
                        <SelectItem value="turkce">Türkçe</SelectItem>
                        <SelectItem value="fizik">Fizik</SelectItem>
                        <SelectItem value="kimya">Kimya</SelectItem>
                        <SelectItem value="biyoloji">Biyoloji</SelectItem>
                        <SelectItem value="tarih">Tarih</SelectItem>
                        <SelectItem value="cografya">Coğrafya</SelectItem>
                        <SelectItem value="felsefe">Felsefe</SelectItem>
                        <SelectItem value="genel">Genel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Konu</label>
                    <Input
                      value={newCard.topic}
                      onChange={(e) => setNewCard({...newCard, topic: e.target.value})}
                      placeholder="Konuyu yazın... (ör: Türev, Hareket)"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Soru</label>
                    <Textarea
                      value={newCard.question}
                      onChange={(e) => setNewCard({...newCard, question: e.target.value})}
                      placeholder="Soruyu yazın..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Cevap</label>
                    <Textarea
                      value={newCard.answer}
                      onChange={(e) => setNewCard({...newCard, answer: e.target.value})}
                      placeholder="Cevabı yazın..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Zorluk</label>
                    <Select value={newCard.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setNewCard({...newCard, difficulty: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Kolay</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="hard">Zor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreatingCard(false)}>
                      İptal
                    </Button>
                    <Button 
                      onClick={handleCreateCard} 
                      disabled={!newCard.question.trim() || !newCard.answer.trim() || !newCard.subject || !newCard.topic.trim() || createCardMutation.isPending}
                    >
                      {createCardMutation.isPending ? 'Oluşturuyor...' : 'Oluştur'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {dueCards.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Çalışılacak kart yok</p>
            <p className="text-xs mt-1">Tüm kartlar gözden geçirilmiş!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {dueCards.length} kart çalışmaya hazır
              </p>
              <button
                onClick={drawRandomCard}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200 flex items-center gap-2 mx-auto"
                data-testid="draw-card-button"
              >
                <Shuffle className="h-4 w-4" />
                Kart Çek
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="font-medium text-green-800 dark:text-green-300">Kolay</div>
                <div className="text-green-600 dark:text-green-400">
                  {dueCards.filter(c => c.difficulty === 'easy').length}
                </div>
              </div>
              <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="font-medium text-yellow-800 dark:text-yellow-300">Orta</div>
                <div className="text-yellow-600 dark:text-yellow-400">
                  {dueCards.filter(c => c.difficulty === 'medium').length}
                </div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="font-medium text-red-800 dark:text-red-300">Zor</div>
                <div className="text-red-600 dark:text-red-400">
                  {dueCards.filter(c => c.difficulty === 'hard').length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Tekrar Kartları</h3>
        </div>
        <button
          onClick={() => setIsStudyMode(false)}
          className="text-muted-foreground hover:text-foreground p-1"
          title="Kart seçimine dön"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4" data-testid="flashcard-study-mode">
        {/* Card Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">{currentCard.examType}</span>
            <span className="text-lg">{getSubjectEmoji(currentCard.subject)}</span>
            <span className="font-medium capitalize">{currentCard.subject}</span>
            {currentCard.topic && <span className="text-muted-foreground">• {currentCard.topic}</span>}
          </div>
          <div className={`px-2 py-1 rounded-lg border text-xs font-medium ${getDifficultyColor(currentCard.difficulty)}`}>
            {currentCard.difficulty === 'easy' ? 'Kolay' : currentCard.difficulty === 'medium' ? 'Orta' : 'Zor'}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 min-h-[120px]">
          <div className="text-xs text-primary font-medium mb-2">SORU</div>
          <p className="text-foreground font-medium text-base leading-relaxed" data-testid="flashcard-question">
            {currentCard.question}
          </p>
        </div>

        {/* Answer Input Section */}
        {!isAnswered ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Cevabınızı Yazın:</label>
              <Input
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Cevabı buraya yazın..."
                onKeyPress={(e) => e.key === 'Enter' && handleAnswerSubmit()}
                className="text-base"
                data-testid="answer-input"
              />
            </div>
            <Button
              onClick={handleAnswerSubmit}
              disabled={!userAnswer.trim()}
              className="w-full"
              data-testid="check-answer-button"
            >
              Kontrol Et
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Answer Feedback */}
            <div className={`p-4 rounded-lg border ${
              isCorrect 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                <span className={`font-medium ${
                  isCorrect 
                    ? 'text-green-800 dark:text-green-300' 
                    : 'text-red-800 dark:text-red-300'
                }`}>
                  {isCorrect ? 'Doğru!' : 'Yanlış!'}
                </span>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Sizin cevabınız: <span className="font-medium">{userAnswer}</span></p>
                <p className="text-muted-foreground">Doğru cevap: <span className="font-medium text-foreground">{currentCard.answer}</span></p>
              </div>
            </div>

            {/* Next Button */}
            <Button
              onClick={handleNextCard}
              disabled={reviewCardMutation.isPending}
              className="w-full"
              data-testid="next-card-button"
            >
              {reviewCardMutation.isPending ? 'Yükleniyor...' : 'Sonraki Kart'}
            </Button>
          </div>
        )}

        {/* Card Progress */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          İnceleme: {parseInt(currentCard.reviewCount) + 1} • 
          Kalan: {dueCards.length - 1} kart
        </div>
      </div>
    </div>
  );
}