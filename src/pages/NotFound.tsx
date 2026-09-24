import { ArrowRight, Download, FileText } from "lucide-react";
import { Link } from "react-router-dom";

import SeoHead from "@/components/SeoHead";
import SiteHeader from "@/components/SiteHeader";

const PRESENTATION_URL = "/dadatut-presentation.pdf";

const NotFound = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <SeoHead title="Страница не найдена"
      description="Страница не найдена. Презентация ДАДАТУТ о бесплатном размещении объектов доступна для скачивания."
      noindex />
    <SiteHeader />

    <main className="flex-1 pt-[100px] flex items-center">
      <div className="container mx-auto px-4 lg:px-8 py-12 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[88px] sm:text-[120px] font-extrabold leading-none tracking-tight text-primary">
            404
          </p>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-foreground">
            Страница не найдена
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Возможно, ссылка устарела. Если вы искали презентацию ДАДАТУТ
            из нашего письма — она здесь.
          </p>

          <a
            href={PRESENTATION_URL}
            download
            className="mt-8 flex items-center gap-4 rounded-xl bg-card p-4 sm:p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">
                Бесплатное размещение объектов
              </span>
              <span className="block text-xs text-muted-foreground">
                Презентация ДАДАТУТ · PDF, 7,4 МБ
              </span>
            </span>
            <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Скачать</span>
            </span>
          </a>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            На главную
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  </div>
);

export default NotFound;
