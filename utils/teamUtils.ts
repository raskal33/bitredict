/**
 * Team name processing utilities
 */

// Common suffixes to remove from team names
const TEAM_SUFFIXES = ['IF', 'FC', 'SK', 'SC', 'FK', 'FF', 'AC', 'AS', 'CF', 'CD', 'UD', 'SD', 'AD', 'CA', 'CS', 'CE', 'CR', 'CV', 'CP', 'CF', 'CG', 'CH', 'CI', 'CJ', 'CK', 'CL', 'CM', 'CN', 'CO', 'CQ', 'CS', 'CT', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ'];

/**
 * Remove common suffixes from team names
 */
export function removeTeamSuffixes(teamName: string): string {
  if (!teamName) return teamName;
  
  let cleanedName = teamName.trim();
  
  // Remove suffixes (case insensitive)
  for (const suffix of TEAM_SUFFIXES) {
    const regex = new RegExp(`\\s+${suffix}$`, 'i');
    cleanedName = cleanedName.replace(regex, '');
  }
  
  return cleanedName.trim();
}

/**
 * Truncate team names with abbreviations for mobile display
 * Example: "Metallist Kharkiv" -> "M. Kharkiv"
 */
export function truncateTeamName(teamName: string): string {
  if (!teamName) return teamName;
  
  const cleanedName = removeTeamSuffixes(teamName);
  const words = cleanedName.split(' ').filter(word => word.length > 0);
  
  if (words.length <= 1) {
    return cleanedName;
  }
  
  // If team has 2 or more words, abbreviate the first word
  const firstWord = words[0];
  const remainingWords = words.slice(1).join(' ');
  
  // Only abbreviate if first word is longer than 2 characters
  if (firstWord.length > 2) {
    return `${firstWord[0]}. ${remainingWords}`;
  }
  
  return cleanedName;
}

/**
 * Format league name with country
 */
export function formatLeagueName(leagueName: string, country?: string): string {
  if (!leagueName) return 'Unknown League';
  
  if (country && country.trim()) {
    return `${country.trim()} ${leagueName}`;
  }
  
  return leagueName;
}

/**
 * Get team display name for mobile (truncated version)
 */
export function getTeamDisplayName(teamName: string, isMobile: boolean = true): string {
  if (!teamName) return 'Unknown Team';
  
  if (isMobile) {
    return truncateTeamName(teamName);
  }
  
  return removeTeamSuffixes(teamName);
}

/**
 * Get team initials for fallback logo
 */
export function getTeamInitials(teamName: string): string {
  if (!teamName) return 'T';
  
  const cleanedName = removeTeamSuffixes(teamName);
  return cleanedName
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
