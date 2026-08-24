type AuthLikeError = {
  code?: string;
  message?: string;
  status?: number;
};

export function describeAuthError(error: AuthLikeError | null | undefined): {
  title: string;
  description: string;
  kind: "unconfirmed" | "credentials" | "timeout" | "rate" | "other";
} {
  const code = (error?.code || "").toLowerCase();
  const message = (error?.message || "").toLowerCase();
  const status = error?.status;

  const unconfirmed =
    code === "email_not_confirmed" ||
    message.includes("email not confirmed") ||
    message.includes("not confirmed");

  if (unconfirmed) {
    return {
      title: "Email ещё не подтверждён",
      description:
        "Откройте письмо от АрендаСити и перейдите по ссылке. Проверьте папку «Спам».",
      kind: "unconfirmed",
    };
  }

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials")
  ) {
    return {
      title: "Неверный email или пароль",
      description: "Проверьте данные или восстановите пароль, если забыли его.",
      kind: "credentials",
    };
  }

  if (
    status === 504 ||
    code === "request_timeout" ||
    message.includes("timed out") ||
    message.includes("timeout")
  ) {
    return {
      title: "Сервер не ответил",
      description: "Попробуйте войти ещё раз через минуту.",
      kind: "timeout",
    };
  }

  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit"
  ) {
    return {
      title: "Слишком много попыток",
      description: "Подождите пару минут и попробуйте снова.",
      kind: "rate",
    };
  }

  if (code === "user_banned") {
    return {
      title: "Вход недоступен",
      description: "Аккаунт заблокирован. Напишите нам: info@arendacity.ru",
      kind: "other",
    };
  }

  return {
    title: "Ошибка входа",
    description:
      error?.message?.trim() || "Не удалось войти. Попробуйте ещё раз.",
    kind: "other",
  };
}
