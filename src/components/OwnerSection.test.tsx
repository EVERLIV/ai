import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import OwnerSection from "./OwnerSection";

vi.mock("@/lib/submitLead", () => ({
  submitLead: vi.fn().mockResolvedValue({ id: null }),
}));

vi.mock("@/hooks/useScrollReveal", () => ({
  useScrollReveal: () => ({ ref: { current: null }, isVisible: true }),
}));

import { submitLead } from "@/lib/submitLead";

describe("OwnerSection", () => {
  beforeEach(() => {
    vi.mocked(submitLead).mockClear();
  });

  it("sends the homepage owner lead instead of ignoring submit", async () => {
    render(<OwnerSection />);

    fireEvent.change(screen.getByPlaceholderText("Ваше имя"), { target: { value: "Андрей" } });
    fireEvent.change(screen.getByPlaceholderText("Телефон"), { target: { value: "+79999999" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Офис" } });
    fireEvent.change(screen.getByPlaceholderText("Адрес и описание объекта"), {
      target: { value: "Тест форма главная" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Отправить заявку" }).closest("form")!);

    await waitFor(() => {
      expect(submitLead).toHaveBeenCalledWith({
        name: "Андрей",
        phone: "+79999999",
        message: "Тест форма главная",
        source: "homepage_owner",
        business_category: "Офис",
      });
    });

    expect(await screen.findByText("Заявка отправлена")).toBeInTheDocument();
  });
});
