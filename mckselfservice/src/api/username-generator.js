/**
 * Generate a random username
 * Format: guest-[random adjective]-[random noun]-[random number]
 * @returns {string} A randomly generated username
 */
export function generateUsername() {
  const adjectives = [
    'happy', 'sunny', 'clever', 'brave', 'mighty', 'kind', 'swift', 'calm', 'bright', 'wise',
    'friendly', 'noble', 'gentle', 'bold', 'eager', 'fair', 'proud', 'merry', 'keen', 'lively'
  ];
  
  const nouns = [
    'tiger', 'eagle', 'lion', 'wolf', 'bear', 'dolphin', 'penguin', 'falcon', 'hawk', 'turtle',
    'dragon', 'phoenix', 'unicorn', 'panther', 'fox', 'rabbit', 'owl', 'elephant', 'panda', 'deer'
  ];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  
  return `guest-${randomAdjective}-${randomNoun}-${randomNumber}`;
} 