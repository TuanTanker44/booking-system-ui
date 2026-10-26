export type SearchEntryType = "service" | "store" | "address" | "order";

export interface SearchField {
  label: string;
  value: string;
  // Trường số điện thoại: cho phép khớp theo chữ số, bỏ qua dấu cách/chấm
  kind?: "phone";
}

export interface SearchEntry {
  id: string;
  type: SearchEntryType;
  title: string;
  subtitle?: string;
  fields: SearchField[];
}

export interface SearchResult {
  entry: SearchEntry;
  // Trường (ngoài tên) khớp với từ khóa, dùng để hiển thị lý do khớp
  matchedField?: SearchField;
  score: number;
}

// Bỏ dấu tiếng Việt và đưa về chữ thường, giữ nguyên độ dài chuỗi
export function fold(value: string): string {
  return value
    .normalize("NFC")
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function tokenize(query: string): string[] {
  return fold(query).split(/\s+/).filter(Boolean);
}

function fieldMatches(field: SearchField, token: string): boolean {
  if (fold(field.value).includes(token)) return true;

  if (field.kind === "phone" && /^\d+$/.test(token)) {
    return field.value.replace(/\D/g, "").includes(token);
  }

  return false;
}

export function searchEntries(
  entries: SearchEntry[],
  query: string,
): SearchResult[] {
  const tokens = tokenize(query);

  if (tokens.length === 0) return [];

  const joined = tokens.join(" ");
  const results: SearchResult[] = [];

  for (const entry of entries) {
    const fields: SearchField[] = [
      { label: "Tên", value: entry.title },
      ...entry.fields,
    ];

    // Mỗi từ khóa phải khớp ít nhất một trường
    if (!tokens.every((token) => fields.some((f) => fieldMatches(f, token)))) {
      continue;
    }

    const title = fold(entry.title);
    const score = title.startsWith(joined)
      ? 4
      : title.includes(joined)
        ? 3
        : tokens.every((token) => title.includes(token))
          ? 2
          : 1;

    const matchedField = entry.fields.find((field) =>
      tokens.some((token) => fieldMatches(field, token)),
    );

    results.push({ entry, matchedField, score });
  }

  return results.sort((a, b) => b.score - a.score);
}

// Tách chuỗi thành các đoạn để tô sáng phần khớp (không phân biệt dấu)
export function highlightSegments(
  text: string,
  query: string,
): { text: string; match: boolean }[] {
  const source = text.normalize("NFC");
  const folded = fold(source);

  if (folded.length !== source.length) {
    return [{ text: source, match: false }];
  }

  const marked = new Array<boolean>(source.length).fill(false);

  for (const token of tokenize(query)) {
    let index = folded.indexOf(token);

    while (index !== -1) {
      marked.fill(true, index, index + token.length);
      index = folded.indexOf(token, index + token.length);
    }
  }

  const segments: { text: string; match: boolean }[] = [];

  for (let i = 0; i < source.length; i++) {
    const last = segments[segments.length - 1];

    if (last && last.match === marked[i]) {
      last.text += source[i];
    } else {
      segments.push({ text: source[i], match: marked[i] });
    }
  }

  return segments;
}
