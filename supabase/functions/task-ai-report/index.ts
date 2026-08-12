import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Дешёвая текстовая модель: отчёт — это сводка по готовым цифрам. */
const REPORT_MODEL = "claude-haiku-4-5";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY не настроен");

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

ЧТО НУЖНО:
• summary — 3–5 предложений: общий вывод о состоянии дел, ключевые проблемы и успехи.
• insights — 4–6 пунктов. Для каждого: тип (warning, success, info или critical),
  краткий заголовок, объяснение в 1–2 предложения и подходящий эмодзи.

Указывай конкретные имена сотрудников и названия задач. Тон деловой, без воды.`;

    // Вызов Anthropic. Схема гарантирует форму JSON — разбирать
    // текст ответа вручную и надеяться на валидность не нужно.
    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: REPORT_MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
        output_config: {
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["warning", "success", "info", "critical"] },
                      title: { type: "string" },
                      text: { type: "string" },
                      emoji: { type: "string" },
                    },
                    required: ["type", "title", "text", "emoji"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["summary", "insights"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!aiResp.ok) {
      const err = await aiResp.text();
      console.error("Anthropic error:", aiResp.status, err);
      throw new Error(`Anthropic error ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    if (aiData.stop_reason === "refusal") {
      throw new Error("Модель отклонила запрос");
    }
    const textBlock = (aiData.content ?? []).find((b: { type: string }) => b.type === "text");
    if (!textBlock?.text) throw new Error("Пустой ответ модели");
    const parsed = JSON.parse(textBlock.text);

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
