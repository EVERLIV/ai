import { Building2, Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  useAdminDevelopers,
  useAdminSetDeveloperVerification,
  useReviewDeveloperDocument,
} from "@/hooks/useDeveloper";
import { fetchDeveloperDocumentsApi } from "@/lib/developerApi";
import {
  DEVELOPER_SUBTYPE_LABELS,
  type Developer,
} from "@/lib/developerTypes";
import { useQuery } from "@tanstack/react-query";
import VerifiedBadge from "@/components/VerifiedBadge";

export default function DevelopersAdminTab() {
  const { toast } = useToast();
  const { data: developers = [], isLoading } = useAdminDevelopers();
  const setVerification = useAdminSetDeveloperVerification();
  const reviewDoc = useReviewDeveloperDocument();
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");
  const [docsFor, setDocsFor] = useState<string | null>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ["admin-developer-docs", docsFor],
    enabled: !!docsFor,
    queryFn: () => fetchDeveloperDocumentsApi(docsFor!),
  });

  const filtered = developers.filter((d) => {
    if (filter === "pending") return d.verification_status === "pending";
    if (filter === "verified") return d.verification_status === "verified";
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Загрузка…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Все"],
            ["pending", "На проверке"],
            ["verified", "Верифицированы"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`h-8 px-3 rounded-md text-xs font-medium ${
              filter === k
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.map((d: Developer) => (
          <li
            key={d.id}
            className="border border-border/60 rounded-lg p-4 bg-card flex flex-col sm:flex-row gap-3 sm:items-center"
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {d.logo_url ? (
                <img src={d.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/zastroyshchik/${d.id}`}
                  className="text-sm font-semibold hover:text-primary"
                >
                  {d.name}
                </Link>
                {d.verification_status === "verified" && (
                  <VerifiedBadge size="sm" showLabel={false} />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {DEVELOPER_SUBTYPE_LABELS[d.subtype]} ·{" "}
                {d.verification_status} · {d.city || "город не указан"}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className="h-8 px-2.5 text-[11px] rounded-md border border-border"
                onClick={() => setDocsFor(docsFor === d.id ? null : d.id)}
              >
                Документы
              </button>
              {d.verification_status !== "verified" && (
                <button
                  type="button"
                  className="h-8 px-2.5 text-[11px] rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1"
                  disabled={setVerification.isPending}
                  onClick={async () => {
                    await setVerification.mutateAsync({
                      developerId: d.id,
                      status: "verified",
                    });
                    toast({ title: "Верифицирован" });
                  }}
                >
                  <Check className="w-3.5 h-3.5" /> OK
                </button>
              )}
              {d.verification_status !== "rejected" && (
                <button
                  type="button"
                  className="h-8 px-2.5 text-[11px] rounded-md border border-border text-destructive inline-flex items-center gap-1"
                  onClick={async () => {
                    await setVerification.mutateAsync({
                      developerId: d.id,
                      status: "rejected",
                    });
                    toast({ title: "Отклонён" });
                  }}
                >
                  <X className="w-3.5 h-3.5" /> Нет
                </button>
              )}
            </div>
            {docsFor === d.id && (
              <div className="w-full border-t border-border/50 pt-3 mt-1 space-y-2">
                {docs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Нет документов</p>
                ) : (
                  docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {doc.title} ({doc.status})
                      </a>
                      {doc.status === "pending" && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            className="text-primary"
                            onClick={() =>
                              reviewDoc.mutate({
                                id: doc.id,
                                status: "approved",
                              })
                            }
                          >
                            Одобрить
                          </button>
                          <button
                            type="button"
                            className="text-destructive"
                            onClick={() =>
                              reviewDoc.mutate({
                                id: doc.id,
                                status: "rejected",
                              })
                            }
                          >
                            Отклонить
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
