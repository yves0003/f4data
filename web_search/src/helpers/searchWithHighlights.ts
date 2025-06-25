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
  const highlightMatch = (text: string): string => {
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  };

  // Helper to escape regex special characters
  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const results = data
    .map((listTab) => {
      // Process tables
      const filteredTables = listTab.tables.filter((table) => {
        let hasMatch = false;

        // Check table name
        if (table.name.toLowerCase().includes(lowerSearchTerm)) {
          matches.push({
            //path: [table._id, "table"],
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
            //path: [table._id, "table"],
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
