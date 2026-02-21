// Fair Housing Act compliance utilities
// Protected classes: race, color, national origin, religion, sex, familial status, disability

export const FAIR_HOUSING_DISCLAIMER = `Equal Housing Opportunity. All real estate advertised herein is subject to the Federal Fair Housing Act, which makes it illegal to advertise "any preference, limitation, or discrimination because of race, color, religion, sex, handicap, familial status, or national origin, or intention to make any such preference, limitation, or discrimination." We will not knowingly accept any advertising for real estate which is in violation of the law.`;

export const FAIR_HOUSING_SHORT = "Equal Housing Opportunity";

// Words/phrases that may violate Fair Housing Act when used in real estate marketing
const FLAGGED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  // Familial status
  { pattern: /\b(no kids|no children|adults only|adult community|singles only|couples only|empty nesters? only)\b/i, reason: "May discriminate based on familial status" },
  // Religion
  { pattern: /\b(christian (community|neighborhood)|near (church|mosque|synagogue|temple))\b/i, reason: "May indicate religious preference" },
  // National origin / ethnicity
  { pattern: /\b(exclusive (neighborhood|community|area)|restricted)\b/i, reason: "May imply discriminatory restrictions" },
  // Disability
  { pattern: /\b(no wheelchairs?|able[- ]bodied|handicapped area|crippled)\b/i, reason: "May discriminate based on disability" },
  // Race/color
  { pattern: /\b(white (neighborhood|community|area)|integrated|segregated|colored)\b/i, reason: "May discriminate based on race" },
  // Sex/gender
  { pattern: /\b(man cave|bachelor pad|master bedroom)\b/i, reason: "Consider using gender-neutral language (e.g., 'primary bedroom')" },
  // Steering language
  { pattern: /\b(perfect for (families|singles|retirees|young professionals))\b/i, reason: "May constitute steering toward specific demographics" },
];

export interface FairHousingFlag {
  text: string;
  reason: string;
  index: number;
}

export function scanForFairHousingViolations(content: string): FairHousingFlag[] {
  const flags: FairHousingFlag[] = [];

  for (const { pattern, reason } of FLAGGED_PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    while ((match = regex.exec(content)) !== null) {
      flags.push({
        text: match[0],
        reason,
        index: match.index,
      });
    }
  }

  return flags;
}
