const listElement = document.querySelector("#questionnaire-list");
const statusElement = document.querySelector("#list-status");

function parseQuestionnaires(contents) {
  const entries = contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const fields = line.split("|").map((field) => field.trim());
      const title = fields[0].replace(/^--\s*/, "");
      const dateRange = fields[1].match(/^(\d{4}-\d{2}-\d{2})\s*\/\s*(\d{4}-\d{2}-\d{2})$/);

      return {
        title,
        startDate: dateRange?.[1] || "",
        endDate: dateRange?.[2] || "",
        url: fields[2] || "",
        valid: Boolean(title && dateRange && isValidDate(dateRange[1]) && isValidDate(dateRange[2])),
      };
    });

  return {
    items: entries.filter((item) => item.valid),
    invalidCount: entries.filter((item) => !item.valid).length,
  };
}

function isValidDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderQuestionnaires(items, invalidCount) {
  const today = getLocalDateString(new Date());
  const activeItems = items.filter((item) => item.startDate <= today && today <= item.endDate);
  listElement.replaceChildren(...activeItems.map(createQuestionnaireItem));

  if (activeItems.length === 0) {
    statusElement.textContent = "目前没有可填写的问卷。";
  } else {
    statusElement.textContent = "";
  }

  if (invalidCount > 0) {
    const formatNotice = `有 ${invalidCount} 条问卷记录格式不正确，未显示。`;
    statusElement.textContent = statusElement.textContent
      ? `${statusElement.textContent} ${formatNotice}`
      : formatNotice;
  }

  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 0, 0);
  window.setTimeout(
    () => renderQuestionnaires(items, invalidCount),
    nextMidnight.getTime() - Date.now(),
  );
}

function createQuestionnaireItem(item) {
  const listItem = document.createElement("li");
  listItem.className = "questionnaire-item";

  const details = document.createElement("div");
  details.className = "questionnaire-details";

  const title = document.createElement("h3");
  title.textContent = item.title;
  details.append(title);

  const dates = document.createElement("p");
  dates.className = "questionnaire-dates";
  dates.textContent = `${item.startDate} 至 ${item.endDate}`;
  details.append(dates);

  const link = getSafeQuestionnaireUrl(item.url);
  const actions = document.createElement("div");
  actions.className = "questionnaire-actions";

  if (link) {
    const action = document.createElement("a");
    action.className = "questionnaire-action";
    action.href = link;
    action.target = "_blank";
    action.rel = "noopener noreferrer";
    action.textContent = "填写问卷";
    actions.append(action);

    const completion = document.createElement("div");
    completion.className = "questionnaire-completion";

    const completionLabel = document.createElement("span");
    completionLabel.className = "questionnaire-completion-label";
    completionLabel.setAttribute("role", "status");

    const completionButton = document.createElement("button");
    completionButton.className = "questionnaire-completion-button";
    completionButton.type = "button";

    const cookieName = getCompletionCookieName(item);
    const updateCompletion = () => {
      const isComplete = hasCompletionCookie(cookieName);
      completionLabel.textContent = isComplete ? "已填写（手动标记）" : "";
      completionButton.textContent = isComplete ? "撤销标记" : "我已填写";
      completionButton.setAttribute("aria-pressed", String(isComplete));
    };

    completionButton.addEventListener("click", () => {
      if (hasCompletionCookie(cookieName)) {
        clearCompletionCookie(cookieName);
        updateCompletion();
        return;
      }

      saveCompletionCookie(cookieName, item.endDate);
      if (!hasCompletionCookie(cookieName)) {
        completionLabel.textContent = "Cookie 保存失败，请检查浏览器设置。";
        return;
      }

      updateCompletion();
    });

    updateCompletion();
    completion.append(completionLabel, completionButton);
    actions.append(completion);
  } else {
    const note = document.createElement("span");
    note.className = "questionnaire-note";
    note.textContent = item.url ? "链接格式无效" : "问卷链接暂未填写";
    actions.append(note);
  }

  listItem.append(details, actions);
  return listItem;
}

function getCompletionCookieName(item) {
  const questionnaireKey = `${item.title}_${item.startDate}_${item.endDate}`;
  return `questionnaire_done_${encodeURIComponent(questionnaireKey)}`;
}

function hasCompletionCookie(name) {
  return document.cookie.split("; ").some((cookie) => cookie.startsWith(`${name}=1`));
}

function saveCompletionCookie(name, endDate) {
  const expires = new Date(`${endDate}T00:00:00`);
  expires.setDate(expires.getDate() + 1);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=1; Expires=${expires.toUTCString()}; Path=/; SameSite=Lax${secure}`;
}

function clearCompletionCookie(name) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

function getSafeQuestionnaireUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value, window.location.href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

async function loadQuestionnaires() {
  try {
    const response = await fetch("./questionnaire_list", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`列表读取失败（${response.status}）`);
    }

    const { items, invalidCount } = parseQuestionnaires(await response.text());
    renderQuestionnaires(items, invalidCount);
  } catch (error) {
    statusElement.textContent = `无法读取问卷列表：${error.message}。请通过网站地址打开此页面。`;
  }
}

loadQuestionnaires();