import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Phone, Mail, CheckCircle } from "lucide-react";

interface Props {
  category: string;
}

export default function CategoryContactForm({ category }: Props) {
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
    toast({ title: "Заявка отправлена!", description: "Мы свяжемся с вами в ближайшее время." });
  };

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-foreground">
              Подберём {category} под ваши задачи
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Оставьте заявку — наш менеджер свяжется с вами в течение 15 минут в рабочее время. 
              Мы подберём оптимальный вариант с учётом ваших требований к расположению, площади и бюджету.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-medium text-foreground">+7 (3952) 00-00-00</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">info@arendacity.ru</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background rounded-2xl border border-border p-6 sm:p-8">
            {sent ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold text-foreground">Заявка принята!</h3>
                <p className="text-muted-foreground">Менеджер свяжется с вами в ближайшее время.</p>
                <Button variant="outline" onClick={() => setSent(false)}>Отправить ещё</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">Оставить заявку</h3>
                <Input placeholder="Ваше имя" required />
                <Input type="tel" placeholder="+7 (___) ___-__-__" required />
                <Input type="email" placeholder="Email" />
                <Textarea placeholder={`Требования к ${category.toLowerCase()}: площадь, район, бюджет...`} rows={3} />
                <Button type="submit" className="w-full gap-2" size="lg">
                  <Send className="w-4 h-4" />
                  Отправить заявку
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Нажимая кнопку, вы соглашаетесь с политикой обработки персональных данных
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
