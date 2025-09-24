import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmojiPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
}

const EMOJI_CATEGORIES = {
  smileys: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐"],
  hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💔", "❣️", "💋", "👄", "🫶", "💏", "👨‍❤️‍👨", "👩‍❤️‍👩", "💑", "👨‍❤️‍👩", "👩‍❤️‍👨"],
  animals: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️", "🕸️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐝", "🐞"],
  food: ["🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕"],
  activities: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️‍♀️", "🏋️‍♂️", "🤼‍♀️", "🤼‍♂️", "🤸‍♀️", "🤸‍♂️", "⛹️‍♀️", "⛹️‍♂️", "🤺", "🤾‍♀️", "🤾‍♂️", "🏌️‍♀️", "🏌️‍♂️", "🏇", "🧘‍♀️", "🧘‍♂️", "🏄‍♀️", "🏄‍♂️", "🏊‍♀️", "🏊‍♂️"],
  study: ["📚", "📖", "📝", "✏️", "📒", "📓", "📔", "📕", "📗", "📘", "📙", "📑", "🔖", "🏷️", "💼", "📁", "📂", "🗂️", "📅", "📆", "🗓️", "📇", "📈", "📉", "📊", "📋", "📌", "📍", "📎", "🖇️", "📏", "📐", "✂️", "🗃️", "🗄️", "🗑️", "🔒", "🔓", "🔏", "🔐", "🔑", "🗝️", "🔨", "🪓", "⛏️", "⚒️", "🛠️", "🗡️", "🔗", "⛓️", "🧰", "🧲", "⚗️", "🧪", "🧫", "🧬", "🔬", "🔭", "📡", "💉", "🩸", "💊", "🩹"]
};

export function EmojiPicker({ open, onOpenChange, selectedEmoji, onEmojiSelect, note, onNoteChange }: EmojiPickerProps) {
  const [showPreview, setShowPreview] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setShowPreview(true);
  };

  const handleSave = () => {
    setShowPreview(false);
    onOpenChange(false);
  };

  const handleClear = () => {
    onEmojiSelect('😊');
    onNoteChange('');
    setShowPreview(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Ruh Halinizi Paylaşın</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Section */}
          {showPreview && (
            <div className="relative">
              <div 
                className={`inline-flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-500 ${
                  selectedEmoji ? 'bg-primary/10 border border-primary/20' : 'bg-muted'
                } ${note.trim() ? 'animate-pulse' : ''}`}
                style={{
                  animation: note.trim() ? 'breathe 2s ease-in-out infinite' : 'none'
                }}
              >
                {selectedEmoji && (
                  <span className="text-2xl" role="img" aria-label="selected emoji">
                    {selectedEmoji}
                  </span>
                )}
                {note.trim() && (
                  <span 
                    className={`text-foreground ${
                      note.length > 50 ? 'text-sm' : note.length > 20 ? 'text-base' : 'text-lg'
                    }`}
                  >
                    {note}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Emoji Categories */}
          <Tabs defaultValue="smileys" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="smileys" className="text-xs">😊</TabsTrigger>
              <TabsTrigger value="hearts" className="text-xs">❤️</TabsTrigger>
              <TabsTrigger value="animals" className="text-xs">🐱</TabsTrigger>
              <TabsTrigger value="food" className="text-xs">🍎</TabsTrigger>
              <TabsTrigger value="activities" className="text-xs">⚽</TabsTrigger>
              <TabsTrigger value="study" className="text-xs">📚</TabsTrigger>
            </TabsList>

            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <TabsContent key={category} value={category} className="space-y-2">
                <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-muted/50">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className={`text-2xl p-2 rounded hover:bg-secondary transition-colors ${
                        selectedEmoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''
                      }`}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Note Section - Single Line */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Kısa Not (İsteğe Bağlı)</label>
            <Input
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Kısa bir not yazın..."
              maxLength={60}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-right">
              {note.length}/60 karakter
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between space-x-2">
            <Button variant="outline" onClick={handleClear}>
              Temizle
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!selectedEmoji && !note.trim()}
                className="min-w-[80px]"
              >
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes breathe {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
        `
      }} />
    </Dialog>
  );
}