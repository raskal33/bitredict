/**
 * Team name formatter and validator for bytes32 encoding
 * Ensures team names fit within 31 characters (32 bytes with null terminator)
 */

/**
 * Format team name to fit within bytes32 constraints
 * - Maximum 31 characters (32 bytes with null terminator)
 * - Convert to ASCII/latin characters only
 * - Apply smart shortening for long names
 */
export function formatTeamNameForBytes32(teamName: string): string {
  if (!teamName || teamName.trim().length === 0) {
    return '';
  }

  let formatted = teamName.trim();

  // Step 1: Convert special characters to ASCII equivalents
  formatted = convertToAscii(formatted);

  // Step 2: Remove extra spaces and normalize
  formatted = formatted.replace(/\s+/g, ' ').trim();

  // Step 3: Apply smart shortening if too long
  if (formatted.length > 31) {
    formatted = smartShortenTeamName(formatted);
  }

  // Step 4: Final validation - ensure it fits (be more aggressive)
  if (formatted.length > 31) {
    console.warn(`⚠️ Team name still too long after shortening: "${formatted}" (${formatted.length} chars)`);
    // Try ultra-shortening as last resort
    formatted = ultraShortenTeamName(formatted);
    
    // Final fallback - hard truncate
    if (formatted.length > 31) {
      formatted = formatted.substring(0, 31);
    }
  }
  
  // Step 5: Additional safety check - ensure no special characters remain
  formatted = formatted.replace(/[^\x00-\x7F]/g, ''); // Remove any non-ASCII characters

  return formatted;
}

/**
 * Convert special characters to ASCII equivalents
 */
function convertToAscii(text: string): string {
  const replacements: Record<string, string> = {
    // German umlauts
    'ä': 'ae', 'Ä': 'AE',
    'ö': 'oe', 'Ö': 'OE', 
    'ü': 'ue', 'Ü': 'UE',
    'ß': 'ss',
    
    // French accents
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'å': 'a',
    'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Å': 'A',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ø': 'o',
    'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ø': 'O',
    'ù': 'u', 'ú': 'u', 'û': 'u',
    'Ù': 'U', 'Ú': 'U', 'Û': 'U',
    'ñ': 'n', 'Ñ': 'N',
    'ç': 'c', 'Ç': 'C',
    
    // Other special characters
    'æ': 'ae', 'Æ': 'AE',
    'œ': 'oe', 'Œ': 'OE',
    'ð': 'd', 'Ð': 'D',
    'þ': 'th', 'Þ': 'TH',
    
    // Remove or replace other special characters
    '&': 'and',
    '@': 'at',
    '#': '',
    '$': '',
    '%': '',
    '+': 'plus',
    '=': '',
    '?': '',
    '!': '',
    '.': '',
    ',': '',
    ';': '',
    ':': '',
    '"': '',
    "'": '',
    '`': '',
    '~': '',
    '^': '',
    '*': '',
    '(': '',
    ')': '',
    '[': '',
    ']': '',
    '{': '',
    '}': '',
    '|': '',
    '\\': '',
    '/': '',
    '<': '',
    '>': '',
  };

  let result = text;
  
  // Apply character replacements
  for (const [char, replacement] of Object.entries(replacements)) {
    // Escape special regex characters
    const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escapedChar, 'g'), replacement);
  }
  
  // Remove any remaining non-ASCII characters
  result = result.replace(/[^\x00-\x7F]/g, '');
  
  // Remove any remaining special characters except spaces, letters, and numbers
  result = result.replace(/[^a-zA-Z0-9\s]/g, '');
  
  return result;
}

/**
 * Smart shortening algorithm for team names
 */
function smartShortenTeamName(teamName: string): string {
  const words = teamName.split(' ');
  
  if (words.length === 1) {
    // Single word - truncate intelligently
    return truncateSingleWord(words[0]);
  }
  
  // Multiple words - use abbreviation strategy
  return abbreviateMultiWord(words);
}

/**
 * Ultra-aggressive shortening for very long names
 */
function ultraShortenTeamName(teamName: string): string {
  const words = teamName.split(' ');
  
  if (words.length === 1) {
    // Single word - keep first 8 chars
    return words[0].substring(0, 8);
  }
  
  // Multiple words - use first letters only
  const firstLetters = words.map(word => word[0]).join('');
  return firstLetters.substring(0, 8);
}

/**
 * Truncate a single word intelligently
 */
function truncateSingleWord(word: string): string {
  if (word.length <= 31) return word;
  
  // Try to keep meaningful parts
  const vowels = 'aeiouAEIOU';
  let result = word;
  
  // Remove vowels from the middle, keep first and last few characters
  if (word.length > 20) {
    const firstPart = word.substring(0, 8);
    const lastPart = word.substring(word.length - 8);
    const middle = word.substring(8, word.length - 8);
    
    // Remove vowels from middle
    const middleShort = middle.replace(/[aeiouAEIOU]/g, '');
    result = firstPart + middleShort + lastPart;
  }
  
  // Final truncation if still too long
  if (result.length > 31) {
    result = result.substring(0, 31);
  }
  
  return result;
}

