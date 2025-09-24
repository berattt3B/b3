import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Task, InsertTask } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EditTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

export function EditTaskModal({ open, onOpenChange, task }: EditTaskModalProps) {
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
    color: "#8B5CF6",
    dueDate: new Date().toISOString().split('T')[0],
  });

  const { toast } = useToast();

  // Update form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        category: task.category || "genel",
        color: task.color || "#8B5CF6",
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
      });
    }
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertTask> }) => 
      apiRequest("PUT", `/api/tasks/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      toast({
        title: "Görev güncellendi",
        description: "Görev başarıyla güncellendi.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Görev güncellenemedi.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task) return;

    if (!formData.title.trim()) {
      toast({
        title: "Uyarı",
        description: "Görev başlığı gereklidir.",
        variant: "destructive",
      });
      return;
    }

    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        category: formData.category,
        color: formData.color,
        dueDate: formData.dueDate,
      }
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Görevi Düzenle</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div>
            <Label htmlFor="edit-task-title">Görev Başlığı</Label>
            <Input
              id="edit-task-title"
              placeholder="Görev başlığını girin..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              data-testid="input-edit-task-title"
            />
          </div>

          {/* Task Description */}
          <div>
            <Label htmlFor="edit-task-description">Açıklama</Label>
            <Textarea
              id="edit-task-description"
              placeholder="Görev detaylarını açıklayın..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="h-20 resize-none"
              data-testid="input-edit-task-description"
            />
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-task-priority">Öncelik</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "low" | "medium" | "high") => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger data-testid="select-edit-task-priority">
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
              <Label htmlFor="edit-task-category">Ders Kategorisi</Label>
              <Select
                value={formData.category}
                onValueChange={(value: "genel" | "turkce" | "sosyal" | "matematik" | "fizik" | "kimya" | "biyoloji" | "ayt-matematik" | "ayt-fizik" | "ayt-kimya" | "ayt-biyoloji") => 
                  setFormData(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger data-testid="select-edit-task-category">
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
            <Label htmlFor="edit-task-due-date">Son Tarih</Label>
            <Input
              id="edit-task-due-date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full"
              data-testid="input-edit-task-due-date"
            />
          </div>

          {/* Color Picker */}
          <div>
            <Label htmlFor="edit-task-color">Görev Rengi</Label>
            <div className="flex items-center space-x-3">
              <Input
                id="edit-task-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-16 h-10 rounded cursor-pointer"
                data-testid="input-edit-task-color"
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
              disabled={updateTaskMutation.isPending}
              className="flex-1"
              data-testid="button-update-task"
            >
              {updateTaskMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
            </Button>
            <Button 
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="flex-1"
              data-testid="button-cancel-edit-task"
            >
              İptal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}