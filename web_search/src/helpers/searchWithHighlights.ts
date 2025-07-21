interface SearchMatch {
  path: string[]; // Path to the matched item (e.g., ['tableId', 'variables', 'varId'])
  field: string; // Which field matched (e.g., 'name', 'description')
  value: string; // The original value that matched
  highlighted: string; // Value with highlighting tags
}

interface HighlightedSearchResults {
  matches: SearchMatch[]; // Detailed match information
}
const highlightMatch = (text: string, searchTerm: string): string => {
  if (!searchTerm || searchTerm === "") {
    return "";
  }

  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  const searchLen = searchTerm.length;

  const matchIndex = lowerText.indexOf(lowerSearch);
  if (matchIndex === -1) {
    return "";
  } // No match

  // Define raw window
  let windowStart = Math.max(0, matchIndex - 10);
  let windowEnd = Math.min(text.length, matchIndex + 50);

  // Adjust to strip partial words at boundaries
  // Move start forward to the next space (if not already at a word boundary)
  if (windowStart > 0 && /\S/.test(text[windowStart - 1])) {
    while (windowStart < text.length && /\S/.test(text[windowStart])) {
      windowStart++;
    }
  }

  // Move end backward to the previous space (if not at a word boundary)
  if (windowEnd < text.length && /\S/.test(text[windowEnd])) {
    while (windowEnd > windowStart && /\S/.test(text[windowEnd - 1])) {
      windowEnd--;
    }
  }

  if (windowStart === windowEnd) {
    windowStart = 0;
  }

  const windowText = text.slice(windowStart, windowEnd);
  const windowTextLower = lowerText.slice(windowStart, windowEnd);

  // Highlight matches within window
  let result = "";
  let i = 0;
  console.log(
    result,
    searchLen,
    windowTextLower,
    i,
    windowText,
    windowStart,
    windowEnd,
    matchIndex
  );

  while (i < windowText.length) {
    const chunk = windowTextLower.slice(i, i + searchLen);
    if (chunk === lowerSearch) {
      result += `<mark>${windowText.slice(i, i + searchLen)}</mark>`;
      i += searchLen;
    } else {
      result += windowText[i];
      i++;
    }
    console.log(result, searchLen, windowTextLower, i, windowText);
  }

  const prefix = windowStart > 0 ? "…" : "";
  const suffix = windowEnd < text.length ? "…" : "";

  return `${prefix}${result}${suffix}`;
};

export function searchWithHighlights(
  data: listTabsInfo[],
  searchTerm: string = ""
): HighlightedSearchResults {
  const lowerSearchTerm = searchTerm.toLowerCase().trim();
  const matches: SearchMatch[] = [];

  // Helper function to highlight matches in text
  if (lowerSearchTerm === "") {
    return {
      matches,
    };
  }

  const tryMatch = (value: string, path: string[], field: string) => {
    if (!value || value.length < lowerSearchTerm.length) {
      return;
    }
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes(lowerSearchTerm)) {
      matches.push({
        path,
        field,
        value,
        highlighted: highlightMatch(value, searchTerm),
      });
    }
  };

  for (const listTab of data) {
    //Process Tables
    for (const table of listTab.tables) {
      tryMatch(table.name, [table.name, "table"], "name");
      tryMatch(table.description, [table.name, "table"], "description");
      // Process variables
      for (const variable of table.variables) {
        tryMatch(
          variable.name,
          [table.name, "table", "variables", variable._id],
          "name"
        );
        tryMatch(
          variable.desc,
          [variable.name, "variables", variable._id],
          "desc"
        );
      }
    }
    for (const enumNode of listTab.mappings) {
      tryMatch(enumNode.name, [enumNode.name, "enum"], "name");
      // Process enum members
      for (const member of enumNode.members) {
        tryMatch(
          member.key,
          [enumNode.name, "enum", "members", member.key],
          "key"
        );
        tryMatch(
          member.description,
          [`${member.key} / ${enumNode.name}`, "enum", "members", member.key],
          "description"
        );
      }
    }
  }

  return {
    matches,
  };
}