/**
 * Abbreviate multi-word team names
 */
function abbreviateMultiWord(words: string[]): string {
  if (words.length === 2) {
    // Two words: "Real Madrid" -> "R. Madrid" or "Real M."
    const [first, second] = words;
    
    if (first.length + second.length + 1 <= 31) {
      return `${first} ${second}`;
    }
    
    // Try first letter + second word
    if (1 + second.length + 1 <= 31) {
      return `${first[0]}. ${second}`;
    }
    
    // Try first word + first letter of second
    if (first.length + 3 <= 31) {
      return `${first} ${second[0]}.`;
    }
    
    // Truncate both
    const maxFirst = Math.min(first.length, 15);
    const maxSecond = Math.min(second.length, 31 - maxFirst - 1);
    return `${first.substring(0, maxFirst)} ${second.substring(0, maxSecond)}`;
  }
  
  // Three or more words: "Borussia Mönchen Gladbach" -> "B.M Gladbach"
  if (words.length >= 3) {
    const firstWord = words[0];
    const lastWord = words[words.length - 1];
    const middleWords = words.slice(1, -1);
    
    // Create abbreviation: "B.M Gladbach"
    let abbreviation = `${firstWord[0]}.`;
    for (const word of middleWords) {
      abbreviation += `${word[0]}.`;
    }
    
    const result = `${abbreviation} ${lastWord}`;
    
    if (result.length <= 31) {
      return result;
    }
    
    // If still too long, truncate last word
    const maxLast = 31 - abbreviation.length - 1;
    return `${abbreviation} ${lastWord.substring(0, maxLast)}`;
  }
  
  // Fallback: join with spaces and truncate
  return words.join(' ').substring(0, 31);
}

/**
 * Validate team name for bytes32 encoding
 */
export function validateTeamNameForBytes32(teamName: string): {
  isValid: boolean;
  formatted: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  if (!teamName || teamName.trim().length === 0) {
    return {
      isValid: false,
      formatted: '',
      warnings: ['Team name cannot be empty']
    };
  }
  
  const original = teamName.trim();
  const formatted = formatTeamNameForBytes32(original);
  
  // Check for length
  if (formatted.length > 31) {
    warnings.push(`Team name too long (${formatted.length} chars), truncated to 31`);
  }
  
  // Check for special characters
  const hasSpecialChars = /[^\x00-\x7F]/.test(original);
  if (hasSpecialChars) {
    warnings.push('Special characters converted to ASCII equivalents');
  }
  
  // Check if name was significantly shortened
  if (original.length > formatted.length + 5) {
    warnings.push(`Team name shortened from "${original}" to "${formatted}"`);
  }
  
  return {
    isValid: true,
    formatted,
    warnings
  };
}

/**
 * Format both team names consistently
 */
export function formatTeamNamesForPool(homeTeam: string, awayTeam: string): {
  homeTeam: string;
  awayTeam: string;
  warnings: string[];
} {
  const homeResult = validateTeamNameForBytes32(homeTeam);
  const awayResult = validateTeamNameForBytes32(awayTeam);
  
  const allWarnings = [
    ...homeResult.warnings.map(w => `Home team: ${w}`),
    ...awayResult.warnings.map(w => `Away team: ${w}`)
  ];
  
  return {
    homeTeam: homeResult.formatted,
    awayTeam: awayResult.formatted,
    warnings: allWarnings
  };
}

/**
 * Test function to demonstrate formatting
 */
export function testTeamNameFormatting() {
  const testNames = [
    'Borussia Mönchengladbach',
    'Real Madrid',
    'Manchester United',
    'Bayern München',
    'Paris Saint-Germain',
    'Atlético Madrid',
    'Borussia Dortmund',
    'Olympique de Marseille',
    'Club Atlético de Madrid',
    'FC Barcelona',
    'Very Long Team Name That Definitely Exceeds The Limit And Should Be Shortened',
    'A', // Single character
    '', // Empty
    '   ', // Whitespace only
  ];
  
  console.log('🧪 Testing team name formatting:');
  console.log('');
  
  testNames.forEach(name => {
    const result = validateTeamNameForBytes32(name);
    console.log(`Original: "${name}"`);
    console.log(`Formatted: "${result.formatted}"`);
    console.log(`Length: ${result.formatted.length}/31`);
    console.log(`Warnings: ${result.warnings.join(', ') || 'None'}`);
    console.log('---');
  });
}
