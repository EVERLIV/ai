import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ListPropertyBlock from "@/components/ListPropertyBlock";

export default function ListProperty() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <ListPropertyBlock variant="page" />
      </main>
      <SiteFooter />
    </div>
  );
}
