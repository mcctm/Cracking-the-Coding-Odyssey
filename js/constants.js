const LOCATION_COLOURS = {
  "Latin America and Caribbean": "#8dd3c7",
  "East Asia and Pacific": "#f3e5ab",
  "Europe and Central Asia": "#bebada",
  "Middle East and North Africa": "#fb8072",
  "North America": "#80b1d3",
  "South Asia": "#fdb462",
  "Southeast Asia": "#b3de69",
  "Sub-Saharan Africa": "#fccde5",
};

const COST_OF_LEARNING_COLOURS = {
  "$0-100": "#bbe2b6",
  "$101-500": "#76c76b",
  "$501-1000": "#4DB342",
  "$1001-10000": "#3f9537",
  "$>10000": "#3b8334",
};

const LEARNING_RESOURCES_COLOURS = {
  Helpful_Online_Resources: "#e5d8bd",
  Helpful_Podcasts: "#fed9a6",
  Helpful_YouTube_Channels: "#f3e5ab",
  Helpful_In_Person_Events: "#ccebc5",
};

const AGGREGATED_CATEGORY_LOOKUP = {
  Science: [
    "A social science (e.g., sociology, psychology, political science, economics)",
    "A natural science (e.g., biology, chemistry, physics)",
    "A health science (e.g., nursing, pharmacy, radiology)",
    "Environmental science (e.g., earth sciences, sustainability)",
  ],
  Humanities: [
    "A humanities discipline (e.g., literature, history, philosophy)",
    "Education",
  ],
  "Information Technology": [
    "Information systems, information technology, or system administration",
    "Computer science, computer engineering, software engineering or data science",
  ],
  Math: ["Mathematics or statistics"],
  Arts: [
    "Fine arts or performing arts (e.g., graphic design, music, studio, art)",
  ],
  Business: ["A business discipline (e.g., accounting, finance, marketing)"],
  Engineering: [
    "Another engineering discipline (e.g., civil, electrical, mechanical)",
  ],
  Other: ["I didn't attend a university", "Undecided or no major"],
};

const DOT_MATRIX_LEGEND_MAPPING = [
  {
    name: "gender",
    Female: "#b3cde3",
    Male: "#fbb4ae",
    Nonbinary: "#ccebc5",
    "None of the Above": "#decbe4",
  },
  {
    name: "age",
    "10-18": "#b3e2cd",
    "19-27": "#fdcdac",
    "28-36": "#cbd5e8",
    "37-45": "#f4cae4",
    "46-54": "#e6f5c9",
    "55-63": "#f3e5ab",
    "64-72": "#f1e2cc",
    "73+": "#cccccc",
  },
  {
    name: "location",
    "East Asia and Pacific": LOCATION_COLOURS["East Asia and Pacific"],
    "Europe and Central Asia": LOCATION_COLOURS["Europe and Central Asia"],
    "Latin America and Caribbean":
      LOCATION_COLOURS["Latin America and Caribbean"],
    "Middle East and North Africa":
      LOCATION_COLOURS["Middle East and North Africa"],
    "North America": LOCATION_COLOURS["North America"],
    "South Asia": LOCATION_COLOURS["South Asia"],
    "Southeast Asia": LOCATION_COLOURS["Southeast Asia"],
    "Sub-Saharan Africa": LOCATION_COLOURS["Sub-Saharan Africa"],
  },
  {
    name: "university-study",
    Arts: "#80b1d3",
    Business: "#fdb462",
    Engineering: "#b3de69",
    Humanities: "#f3e5ab",
    "Information Technology": "#bebada",
    Math: "#fb8072",
    Other: "#fccde5",
    Science: "#8dd3c7",
  },
];

const MAX_BIG_SIZE = 768;

window.LOCATION_COLOURS = LOCATION_COLOURS;
window.COST_OF_LEARNING_COLOURS = COST_OF_LEARNING_COLOURS;
window.LEARNING_RESOURCES_COLOURS = LEARNING_RESOURCES_COLOURS;
