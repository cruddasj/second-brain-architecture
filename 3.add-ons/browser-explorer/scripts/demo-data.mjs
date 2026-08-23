const collections = [
  ["about me", "About Me"],
  ["projects", "Projects"],
  ["people and relationships", "People & Relationships"],
  ["interests and learning", "Interests & Learning"],
  ["life admin", "Life Admin"],
  ["health and wellbeing", "Health & Wellbeing"],
  ["source notes", "Source Notes"],
  ["themes", "Themes"],
];

const themes = [
  ["theme:learning", "Learning"],
  ["theme:finances", "Finances"],
  ["theme:home", "Home"],
  ["theme:wellbeing", "Wellbeing"],
  ["theme:technology", "Technology"],
  ["theme:travel", "Travel"],
  ["theme:community", "Community"],
];

const recordBlueprints = [
  ["about me", ["Working preferences", "Reading habits", "Travel preferences", "Learning goals", "Weekly routine", "Creative interests", "Home priorities", "Personal principles", "Decision-making style", "Favourite activities", "Long-term goals", "Communication style"]],
  ["projects", ["Project Atlas", "Project Beacon", "Project Cedar", "Project Delta", "Project Ember", "Project Fern", "Project Grove", "Project Harbour", "Project Iris", "Project Juniper", "Project Kite", "Project Lantern", "Project Meadow", "Project Northstar"]],
  ["people and relationships", ["Book club", "Community garden group", "Cycling group", "Friends catch-up", "Family plans", "Neighbourhood contacts", "Professional network", "Study group", "Volunteer team", "Walking group", "Mentoring notes", "Shared holiday ideas"]],
  ["interests and learning", ["Systems thinking notes", "History reading list", "Photography ideas", "Cooking techniques", "Language practice", "Data visualisation", "Gardening notes", "Architecture reading", "Music discoveries", "Design principles", "Writing ideas", "Astronomy notes", "Local history", "Open-source learning"]],
  ["life admin", ["Annual subscriptions", "Home maintenance", "Insurance renewals", "Travel checklist", "Document renewals", "Household inventory", "Budget reminders", "Gift ideas", "Seasonal jobs", "Digital housekeeping", "Useful services", "Recurring purchases"]],
  ["health and wellbeing", ["Walking routine", "Strength routine", "Sleep habits", "Meal planning", "Outdoor activities", "Rest days", "Stretching routine", "Wellbeing goals", "Healthy recipes", "Weekend activities", "Fitness milestones"]],
  ["source notes", ["Article notes: durable memory", "Book notes: knowledge systems", "Podcast notes: learning", "Research notes: personal knowledge", "Article notes: digital gardens", "Book notes: systems design", "Conference notes: open tooling", "Research notes: graph interfaces", "Article notes: privacy by design", "Book notes: information architecture"]],
];

function slug(value) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeNode(id, title, kind, collection, themeIds = [], index = 0) {
  return {
    id,
    title,
    kind,
    collection,
    path: "",
    excerpt: `Synthetic demo record showing how ${title.toLowerCase()} can connect to themes and nearby knowledge.`,
    details: index % 3 === 0 ? { lastConfirmedDate: "2026-08-01", source: "Synthetic demo data" } : {},
    headings: ["Current state", "Notes", ...(index % 4 === 0 ? ["Related knowledge"] : [])],
    stateCount: index % 3 === 0 ? 2 : 1,
    eventCount: index % 5 === 0 ? 2 : index % 2,
    themeIds,
  };
}

export function createDemoData(markdown = { files: [] }) {
  const nodes = collections.map(([collection, title]) => makeNode(`collection:${collection}`, title, "collection", collection));
  const edges = [];

  for (const [id, title] of themes) {
    nodes.push(makeNode(id, title, "theme", "themes", [], nodes.length));
    edges.push({ source: "collection:themes", target: id, kind: "collection" });
  }

  let recordIndex = 0;
  for (const [collection, titles] of recordBlueprints) {
    for (const title of titles) {
      const id = `demo:${slug(collection)}:${slug(title)}`;
      const primaryTheme = themes[recordIndex % themes.length][0];
      const secondaryTheme = recordIndex % 4 === 0 ? themes[(recordIndex + 3) % themes.length][0] : null;
      const themeIds = secondaryTheme ? [primaryTheme, secondaryTheme] : [primaryTheme];
      nodes.push(makeNode(id, title, "record", collection, themeIds, recordIndex));
      edges.push({ source: `collection:${collection}`, target: id, kind: "collection" });
      for (const themeId of themeIds) {
        edges.push({ source: id, target: themeId, kind: "reference" });
        edges.push({ source: themeId, target: id, kind: "reference" });
      }
      if (recordIndex > 0 && recordIndex % 3 === 0) {
        const previous = nodes[nodes.length - 2];
        if (previous && previous.kind === "record") edges.push({ source: previous.id, target: id, kind: "reference" });
      }
      recordIndex += 1;
    }
  }

  if (nodes.length !== 100) throw new Error(`Demo graph must contain exactly 100 nodes; found ${nodes.length}.`);

  return {
    schemaVersion: 5,
    source: "synthetic graph demo data with the repository Markdown index available read-only",
    graph: {
      nodes,
      edges,
      themes: themes.map(([id, title]) => ({ id, title })),
    },
    markdown,
  };
}
