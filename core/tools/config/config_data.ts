



export const COUNTRIES = [
  "Bangladesh",
  "India",
  "Pakistan",
  "Nepal",
  "Sri Lanka",
  "Indonesia",
  "Malaysia",
  "Singapore",
  "Japan",
  "South Korea",
  "China",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Turkey",
  "United Kingdom",
  "Ireland",
  "France",
  "Germany",
  "Netherlands",
  "Belgium",
  "Spain",
  "Italy",
  "Portugal",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Poland",
  "Ukraine",
  "Canada",
  "United States",
  "Mexico",
  "Brazil",
  "Argentina",
  "Australia",
  "New Zealand",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Egypt",
  "Morocco",
] as const;

export const LANGUAGES = [
  "Bangla",
  "English",
  "Hindi",
  "Urdu",
  "Nepali",
  "Sinhala",
  "Arabic",
  "Indonesian",
  "Malay",
  "Japanese",
  "Korean",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Turkish",
  "French",
  "German",
  "Dutch",
  "Spanish",
  "Portuguese",
  "Italian",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Polish",
  "Ukrainian",
  "Russian",
  "Swahili",
] as const;



const COUNTRY_TIMEZONES: Readonly<Record<string, readonly string[] | undefined>> = {
  Bangladesh: ["Asia/Dhaka"],
  India: ["Asia/Kolkata"],
  Pakistan: ["Asia/Karachi"],
  Nepal: ["Asia/Kathmandu"],
  "Sri Lanka": ["Asia/Colombo"],
  Indonesia: ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"],
  Malaysia: ["Asia/Kuala_Lumpur"],
  Singapore: ["Asia/Singapore"],
  Japan: ["Asia/Tokyo"],
  "South Korea": ["Asia/Seoul"],
  China: ["Asia/Shanghai", "Asia/Urumqi"],
  "United Arab Emirates": ["Asia/Dubai"],
  "Saudi Arabia": ["Asia/Riyadh"],
  Qatar: ["Asia/Qatar"],
  Turkey: ["Europe/Istanbul"],
  "United Kingdom": ["Europe/London"],
  Ireland: ["Europe/Dublin"],
  France: ["Europe/Paris"],
  Germany: ["Europe/Berlin"],
  Netherlands: ["Europe/Amsterdam"],
  Belgium: ["Europe/Brussels"],
  Spain: ["Europe/Madrid", "Atlantic/Canary"],
  Italy: ["Europe/Rome"],
  Portugal: ["Europe/Lisbon", "Atlantic/Azores"],
  Sweden: ["Europe/Stockholm"],
  Norway: ["Europe/Oslo"],
  Denmark: ["Europe/Copenhagen"],
  Finland: ["Europe/Helsinki"],
  Poland: ["Europe/Warsaw"],
  Ukraine: ["Europe/Kyiv"],
  Canada: [
    "America/St_Johns",
    "America/Halifax",
    "America/Toronto",
    "America/Winnipeg",
    "America/Edmonton",
    "America/Vancouver",
  ],
  "United States": [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Phoenix",
    "America/Los_Angeles",
    "America/Anchorage",
    "Pacific/Honolulu",
  ],
  Mexico: ["America/Mexico_City", "America/Tijuana"],
  Brazil: ["America/Sao_Paulo", "America/Manaus", "America/Rio_Branco"],
  Argentina: ["America/Argentina/Buenos_Aires"],
  Australia: [
    "Australia/Sydney",
    "Australia/Melbourne",
    "Australia/Brisbane",
    "Australia/Perth",
    "Australia/Darwin",
  ],
  "New Zealand": ["Pacific/Auckland"],
  "South Africa": ["Africa/Johannesburg"],
  Nigeria: ["Africa/Lagos"],
  Kenya: ["Africa/Nairobi"],
  Egypt: ["Africa/Cairo"],
  Morocco: ["Africa/Casablanca"],
};

const COUNTRY_LANGUAGES: Readonly<Record<string, string | undefined>> = {
  Bangladesh: "Bangla",
  India: "Hindi",
  Pakistan: "Urdu",
  Nepal: "Nepali",
  "Sri Lanka": "Sinhala",
  Indonesia: "Indonesian",
  Malaysia: "Malay",
  Singapore: "English",
  Japan: "Japanese",
  "South Korea": "Korean",
  China: "Chinese (Simplified)",
  "United Arab Emirates": "Arabic",
  "Saudi Arabia": "Arabic",
  Qatar: "Arabic",
  Turkey: "Turkish",
  "United Kingdom": "English",
  Ireland: "English",
  France: "French",
  Germany: "German",
  Netherlands: "Dutch",
  Belgium: "Dutch",
  Spain: "Spanish",
  Italy: "Italian",
  Portugal: "Portuguese",
  Sweden: "Swedish",
  Norway: "Norwegian",
  Denmark: "Danish",
  Finland: "Finnish",
  Poland: "Polish",
  Ukraine: "Ukrainian",
  Canada: "English",
  "United States": "English",
  Mexico: "Spanish",
  Brazil: "Portuguese",
  Argentina: "Spanish",
  Australia: "English",
  "New Zealand": "English",
  "South Africa": "English",
  Nigeria: "English",
  Kenya: "Swahili",
  Egypt: "Arabic",
  Morocco: "Arabic",
};


export const ALL_TIMEZONES: readonly string[] = [
  "UTC",
  ...new Set(Object.values(COUNTRY_TIMEZONES).flatMap((zones) => zones ?? [])),
];


export function timezonesFor(country: string): readonly string[] {
  const zones = COUNTRY_TIMEZONES[country];
  return zones !== undefined && zones.length > 0 ? zones : ALL_TIMEZONES;
}


export function languageFor(country: string): string {
  const language = COUNTRY_LANGUAGES[country];
  return typeof language === "string" ? language : "";
}




export function systemTimezone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof zone === "string" && zone.length > 0 ? zone : "UTC";
  } catch {
    return "UTC";
  }
}


export function countryForZone(zone: string): string {
  for (const [country, zones] of Object.entries(COUNTRY_TIMEZONES)) {
    if (zones?.includes(zone)) return country;
  }
  return "";
}
