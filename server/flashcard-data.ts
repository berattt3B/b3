// Tekrar Kartları için örnek sorular ve cevaplar
import type { InsertFlashcard } from "@shared/schema";

export const sampleFlashcards: InsertFlashcard[] = [
  // TYT Matematik
  {
    examType: "TYT",
    subject: "matematik",
    topic: "Sayılar ve İşlemler",
    question: "(-3)² + (-2)³ işleminin sonucu kaçtır?",
    answer: "1",
    difficulty: "easy"
  },
  {
    examType: "TYT",
    subject: "matematik", 
    topic: "Cebirsel İfadeler",
    question: "x² - 5x + 6 = 0 denkleminin kökleri toplamı kaçtır?",
    answer: "5",
    difficulty: "medium"
  },
  {
    examType: "TYT",
    subject: "matematik",
    topic: "Fonksiyonlar",
    question: "f(x) = 2x - 3 fonksiyonu için f(5) değeri kaçtır?",
    answer: "7",
    difficulty: "easy"
  },
  {
    examType: "TYT",
    subject: "matematik",
    topic: "Geometri",
    question: "Yarıçapı 3 cm olan dairenin çevresi kaç cm'dir? (π = 3)",
    answer: "18",
    difficulty: "easy"
  },

  // TYT Türkçe
  {
    examType: "TYT",
    subject: "turkce",
    topic: "Anlam Bilgisi",
    question: "'Elma' sözcüğünün eş anlamlısı hangisidir?",
    answer: "alma",
    difficulty: "easy"
  },
  {
    examType: "TYT",
    subject: "turkce",
    topic: "Cümle Bilgisi",
    question: "'Kitap okudum.' cümlesinde özne nedir?",
    answer: "gizli özne",
    difficulty: "medium"
  },
  {
    examType: "TYT",
    subject: "turkce",
    topic: "Paragraf",
    question: "Ana fikir genellikle paragrafın hangi yerinde bulunur?",
    answer: "başında",
    difficulty: "easy"
  },

  // TYT Fizik
  {
    examType: "TYT",
    subject: "fizik",
    topic: "Hareket",
    question: "Sabit hızla hareket eden bir cismin ivmesi kaçtır?",
    answer: "0",
    difficulty: "easy"
  },
  {
    examType: "TYT",
    subject: "fizik",
    topic: "Kuvvet",
    question: "Newton'un birinci yasasının diğer adı nedir?",
    answer: "eylemsizlik yasası",
    difficulty: "medium"
  },

  // TYT Kimya
  {
    examType: "TYT",
    subject: "kimya",
    topic: "Atom Yapısı",
    question: "Hidrojen atomunun elektron sayısı kaçtır?",
    answer: "1",
    difficulty: "easy"
  },
  {
    examType: "TYT",
    subject: "kimya",
    topic: "Periyodik Tablo",
    question: "Su molekülünün kimyasal formülü nedir?",
    answer: "H2O",
    difficulty: "easy"
  },

  // TYT Biyoloji
  {
    examType: "TYT",
    subject: "biyoloji",
    topic: "Hücre",
    question: "Bitki hücresinde bulunan fakat hayvan hücresinde bulunmayan organelin adı nedir?",
    answer: "kloroplast",
    difficulty: "medium"
  },
  {
    examType: "TYT",
    subject: "biyoloji",
    topic: "Genetik",
    question: "DNA'nın açılımı nedir?",
    answer: "deoksiribonükleik asit",
    difficulty: "easy"
  },

  // AYT Matematik
  {
    examType: "AYT",
    subject: "matematik",
    topic: "Limit",
    question: "lim (x→2) (x² - 4)/(x - 2) ifadesinin değeri kaçtır?",
    answer: "4",
    difficulty: "hard"
  },
  {
    examType: "AYT",
    subject: "matematik",
    topic: "Türev",
    question: "f(x) = x³ fonksiyonunun türevi nedir?",
    answer: "3x²",
    difficulty: "medium"
  },
  {
    examType: "AYT",
    subject: "matematik",
    topic: "İntegral",
    question: "∫ 2x dx işleminin sonucu nedir?",
    answer: "x² + C",
    difficulty: "medium"
  },

  // AYT Fizik
  {
    examType: "AYT",
    subject: "fizik",
    topic: "Elektrik",
    question: "Ohm yasasına göre V = I × ? formülünde ? yerine ne gelir?",
    answer: "R",
    difficulty: "easy"
  },
  {
    examType: "AYT",
    subject: "fizik",
    topic: "Dalgalar",
    question: "Sesin boşlukta hızı kaç m/s'dir?",
    answer: "0",
    difficulty: "medium"
  },
  {
    examType: "AYT",
    subject: "fizik",
    topic: "Modern Fizik",
    question: "Işık hızı yaklaşık kaç m/s'dir?",
    answer: "300000000",
    difficulty: "medium"
  },

  // AYT Kimya
  {
    examType: "AYT",
    subject: "kimya",
    topic: "Organik Kimya",
    question: "Metanın kimyasal formülü nedir?",
    answer: "CH4",
    difficulty: "easy"
  },
  {
    examType: "AYT",
    subject: "kimya",
    topic: "Asitler ve Bazlar",
    question: "pH = 7 olan çözeltinin özelliği nedir?",
    answer: "nötr",
    difficulty: "easy"
  },

  // AYT Biyoloji
  {
    examType: "AYT",
    subject: "biyoloji",
    topic: "Ekosistem",
    question: "Besin zincirinin ilk halkasında hangi canlılar bulunur?",
    answer: "üreticiler",
    difficulty: "medium"
  },
  {
    examType: "AYT",
    subject: "biyoloji",
    topic: "Evrim",
    question: "Evrim teorisini ortaya atan bilim insanının adı nedir?",
    answer: "Charles Darwin",
    difficulty: "easy"
  }
];

// Hata analizi için veri yapısı
export interface FlashcardError {
  cardId: string;
  question: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  userAnswer: string;
  correctAnswer: string;
  timestamp: Date;
}