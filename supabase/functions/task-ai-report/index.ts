import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OPENAI_API_KEY не настроен");

    // Дата для отчёта (сегодня или из тела запроса)
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const reportDate = body.date || new Date().toISOString().split("T")[0];

    // Проверить — отчёт за сегодня уже есть?
    const { data: existing } = await supabase
      .from("task_ai_reports")
      .select("id, summary, insights, generated_at")
      .eq("report_date", reportDate)
      .single();

    // Если вызван вручную с force:true — перегенерируем
    if (existing && !body.force) {
      return new Response(JSON.stringify({ ok: true, cached: true, report: existing }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Получить все задачи
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id, title, description, assignee, status, priority, due_date, tags, created_at, updated_at");
    if (error) throw error;

    // Статистика для контекста
    const total = tasks.length;
    const byStatus = {
      todo: tasks.filter(t => t.status === "todo").length,
      in_progress: tasks.filter(t => t.status === "in_progress").length,
      done: tasks.filter(t => t.status === "done").length,
    };
    const overdue = tasks.filter(t => t.due_date && t.status !== "done" && new Date(t.due_date) < new Date());
    const dueToday = tasks.filter(t => t.due_date === reportDate && t.status !== "done");
    const highPriority = tasks.filter(t => t.priority === "high" && t.status !== "done");

    // Группировка по исполнителям
    const byAssignee: Record<string, { todo: number; in_progress: number; done: number; overdue: number }> = {};
    for (const t of tasks) {
      const key = t.assignee || "Не назначен";
      if (!byAssignee[key]) byAssignee[key] = { todo: 0, in_progress: 0, done: 0, overdue: 0 };
      byAssignee[key][t.status as keyof typeof byAssignee[string]]++;
      if (t.due_date && t.status !== "done" && new Date(t.due_date) < new Date()) {
        byAssignee[key].overdue++;
      }
    }

    const prompt = `Ты — ИИ-аналитик системы задач компании АрендаСити (коммерческая недвижимость, Иркутск).
Проанализируй состояние задач на ${new Date(reportDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })} и составь ежедневный дайджест на русском языке.

ДАННЫЕ:
Всего задач: ${total}
• К выполнению: ${byStatus.todo}
• В работе: ${byStatus.in_progress}
• Готово: ${byStatus.done}
• Просроченных: ${overdue.length}
• Дедлайн сегодня: ${dueToday.length}
• Высокий приоритет (незакрытых): ${highPriority.length}

По исполнителям:
${Object.entries(byAssignee).map(([name, s]) =>
  `  ${name}: в работе ${s.in_progress}, к выполнению ${s.todo}, готово ${s.done}${s.overdue > 0 ? `, просрочено ${s.overdue}` : ""}`
).join("\n")}

Просроченные задачи:
${overdue.slice(0, 10).map(t => `  • "${t.title}" — ${t.assignee || "не назначена"}, срок: ${t.due_date}`).join("\n") || "  нет"}

Задачи с дедлайном сегодня:
${dueToday.slice(0, 10).map(t => `  • "${t.title}" — ${t.assignee || "не назначена"}`).join("\n") || "  нет"}

Задачи высокого приоритета в работе:
${highPriority.filter(t => t.status === "in_progress").slice(0, 5).map(t => `  • "${t.title}" — ${t.assignee || "не назначена"}`).join("\n") || "  нет"}

ТРЕБОВАНИЯ К ОТВЕТУ (строго JSON):
{
  "summary": "3-5 предложений — общий вывод о состоянии дел, ключевые проблемы и успехи",
  "insights": [
    {
      "type": "warning|success|info|critical",
      "title": "Краткий заголовок",
      "text": "Детальное объяснение (1-2 предложения)",
      "emoji": "подходящий эмодзи"
    }
  ]
}

Insights должно быть 4-6 штук. Будь конкретным, указывай имена сотрудников и задачи где нужно. Тон — профессиональный, деловой, без воды.`;

    // Вызов OpenAI
    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_tokens: 1000,
      }),
    });

    if (!aiResp.ok) {
      const err = await aiResp.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const aiData = await aiResp.json();
    const parsed = JSON.parse(aiData.choices[0].message.content);

    // Сохранить отчёт
    const { data: saved, error: saveErr } = await supabase
      .from("task_ai_reports")
      .upsert({
        report_date: reportDate,
        summary: parsed.summary,
        insights: parsed.insights,
        generated_at: new Date().toISOString(),
      }, { onConflict: "report_date" })
      .select()
      .single();

    if (saveErr) throw saveErr;

    return new Response(JSON.stringify({ ok: true, cached: false, report: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
