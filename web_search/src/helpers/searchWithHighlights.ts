interface SearchMatch {
  path: string[]; // Path to the matched item (e.g., ['tableId', 'variables', 'varId'])
  field: string; // Which field matched (e.g., 'name', 'description')
  value: string; // The original value that matched
  highlighted: string; // Value with highlighting tags
}

interface HighlightedSearchResults {
  results: listTabsInfo[]; // Filtered data structure
  matches: SearchMatch[]; // Detailed match information
}

export function searchWithHighlights(
  data: listTabsInfo[],
  searchTerm: string
): HighlightedSearchResults {
  const lowerSearchTerm = searchTerm.toLowerCase();
  const matches: SearchMatch[] = [];

  // Helper function to highlight matches in text
  const highlightMatch2 = (text: string): string => {
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  };

  const highlightMatch = (text: string): string => {
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

    const windowText = text.slice(windowStart, windowEnd);
    const windowTextLower = lowerText.slice(windowStart, windowEnd);

    // Highlight matches within window
    let result = "";
    let i = 0;

    while (i < windowText.length) {
      const chunk = windowTextLower.slice(i, i + searchLen);
      if (chunk === lowerSearch) {
        result += `<mark>${windowText.slice(i, i + searchLen)}</mark>`;
        i += searchLen;
      } else {
        result += windowText[i];
        i++;
      }
    }

    const prefix = windowStart > 0 ? "…" : "";
    const suffix = windowEnd < text.length ? "…" : "";

    return `${prefix}${result}${suffix}`;
  };

  const highlightMatch_limit = (text: string): string => {
    if (!searchTerm) {
      return "";
    }

    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    const searchLen = searchTerm.length;

    const matchIndex = lowerText.indexOf(lowerSearch);
    if (matchIndex === -1) {
      return "";
    } // No match

    // Define window: 10 chars before match, 50 chars after match start
    const windowStart = Math.max(0, matchIndex - 10);
    const windowEnd = Math.min(text.length, matchIndex + 50);

    const result: string[] = [];
    let i = windowStart;

    while (i < windowEnd) {
      const currentChunk = lowerText.substring(i, i + searchLen);
      if (currentChunk === lowerSearch) {
        result.push("<mark>", text.substr(i, searchLen), "</mark>");
        i += searchLen;
      } else {
        result.push(text[i]);
        i++;
      }
    }

    return `${windowStart > 0 ? "…" : ""}${result.join("")}${
      windowEnd < text.length ? "…" : ""
    }`;
  };

  const highlightMatch_old = (text: string): string => {
    if (!searchTerm) {
      return "";
    }

    const lowerSearch = searchTerm.toLowerCase();
    const searchLen = searchTerm.length;

    // Limit scan length (max 50 characters after first match)
    const maxLengthToScan = 50;

    const result: string[] = [];
    let matchFound = false;
    let i = 0;

    const textLen = text.length;
    const scanLimit = Math.min(textLen, maxLengthToScan);

    while (i < textLen) {
      const currentChunk = text.substring(i, i + searchLen);

      if (currentChunk.toLowerCase() === lowerSearch) {
        result.push("<mark>", text.substring(i, i + searchLen), "</mark>");
        i += searchLen;
        matchFound = true;
      } else {
        result.push(text[i]);
        i++;
      }

      // After first match and 50 chars processed, exit early
      if (matchFound && i >= scanLimit) {
        result.push(text.slice(i)); // append rest of text unprocessed
        break;
      }
    }

    // If we didn’t break early, append remaining unprocessed text
    if (!matchFound || i < textLen) {
      result.push(text.slice(i));
    }

    return result.join("");
  };

  // Helper to escape regex special characters
  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  if (lowerSearchTerm === "") {
    return {
      results: [],
      matches: [],
    };
  }

  const results = data
    .map((listTab) => {
      // Process tables
      const filteredTables = listTab.tables.filter((table) => {
        let hasMatch = false;

        // Check table name
        if (table.name.toLowerCase().includes(lowerSearchTerm)) {
          matches.push({
            path: [table.name, "table"],
            field: "name",
            value: table.name,
            highlighted: highlightMatch(table.name),
          });
          hasMatch = true;
        }

        // Check table description
        if (table.description.toLowerCase().includes(lowerSearchTerm)) {
          matches.push({
            path: [table.name, "table"],
            field: "description",
            value: table.description,
            highlighted: highlightMatch(table.description),
          });
          hasMatch = true;
        }

        // Process variables
        const filteredVariables = table.variables.filter((variable) => {
          let varHasMatch = false;

          // Check variable name
          if (variable.name.toLowerCase().includes(lowerSearchTerm)) {
            matches.push({
              path: [table.name, "table", "variables", variable._id],
              field: "name",
              value: variable.name,
              highlighted: highlightMatch(variable.name),
            });
            varHasMatch = true;
          }

          // Check variable description
          if (variable.desc.toLowerCase().includes(lowerSearchTerm)) {
            matches.push({
              //path: [table._id, "variables", variable._id],
              path: [variable.name, "variables", variable._id],
              field: "desc",
              value: variable.desc,
              highlighted: highlightMatch(variable.desc),
            });
            varHasMatch = true;
          }

          return varHasMatch;
        });

        if (filteredVariables.length > 0) {
          hasMatch = true;
          table.variables = filteredVariables;
        }

        return hasMatch;
      });

      // Process mappings (EnumNodes)
      const filteredMappings = listTab.mappings.filter((enumNode) => {
        let hasMatch = false;

        // Check enum name
        if (enumNode.name.toLowerCase().includes(lowerSearchTerm)) {
          matches.push({
            path: [enumNode.name, "enum"],
            field: "name",
            value: enumNode.name,
            highlighted: highlightMatch(enumNode.name),
          });
          hasMatch = true;
        }

        // Process enum members
        const filteredMembers = enumNode.members.filter((member) => {
          let memberHasMatch = false;

          // Check member key
          if (member.key.toLowerCase().includes(lowerSearchTerm)) {
            matches.push({
              path: [enumNode.name, "enum", "members", member.key],
              field: "key",
              value: member.key,
              highlighted: highlightMatch(member.key),
            });
            memberHasMatch = true;
          }

          // Check member description
          if (member.description.toLowerCase().includes(lowerSearchTerm)) {
            matches.push({
              path: [enumNode.name, "enum", "members", member.key],
              field: "description",
              value: member.description,
              highlighted: highlightMatch(member.description),
            });
            memberHasMatch = true;
          }

          return memberHasMatch;
        });

        if (filteredMembers.length > 0) {
          hasMatch = true;
          enumNode.members = filteredMembers;
        }

        return hasMatch;
      });

      // Process links (RefNodes)
      const filteredLinks = listTab.links.filter((link) => {
        let hasMatch = false;

        // Check left reference
        if (link.left.toLowerCase().includes(lowerSearchTerm)) {
          matches.push({
            path: [link.left, "link"],
            field: "left",
            value: link.left,
            highlighted: highlightMatch(link.left),
          });
          hasMatch = true;
        }

        // Check right reference
        if (link.right.toLowerCase().includes(lowerSearchTerm)) {
          matches.push({
            path: [link.right, "link"],
            field: "right",
            value: link.right,
            highlighted: highlightMatch(link.right),
          });
          hasMatch = true;
        }

        // Check relationship
        if (link.relationship.toLowerCase().includes(lowerSearchTerm)) {
          matches.push({
            path: [link.relationship, "link"],
            field: "relationship",
            value: link.relationship,
            highlighted: highlightMatch(link.relationship),
          });
          hasMatch = true;
        }

        return hasMatch;
      });

      return {
        ...listTab,
        tables: filteredTables.length > 0 ? filteredTables : [],
        mappings: filteredMappings.length > 0 ? filteredMappings : [],
        links: filteredLinks.length > 0 ? filteredLinks : [],
      };
    })
    .filter(
      (listTab) =>
        listTab.tables.length > 0 ||
        listTab.mappings.length > 0 ||
        listTab.links.length > 0
    );

  return {
    results,
    matches,
  };
}
