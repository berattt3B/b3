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
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date | null;
  nextReview?: Date | null;
  reviewCount: string;
  createdAt: Date;
}

export function FlashcardsWidget() {
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [newCard, setNewCard] = useState({
    question: '',
    answer: '',
    subject: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  });
  const queryClient = useQueryClient();

  const { data: dueCards = [], isLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards/due"],
  });

  const reviewCardMutation = useMutation({
    mutationFn: async ({ cardId, difficulty }: { cardId: string; difficulty: 'easy' | 'medium' | 'hard' }) => {
      const response = await fetch(`/api/flashcards/${cardId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty }),
      });
      if (!response.ok) throw new Error('Failed to review card');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards/due"] });
      setShowAnswer(false);
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
      setNewCard({ question: '', answer: '', subject: '', difficulty: 'medium' });
      setIsCreatingCard(false);
    }
  });

  const handleCreateCard = () => {
    if (newCard.question.trim() && newCard.answer.trim() && newCard.subject.trim()) {
      createCardMutation.mutate(newCard);
    }
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
    
    setShowAnswer(false);
    setIsStudyMode(true);
  };

  const handleReview = (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!currentCard) return;
    reviewCardMutation.mutate({ cardId: currentCard.id, difficulty });
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
                    <label className="text-sm font-medium text-foreground">Konu</label>
                    <Select value={newCard.subject} onValueChange={(value) => setNewCard({...newCard, subject: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Konu seçin" />
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
                      disabled={!newCard.question.trim() || !newCard.answer.trim() || !newCard.subject || createCardMutation.isPending}
                    >
                      {createCardMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
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
            <span className="text-lg">{getSubjectEmoji(currentCard.subject)}</span>
            <span className="font-medium capitalize">{currentCard.subject}</span>
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

        {/* Show Answer Button or Answer */}
        {!showAnswer ? (
          <button
            onClick={() => setShowAnswer(true)}
            className="w-full bg-muted text-foreground py-3 rounded-lg font-medium hover:bg-muted/80 transition-colors duration-200 border border-border"
            data-testid="show-answer-button"
          >
            Cevabı Göster
          </button>
        ) : (
          <div className="space-y-4">
            {/* Answer Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-6 min-h-[120px]">
              <div className="text-xs text-green-700 dark:text-green-400 font-medium mb-2">CEVAP</div>
              <p className="text-foreground font-medium text-base leading-relaxed" data-testid="flashcard-answer">
                {currentCard.answer}
              </p>
            </div>

            {/* Review Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleReview('hard')}
                  className="flex flex-col items-center gap-1 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors duration-200"
                  disabled={reviewCardMutation.isPending}
                  data-testid="review-hard-button"
                >
                  <XCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Zor</span>
                  <span className="text-xs opacity-75">1 gün</span>
                </button>
                <button
                  onClick={() => handleReview('medium')}
                  className="flex flex-col items-center gap-1 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors duration-200"
                  disabled={reviewCardMutation.isPending}
                  data-testid="review-medium-button"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Orta</span>
                  <span className="text-xs opacity-75">2-4 gün</span>
                </button>
                <button
                  onClick={() => handleReview('easy')}
                  className="flex flex-col items-center gap-1 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors duration-200"
                  disabled={reviewCardMutation.isPending}
                  data-testid="review-easy-button"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">Kolay</span>
                  <span className="text-xs opacity-75">3+ gün</span>
                </button>
              </div>
            </div>
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