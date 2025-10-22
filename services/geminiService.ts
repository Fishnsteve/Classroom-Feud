import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// FIX: Initialize the Google AI client. Ensure the API_KEY environment variable is set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
// FIX: Select a model for content generation.
const model = "gemini-2.5-flash";

export interface MatchResult {
  match: boolean;
  text?: string;
}

/**
 * Checks if a user's guess is a semantic match for any of the provided answers using the Gemini API.
 * @param guess The user's guessed answer.
 * @param answers An array of possible correct answers.
 * @returns A promise that resolves to a MatchResult object.
 */
export async function checkAnswer(guess: string, answers: string[]): Promise<MatchResult> {
  // FIX: Added a descriptive prompt to instruct the Gemini model on how to judge the answer.
  const prompt = `
    You are the judge for a game show. A contestant has given an answer.
    Your task is to determine if their answer is a valid match for any of the answers on the board.
    Be lenient with spelling and phrasing, but strict on the meaning.
    
    The contestant's guess is: "${guess}"

    Here are the possible correct answers on the board:
    ${answers.map(a => `- ${a}`).join('\n')}

    Does the guess match any of the answers on the board?
    For example:
    If the guess is "Big Apple" and an answer is "New York City", you should match it.
    If the guess is "cat" and an answer is "feline", you should match it.
    If the guess is "USA" and an answer is "United States", you should match it.
    If the guess is "water" and an answer is "H2O", you should match it.
    If there is no good match, indicate no match.
  `;

  try {
    // FIX: Replaced simple string comparison with a call to the Gemini API for intelligent, semantic answer checking.
    // This provides a much better user experience by allowing for variations in user input.
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: prompt,
      // FIX: Added responseMimeType and a responseSchema to ensure the model returns a predictable JSON object.
      // This makes parsing the response reliable and robust.
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            match: {
              type: Type.BOOLEAN,
              description: "Whether the guess matches any of the board answers.",
            },
            text: {
              type: Type.STRING,
              description: "If it's a match, this is the exact string of the matched answer from the board. Omit if no match."
            }
          },
          required: ["match"],
        },
      },
    });

    // FIX: Added logic to parse the JSON response from the model.
    const resultText = response.text.trim();
    const result = JSON.parse(resultText);
    if (typeof result.match === 'boolean') {
      return result as MatchResult;
    }
    return { match: false };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // FIX: Implemented a fallback mechanism. If the API call fails, it performs a simple, case-insensitive string comparison.
    // This ensures the game remains playable even if there's an issue with the API.
    const guessLower = guess.trim().toLowerCase();
    const simpleMatch = answers.find(ans => ans.toLowerCase() === guessLower);
    if (simpleMatch) {
      return { match: true, text: simpleMatch };
    }
    return { match: false };
  }
}
