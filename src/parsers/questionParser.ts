import { HTMLElement, parse } from "node-html-parser";

import type {
    Choice,
    ClozePart,
    DragItem,
    DropField,
    OrderingItem,
    ParsedQuestion,
    QuestionType,
    SelectField,
} from "../types/question.js";

function cleanText(value?: string | null): string {
  if (!value) return "";

  return value
    .replace(/&nbsp;/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseQuestionText(root: HTMLElement): string {
  const qtext =
    root.querySelector(".qtext") ?? root.querySelector(".formulation");

  if (!qtext) return "";

  // Clone để không ảnh hưởng HTML gốc
  const cloned = parse(qtext.innerHTML);

  // Embedded Answers / Cloze
  cloned.querySelectorAll("input, select, textarea").forEach((element) => {
    const type = element.getAttribute("type") ?? "";

    if (type !== "hidden") {
      element.replaceWith(" ___ ");
    }
  });

  // Xóa media player
  cloned
    .querySelectorAll(".mediaplugin")
    .forEach((element) => element.remove());

  cloned.querySelectorAll("audio").forEach((element) => element.remove());

  cloned.querySelectorAll("a").forEach((element) => {
    const href = element.getAttribute("href") ?? "";

    if (/\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(href)) {
      element.remove();
    }
  });

  // Xóa text hỗ trợ accessibility của Moodle:
  // "Blank 1 Question 1"
  cloned
    .querySelectorAll(".accesshide, .sr-only, .visually-hidden")
    .forEach((element) => element.remove());

  // Select Missing Words:
  // thay dropdown trong câu hỏi bằng ___
  cloned.querySelectorAll("select").forEach((select) => {
    select.replaceWith(" ___ ");
  });

  // Drag and drop into text
  cloned
    .querySelectorAll(".drop, .dropzone, [class*='place']")
    .forEach((element) => {
      element.replaceWith(" ___ ");
    });

  return cleanText(cloned.text)
    .replace(/Blank\s+\d+\s+Question\s+\d+/gi, "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
/**
 * Moodle sinh ID dạng q103:2_choice0_label. Dấu ':' có ý nghĩa đặc biệt
 * trong CSS selector nên không dùng querySelector(`#${id}`).
 */
function findById(root: HTMLElement, id: string): HTMLElement | undefined {
  if (!id) return undefined;

  return root
    .querySelectorAll("[id]")
    .find((element) => element.getAttribute("id") === id);
}

function findLabelFor(
  root: HTMLElement,
  controlId: string,
): HTMLElement | undefined {
  if (!controlId) return undefined;

  return root
    .querySelectorAll("label")
    .find((label) => label.getAttribute("for") === controlId);
}

function detectType(root: HTMLElement, html: string): QuestionType {
  if (html.includes("que description")) return "description";
  if (html.includes("que truefalse")) return "truefalse";
  if (html.includes("que gapselect")) return "gapselect";
  if (html.includes("que shortanswer")) return "shortanswer";
  if (html.includes("que essay")) return "essay";
  if (html.includes("que randomsamatch")) return "randomsamatch";
  if (html.includes("que match")) return "match";
  if (html.includes("que ddwtos")) return "ddwtos";
  if (html.includes("que ddimageortext")) return "ddimageortext";
  if (html.includes("que ddmarker")) return "ddmarker";
  if (html.includes("que numerical")) return "numerical";
  if (html.includes("que calculatedmulti")) return "calculatedmulti";
  if (html.includes("que calculatedsimple")) return "calculatedsimple";
  if (html.includes("que calculated ")) return "calculated";
  if (html.includes("que multianswer")) return "multianswer";
  if (html.includes("que ordering")) return "ordering";

  if (html.includes("que multichoice")) {
    const answerInputs = root.querySelectorAll(".answer input");
    const hasChoiceCheckbox = answerInputs.some((input) => {
      const type = input.getAttribute("type") ?? "";
      const name = input.getAttribute("name") ?? "";
      return type === "checkbox" && /_choice\d+$/.test(name);
    });

    return hasChoiceCheckbox ? "multichoice-multiple" : "multichoice-single";
  }

  return "unknown";
}

function getLabelForInput(root: HTMLElement, input: HTMLElement): string {
  const id = input.getAttribute("id") ?? "";
  const labelId = input.getAttribute("aria-labelledby") ?? "";

  if (labelId) {
    const ids = labelId.split(/\s+/).filter(Boolean);
    const text = ids
      .map((item) => cleanText(findById(root, item)?.text))
      .filter(Boolean)
      .join(" ");

    if (text) return text;
  }

  if (id) {
    const label = findLabelFor(root, id);
    if (label) return cleanText(label.text);
  }

  const parentLabel = input.closest("label");
  if (parentLabel) return cleanText(parentLabel.text);

  const answerRow =
    input.closest(".answer") ?? input.closest(".r0") ?? input.closest(".r1");
  return cleanText((answerRow as HTMLElement | undefined)?.text);
}

function stripChoicePrefix(label: string): string {
  // Calculated multichoice của Moodle đôi khi trả option dưới dạng
  // <pre><code>11.50</code></pre>. Khi text bị escape, node-html-parser có thể
  // trả literal "<code>11.50</code>". Chuẩn hóa để mobile chỉ hiện giá trị.
  const normalized = label
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/<\/?(?:pre|code)\b[^>]*>/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized
    .replace(/^[a-zA-Z][.)]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim();
}

function parseRadioChoices(root: HTMLElement): {
  fieldName?: string;
  choices: Choice[];
} {
  const inputs = root
    .querySelectorAll('.answer input[type="radio"]')
    .filter((input) => {
      const name = input.getAttribute("name") ?? "";
      return /_answer$/.test(name);
    });

  const choices: Choice[] = [];
  let fieldName: string | undefined;

  inputs.forEach((input) => {
    const value = input.getAttribute("value") ?? "";
    const name = input.getAttribute("name") ?? "";

    if (!name || value === "-1") return;
    if (!fieldName) fieldName = name;

    const label = stripChoicePrefix(getLabelForInput(root, input));

    choices.push({
      label: label || value,
      value,
      fieldName: name,
    });
  });

  return { fieldName, choices };
}

function parseCheckboxChoices(root: HTMLElement): Choice[] {
  const inputs = root
    .querySelectorAll('.answer input[type="checkbox"]')
    .filter((input) => {
      const name = input.getAttribute("name") ?? "";
      return /_choice\d+$/.test(name);
    });

  return inputs.map((input) => {
    const fieldName = input.getAttribute("name") ?? "";
    const value = input.getAttribute("value") ?? "1";
    const label = stripChoicePrefix(getLabelForInput(root, input));

    return {
      label: label || fieldName,
      value,
      fieldName,
    };
  });
}

function parseTextInput(root: HTMLElement): string | undefined {
  const input = root.querySelector(
    '.answer input[type="text"], .ablock input[type="text"], input[type="text"][name*="_answer"]',
  );

  return input?.getAttribute("name") ?? undefined;
}

function parseSelectFields(root: HTMLElement): SelectField[] {
  const selects = root
    .querySelectorAll("select")
    .filter((select) => Boolean(select.getAttribute("name")));

  return selects.map((select) => {
    const fieldName = select.getAttribute("name") ?? "";
    let label = "";

    const row = select.closest("tr");
    if (row) {
      label = cleanText(
        row.querySelector(".text")?.text ??
          row.querySelector("th")?.text ??
          row.querySelector("td")?.text,
      );
    }

    if (!label) {
      const id = select.getAttribute("id") ?? "";
      const labelElement = findLabelFor(root, id);
      label = cleanText(labelElement?.text);
    }

    const choices: Choice[] = select
      .querySelectorAll("option")
      .map((option) => ({
        label: cleanText(option.text) || "Chọn...",
        value: option.getAttribute("value") ?? "",
      }));

    return { fieldName, label, choices };
  });
}

function parseOrdering(root: HTMLElement): {
  items: OrderingItem[];
  fieldName?: string;
} {
  const items = root.querySelectorAll(".sortableitem").map((item) => {
    const id = item.getAttribute("id") ?? "";
    const content =
      item.querySelector("[data-itemcontent]") ??
      item.querySelector(".sortableitemcontent") ??
      item.querySelector(".content");

    let text = cleanText(content?.text ?? item.text);
    text = text.replace(/^[↑↓☰\s]+/, "").trim();

    return { id, text };
  });

  const hidden = root.querySelector('input[type="hidden"][name*="_response_"]');

  return {
    items: items.filter((item) => item.id && item.text),
    fieldName: hidden?.getAttribute("name") ?? undefined,
  };
}

function parseDropFields(
  root: HTMLElement,
  nameToken: "_p" | "_c",
): DropField[] {
  return root
    .querySelectorAll(`input[type="hidden"][name*="${nameToken}"]`)
    .filter((input) => {
      const name = input.getAttribute("name") ?? "";
      return /_(p|c)\d+$/.test(name);
    })
    .map((input, index) => ({
      place: index + 1,
      fieldName: input.getAttribute("name") ?? "",
    }));
}

function parseDragDropText(root: HTMLElement): {
  items: DragItem[];
  fields: DropField[];
} {
  const dragHomes = root.querySelectorAll(".draghome");

  const items: DragItem[] = dragHomes
    .map((element, index) => {
      // Lấy nội dung của chính drag item,
      // KHÔNG lấy toàn bộ question
      const text = cleanText(
        element.querySelector(".drag")?.text ??
          element.querySelector(".dragtext")?.text ??
          element.text,
      );

      return {
        id: element.getAttribute("id") ?? `choice-${index + 1}`,
        choice: Number(element.getAttribute("data-choice")) || index + 1,
        text,
      };
    })
    .filter((item) => Boolean(item.text));

  return {
    items,
    fields: parseDropFields(root, "_p"),
  };
}

function parseDragDropQuestionText(root: HTMLElement): string {
  const qtext = root.querySelector(".qtext");

  if (!qtext) return "";

  const cloned = parse(qtext.innerHTML);

  // Xóa accessibility text
  cloned
    .querySelectorAll(".accesshide, .sr-only, .visually-hidden")
    .forEach((element) => element.remove());

  // Thay các vị trí thả bằng ___
  cloned.querySelectorAll(".drop").forEach((element) => {
    element.replaceWith(" ___ ");
  });

  return cleanText(cloned.text)
    .replace(/Blank\s*\d+\s*Question\s*\d+/gi, " ___ ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDragImage(root: HTMLElement): {
  image?: string;
  items: DragItem[];
  fields: DropField[];
} {
  const imageElement =
    root.querySelector("img.dropbackground") ??
    root.querySelector(".dropzone img");
  const image = imageElement?.getAttribute("src") ?? undefined;

  const dragHomes = root.querySelectorAll(".draghomes .draghome");
  const items: DragItem[] = dragHomes
    .map((element, index) => ({
      id: element.getAttribute("id") ?? `choice-${index + 1}`,
      choice: Number(element.getAttribute("data-choice")) || index + 1,
      text: cleanText(element.text),
    }))
    .filter((item) => item.text);

  return {
    image,
    items,
    fields: parseDropFields(root, "_p"),
  };
}

function parseMarkers(root: HTMLElement): {
  image?: string;
  items: DragItem[];
  fields: DropField[];
} {
  const image =
    (
      root.querySelector("img.dropbackground") ??
      root.querySelector(".dropzone img")
    )?.getAttribute("src") ?? undefined;

  const candidates = [
    ...root.querySelectorAll(".draghomes .marker"),
    ...root.querySelectorAll(".draghomes .draghome"),
  ];

  const seen = new Set<string>();
  const items: DragItem[] = [];

  candidates.forEach((marker, index) => {
    const text = cleanText(
      marker.querySelector(".markertext")?.text ?? marker.text,
    );
    if (!text || seen.has(text)) return;
    seen.add(text);

    items.push({
      id: marker.getAttribute("id") ?? `marker-${index + 1}`,
      choice: index + 1,
      text,
    });
  });

  return {
    image,
    items,
    fields: parseDropFields(root, "_c"),
  };
}

function getClozeContainer(root: HTMLElement): HTMLElement | null {
  return (
    root.querySelector(".qtext") ??
    root.querySelector(".formulation") ??
    root.querySelector(".ablock")
  );
}

function parseCloze(root: HTMLElement): ClozePart[] {
  const qtext = getClozeContainer(root);

  if (!qtext) {
    console.warn("CLOZE: không tìm thấy .qtext");
    return [];
  }

  const parts: ClozePart[] = [];

  const walk = (node: any) => {
    if (!node) return;

    // Text node
    if (node.nodeType === 3) {
      let text = node.rawText ?? "";

      // Xóa accessibility text Moodle
      text = text
        .replace(/Question\s+text/gi, "")
        .replace(/Answer\s+\d+\s+Question\s+\d+/gi, "")
        .replace(/Blank\s+\d+\s+Question\s+\d+/gi, "");

      if (text.trim()) {
        parts.push({
          type: "text",
          text,
        });
      }

      return;
    }

    const element = node as HTMLElement;

    const tagName = element.tagName?.toUpperCase?.() ?? "";

    // Bỏ các nội dung accessibility của Moodle
    const className = element.getAttribute?.("class") ?? "";

    if (
      className.includes("accesshide") ||
      className.includes("sr-only") ||
      className.includes("visually-hidden")
    ) {
      return;
    }

    // INPUT của Embedded Answers
    if (tagName === "INPUT") {
      const type = element.getAttribute("type") ?? "text";

      const fieldName = element.getAttribute("name") ?? "";

      // Chỉ lấy input người dùng thực sự nhập
      if (fieldName && !["hidden", "submit", "button"].includes(type)) {
        parts.push({
          type: "input",
          fieldName,
        });
      }

      return;
    }

    // SELECT của Cloze multichoice
    if (tagName === "SELECT") {
      const fieldName = element.getAttribute("name") ?? "";

      if (fieldName) {
        parts.push({
          type: "input",
          fieldName,
        });
      }

      return;
    }

    // TEXTAREA nếu Moodle sử dụng
    if (tagName === "TEXTAREA") {
      const fieldName = element.getAttribute("name") ?? "";

      if (fieldName) {
        parts.push({
          type: "input",
          fieldName,
        });
      }

      return;
    }

    // Tiếp tục duyệt node con
    if (element.childNodes?.length) {
      element.childNodes.forEach((child: any) => {
        walk(child);
      });
    }
  };;

  qtext.childNodes.forEach((node: any) => {
    walk(node);
  });

  return parts;
}

function parseDescriptionText(root: HTMLElement): string {
  const qtext = root.querySelector(".qtext");

  if (!qtext) return "";

  let html = qtext.innerHTML;

  // Các thẻ xuống dòng
  html = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ");

  const cloned = parse(html);

  // Xóa accessibility text
  cloned
    .querySelectorAll(".accesshide, .sr-only, .visually-hidden")
    .forEach((element) => element.remove());

  // Xóa audio/media khỏi phần text
  cloned
    .querySelectorAll("audio, video, .mediaplugin")
    .forEach((element) => element.remove());

  let text = cloned.text;

  return (
    text
      .replace(/&nbsp;/gi, " ")
      .replace(/\u00a0/g, " ")

      // Chỉ gom space/tab, KHÔNG gom \n
      .replace(/[ \t]+/g, " ")

      // Xóa space đầu/cuối mỗi dòng
      .replace(/ *\n */g, "\n")

      // Không cho quá nhiều dòng trống
      .replace(/\n{3,}/g, "\n\n")

      .trim()
  );
}

export function parseQuestion(html: string): ParsedQuestion {
  const root = parse(html);
  const type = detectType(root, html);
  const qtext = root.querySelector(".qtext");

  const result: ParsedQuestion = {
    type,

    text:
      type === "description"
        ? parseDescriptionText(root)
        : parseQuestionText(root),

    html,
    qtextHtml: qtext?.innerHTML ?? undefined,
    audioUrl: parseAudioUrl(root),
  };

  switch (type) {
    case "multichoice-single":
    case "truefalse":
    case "calculatedmulti": {
      const parsed = parseRadioChoices(root);
      result.fieldName = parsed.fieldName;
      result.choices = parsed.choices;
      break;
    }

    case "multichoice-multiple":
      result.choices = parseCheckboxChoices(root);
      break;

    case "shortanswer":
    case "numerical":
    case "calculated":
    case "calculatedsimple":
      result.fieldName = parseTextInput(root);
      break;

    case "essay": {
      const textarea = root.querySelector("textarea");
      result.fieldName = textarea?.getAttribute("name") ?? undefined;

      const format = root.querySelector(
        'input[type="hidden"][name$="_answerformat"]',
      );
      result.answerFormatField = format?.getAttribute("name") ?? undefined;
      result.answerFormatValue = format?.getAttribute("value") ?? undefined;
      break;
    }

    case "gapselect":
    case "match":
    case "randomsamatch":
      result.selectFields = parseSelectFields(root);
      break;

    case "multianswer":
      result.clozeParts = parseCloze(root);
      break;

    case "ordering": {
      const parsed = parseOrdering(root);
      result.orderingItems = parsed.items;
      result.orderingFieldName = parsed.fieldName;
      break;
    }

    case "ddwtos": {
      const parsed = parseDragDropText(root);
      result.dragItems = parsed.items;
      result.dropFields = parsed.fields;
      break;
    }

    case "ddimageortext": {
      const parsed = parseDragImage(root);
      result.backgroundImage = parsed.image;
      result.dragItems = parsed.items;
      result.dropFields = parsed.fields;
      break;
    }

    case "ddmarker": {
      const parsed = parseMarkers(root);
      result.backgroundImage = parsed.image;
      result.dragItems = parsed.items;
      result.dropFields = parsed.fields;
      break;
    }
  }

  return result;
}

function parseAudioUrl(root: HTMLElement): string | undefined {
  const qtext = root.querySelector(".qtext");

  if (!qtext) return undefined;

  // Trường hợp Moodle sinh thẻ <audio>
  const audio = qtext.querySelector("audio");

  if (audio) {
    const src = audio.getAttribute("src");

    if (src) {
      return src;
    }

    const source = audio.querySelector("source");
    const sourceSrc = source?.getAttribute("src");

    if (sourceSrc) {
      return sourceSrc;
    }
  }

  // Moodle đôi khi sinh link trực tiếp tới file mp3
  const links = qtext.querySelectorAll("a");

  const audioLink = links.find((link) => {
    const href = link.getAttribute("href") ?? "";

    return /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(href);
  });

  return audioLink?.getAttribute("href") ?? undefined;
}


