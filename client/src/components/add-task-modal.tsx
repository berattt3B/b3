import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { InsertTask } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTaskModal({ open, onOpenChange }: AddTaskModalProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    category: "genel" | "turkce" | "sosyal" | "matematik" | "fizik" | "kimya" | "biyoloji" | "ayt-matematik" | "ayt-fizik" | "ayt-kimya" | "ayt-biyoloji";
    color: string;
    dueDate: string;
  }>({
    title: "",
    description: "",
    priority: "medium",
    category: "genel",
    color: "#8B5CF6", // Default purple
    dueDate: new Date().toISOString().split('T')[0], // Today's date
  });

  const { toast } = useToast();

  const createTaskMutation = useMutation({
    mutationFn: (data: InsertTask) => 
      apiRequest("POST", "/api/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      toast({
        title: "Görev eklendi",
        description: "Yeni görev başarıyla eklendi.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Görev eklenemedi.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      category: "genel",
      color: "#8B5CF6", // Default purple
      dueDate: new Date().toISOString().split('T')[0], // Today's date
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Uyarı",
        description: "Görev başlığı gereklidir.",
        variant: "destructive",
      });
      return;
    }

    createTaskMutation.mutate({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      category: formData.category,
      color: formData.color,
      dueDate: formData.dueDate,
      completed: false,
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni Görev Ekle</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div>
            <Label htmlFor="task-title">Görev Başlığı</Label>
            <Input
              id="task-title"
              placeholder="Görev başlığını girin..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              data-testid="input-task-title"
            />
          </div>

          {/* Task Description */}
          <div>
            <Label htmlFor="task-description">Açıklama</Label>
            <Textarea
              id="task-description"
              placeholder="Görev detaylarını açıklayın..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="h-20 resize-none"
              data-testid="input-task-description"
            />
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-priority">Öncelik</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "low" | "medium" | "high") => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger data-testid="select-task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-category">Ders Kategorisi</Label>
              <Select
                value={formData.category}
                onValueChange={(value: "genel" | "turkce" | "sosyal" | "matematik" | "fizik" | "kimya" | "biyoloji" | "ayt-matematik" | "ayt-fizik" | "ayt-kimya" | "ayt-biyoloji") => 
                  setFormData(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger data-testid="select-task-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="genel">Genel</SelectItem>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b">TYT Dersleri</div>
                  <SelectItem value="turkce">Türkçe</SelectItem>
                  <SelectItem value="sosyal">Sosyal Bilimler</SelectItem>
                  <SelectItem value="matematik">Matematik</SelectItem>
                  <SelectItem value="fizik">Fizik</SelectItem>
                  <SelectItem value="kimya">Kimya</SelectItem>
                  <SelectItem value="biyoloji">Biyoloji</SelectItem>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b border-t">AYT Dersleri</div>
                  <SelectItem value="ayt-matematik">AYT Matematik</SelectItem>
                  <SelectItem value="ayt-fizik">AYT Fizik</SelectItem>
                  <SelectItem value="ayt-kimya">AYT Kimya</SelectItem>
                  <SelectItem value="ayt-biyoloji">AYT Biyoloji</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="task-due-date">Son Tarih</Label>
            <Input
              id="task-due-date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full"
              data-testid="input-task-due-date"
            />
          </div>

          {/* Color Picker */}
          <div>
            <Label htmlFor="task-color">Görev Rengi</Label>
            <div className="flex items-center space-x-3">
              <Input
                id="task-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-16 h-10 rounded cursor-pointer"
                data-testid="input-task-color"
              />
              <div className="flex space-x-2">
                {["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-6 h-6 rounded-full border-2 ${
                      formData.color === color ? "border-gray-400" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit"
              disabled={createTaskMutation.isPending}
              className="flex-1"
              data-testid="button-save-task"
            >
              {createTaskMutation.isPending ? "Ekleniyor..." : "Görev Ekle"}
            </Button>
            <Button 
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="flex-1"
              data-testid="button-cancel-task"
            >
              İptal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
