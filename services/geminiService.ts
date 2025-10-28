import type { RevealedAnswer } from '../types';

export interface MatchResult {
  match: boolean;
  text?: string;
}

/**
 * Checks if a user's guess is a match for any of the provided answers.
 * It checks against the main answer text and any "accepted" alternative spellings or synonyms.
 * @param guess The user's guessed answer.
 * @param answers An array of possible correct answers (RevealedAnswer objects).
 * @returns A MatchResult object indicating if a match was found and what the canonical answer text is.
 */
export function checkAnswer(guess: string, answers: RevealedAnswer[]): MatchResult {
  const guessLower = guess.trim().toLowerCase();

  if (!guessLower) {
    return { match: false };
  }

  for (const answer of answers) {
    // Check against the main answer text
    if (answer.text.toLowerCase() === guessLower) {
      return { match: true, text: answer.text };
    }

    // Check against acceptable alternative answers
    if (answer.accepted) {
      for (const acceptedWord of answer.accepted) {
        if (acceptedWord.toLowerCase() === guessLower) {
          // It's a match, but we return the main answer text for display
          return { match: true, text: answer.text };
        }
      }
    }
  }

  return { match: false };
}