import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, Plus, LogOut, Users, Home, Edit, Trash2,
  BarChart3, Eye, MapPin, ArrowLeft
} from "lucide-react";

interface PropertyForm {
  type: string;
  class: string;
  area: number;
  price: number;
  price_per_m2: number;
  address: string;
  district: string;
  floor: string;
  total_floors: number;
  ceiling_height: number;
  parking: string;
  condition: string;
  layout: string;
  deal_type: string;
  deposit: string;
  contract_term: string;
  description: string;
  features: string;
  manager_id: string;
  client_id: string;
  is_active: boolean;
}

const emptyForm: PropertyForm = {
  type: "Офис", class: "B", area: 0, price: 0, price_per_m2: 0,
  address: "", district: "", floor: "", total_floors: 1,
  ceiling_height: 3, parking: "", condition: "", layout: "",
  deal_type: "Аренда", deposit: "", contract_term: "",
  description: "", features: "", manager_id: "", client_id: "",
  is_active: true,
};

export default function Dashboard() {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyForm>(emptyForm);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["dashboard-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, manager:profiles!properties_manager_id_fkey(id, full_name), client:profiles!properties_client_id_fkey(id, full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: PropertyForm) => {
      const payload = {
        type: formData.type,
        class: formData.class,
        area: formData.area,
        price: formData.price,
        price_per_m2: formData.area > 0 ? Math.round(formData.price / formData.area) : 0,
        address: formData.address,
        district: formData.district,
        floor: formData.floor,
        total_floors: formData.total_floors,
        ceiling_height: formData.ceiling_height,
        parking: formData.parking,
        condition: formData.condition,
        layout: formData.layout,
        deal_type: formData.deal_type,
        deposit: formData.deposit,
        contract_term: formData.contract_term,
        description: formData.description,
        features: formData.features.split(",").map((f) => f.trim()).filter(Boolean),
        manager_id: formData.manager_id || null,
        client_id: formData.client_id || null,
        is_active: formData.is_active,
      };

      if (editId) {
        const { error } = await supabase.from("properties").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("properties").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-properties"] });
      setDialogOpen(false);
      setEditId(null);
      setForm(emptyForm);
      toast({ title: editId ? "Объект обновлён" : "Объект добавлен" });
    },
    onError: (err: Error) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-properties"] });
      toast({ title: "Объект удалён" });
    },
  });

  const openEdit = (prop: any) => {
    setEditId(prop.id);
    setForm({
      type: prop.type, class: prop.class, area: prop.area, price: prop.price,
      price_per_m2: prop.price_per_m2, address: prop.address, district: prop.district,
      floor: prop.floor || "", total_floors: prop.total_floors || 1,
      ceiling_height: prop.ceiling_height || 3, parking: prop.parking || "",
      condition: prop.condition || "", layout: prop.layout || "",
      deal_type: prop.deal_type, deposit: prop.deposit || "",
      contract_term: prop.contract_term || "", description: prop.description || "",
      features: (prop.features || []).join(", "),
      manager_id: prop.manager_id || "", client_id: prop.client_id || "",
      is_active: prop.is_active,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const updateField = (key: keyof PropertyForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const stats = {
    total: properties.length,
    active: properties.filter((p: any) => p.is_active).length,
    totalArea: properties.reduce((s: number, p: any) => s + Number(p.area), 0),
    totalViews: properties.reduce((s: number, p: any) => s + (p.views_count || 0), 0),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Building2 className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>
              Панель управления
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => { signOut(); navigate("/"); }}>
              <LogOut className="w-4 h-4 mr-1" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Всего объектов", value: stats.total, icon: Home, color: "text-primary" },
            { label: "Активных", value: stats.active, icon: Eye, color: "text-green-600" },
            { label: "Общая площадь", value: `${stats.totalArea.toLocaleString()} м²`, icon: MapPin, color: "text-blue-600" },
            { label: "Просмотры", value: stats.totalViews, icon: BarChart3, color: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="properties">
          <TabsList>
            <TabsTrigger value="properties"><Home className="w-4 h-4 mr-1" /> Объекты</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" /> Пользователи</TabsTrigger>
          </TabsList>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Объекты недвижимости</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Добавить объект</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editId ? "Редактировать объект" : "Новый объект"}</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4"
                  >
                    <div className="space-y-2">
                      <Label>Тип</Label>
                      <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Офис", "Торговая", "Склад", "Земля", "Производство"].map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Класс</Label>
                      <Select value={form.class} onValueChange={(v) => updateField("class", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["A", "A+", "B+", "B", "C", "-"].map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Тип сделки</Label>
                      <Select value={form.deal_type} onValueChange={(v) => updateField("deal_type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Аренда">Аренда</SelectItem>
                          <SelectItem value="Продажа">Продажа</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Площадь (м²)</Label>
                      <Input type="number" value={form.area || ""} onChange={(e) => updateField("area", Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Цена (₽/мес)</Label>
                      <Input type="number" value={form.price || ""} onChange={(e) => updateField("price", Number(e.target.value))} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Адрес</Label>
                      <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Район/город</Label>
                      <Input value={form.district} onChange={(e) => updateField("district", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Этаж</Label>
                      <Input value={form.floor} onChange={(e) => updateField("floor", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Всего этажей</Label>
                      <Input type="number" value={form.total_floors || ""} onChange={(e) => updateField("total_floors", Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Высота потолков (м)</Label>
                      <Input type="number" step="0.1" value={form.ceiling_height || ""} onChange={(e) => updateField("ceiling_height", Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Парковка</Label>
                      <Input value={form.parking} onChange={(e) => updateField("parking", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Состояние</Label>
                      <Input value={form.condition} onChange={(e) => updateField("condition", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Планировка</Label>
                      <Input value={form.layout} onChange={(e) => updateField("layout", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Залог</Label>
                      <Input value={form.deposit} onChange={(e) => updateField("deposit", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Срок договора</Label>
                      <Input value={form.contract_term} onChange={(e) => updateField("contract_term", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Менеджер</Label>
                      <Select value={form.manager_id} onValueChange={(v) => updateField("manager_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Выберите менеджера" /></SelectTrigger>
                        <SelectContent>
<SelectItem value="none">Не назначен</SelectItem>
                          {users.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Клиент (собственник)</Label>
                      <Select value={form.client_id || "none"} onValueChange={(v) => updateField("client_id", v === "none" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="Выберите клиента" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Не назначен</SelectItem>
                          {users.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Описание</Label>
                      <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Особенности (через запятую)</Label>
                      <Input value={form.features} onChange={(e) => updateField("features", e.target.value)}
                        placeholder="Кондиционирование, Охрана, Интернет" />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
                      <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Тип</TableHead>
                        <TableHead>Адрес</TableHead>
                        <TableHead>Площадь</TableHead>
                        <TableHead>Цена</TableHead>
                        <TableHead>Сделка</TableHead>
                        <TableHead>Менеджер</TableHead>
                        <TableHead>Клиент</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Загрузка...</TableCell></TableRow>
                      ) : properties.length === 0 ? (
                        <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Нет объектов</TableCell></TableRow>
                      ) : (
                        properties.map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <Badge variant="secondary">{p.type}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{p.address}</TableCell>
                            <TableCell>{p.area} м²</TableCell>
                            <TableCell className="font-medium">{Number(p.price).toLocaleString()} ₽</TableCell>
                            <TableCell>{p.deal_type}</TableCell>
                            <TableCell className="text-sm">{p.manager?.full_name || "—"}</TableCell>
                            <TableCell className="text-sm">{p.client?.full_name || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={p.is_active ? "default" : "outline"}>
                                {p.is_active ? "Активен" : "Скрыт"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon"
                                  onClick={() => { if (confirm("Удалить объект?")) deleteMutation.mutate(p.id); }}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Пользователи системы</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}...</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
