export type AppPlatform = "ios" | "android";

export type InstallStep = {
  title: string;
  description: string;
  hint?: string;
};

export type InstallTip = {
  title: string;
  description: string;
};

export const IOS_STEPS: InstallStep[] = [
  {
    title: "Откройте Safari",
    description: "Перейдите на arendacity.com в браузере Safari на iPhone.",
    hint: "PWA устанавливается только через Safari, не через Chrome.",
  },
  {
    title: "Нажмите «Поделиться»",
    description:
      "Внизу экрана нажмите кнопку «Поделиться» — квадрат со стрелкой вверх.",
  },
  {
    title: "На экран «Домой»",
    description:
      'Выберите «На экран "Домой"», при необходимости измените название и нажмите «Добавить».',
  },
];

export const ANDROID_STEPS: InstallStep[] = [
  {
    title: "Откройте Chrome",
    description: "Перейдите на arendacity.com в Google Chrome на Android.",
    hint: "Установка через Chrome работает надёжнее всего.",
  },
  {
    title: "Меню браузера",
    description:
      "Нажмите ⋮ в правом верхнем углу и выберите «Установить приложение» или «Добавить на главный экран».",
  },
  {
    title: "Подтвердите установку",
    description:
      "Либо нажмите «Установить» в чёрном баннере вверху сайта — появится после нескольких секунд на странице.",
  },
];

export const IOS_TIP: InstallTip = {
  title: "iPhone может удалять неиспользуемые приложения",
  description:
    "Чтобы иконка АрендаСити не пропала: Настройки → App Store → отключите «Выгрузка неиспользуемых приложений».",
};

export const ANDROID_NOTE =
  "Если пункта «Установить приложение» нет — обновите страницу или зайдите на сайт снова через Chrome.";
