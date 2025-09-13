
import { GoogleGenAI, Type } from "@google/genai";
import type { WordExplanation } from '../types';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("API_KEY environment variable not set. Please set it in your environment.");
}

export const getWordExplanation = async (word: string): Promise<WordExplanation[]> => {
    if (!ai) {
        throw new Error("Gemini AI client not initialized. Check API_KEY.");
    }

    const systemInstruction = `あなたは、日本語を学ぶ人のためのシンプルな辞書AIです。あなたの仕事は、与えられた単語の意味を説明することです。複数の意味がある場合は、それぞれを個別の項目として提供してください。説明は、N5レベルの非常に簡単な日本語のみを使用し、小学生でも理解できるようにしてください。挨拶や追加のコメントは一切含めず、要求されたJSON形式でのみ回答してください。読み方や説明文など、すべてのテキストにおいて括弧（）やその他の記号は絶対に使用しないでください。

You are a simple dictionary AI for Japanese language learners. Your task is to explain the meaning of a given word. If there are multiple meanings, provide each as a separate entry. Use only very simple, N5-level Japanese that an elementary school student can understand. Do not include any greetings or extra comments; respond only in the requested JSON format. The reading for the word must be in hiragana only. For all text output, including readings and explanations, absolutely do not use parentheses () or any other symbols.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `「${word}」という言葉の意味を教えてください。 (Please tell me the meaning of the word "${word}".)`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            word: {
                                type: Type.STRING,
                                description: "The Japanese word being explained.",
                            },
                            reading: {
                                type: Type.STRING,
                                description: "The hiragana reading of the word, without any parentheses or symbols.",
                            },
                            briefMeaning: {
                                type: Type.STRING,
                                description: "A very short, one-sentence meaning in simple Japanese.",
                            },
                            detailedExplanation: {
                                type: Type.STRING,
                                description: "A detailed 3-4 sentence explanation using extremely simple, N5-level Japanese.",
                            },
                        },
                        required: ["word", "reading", "briefMeaning", "detailedExplanation"]
                    }
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error fetching explanation from Gemini:", error);
        return [{
            word: word,
            reading: 'エラー',
            briefMeaning: '情報の取得中にエラーが発生しました。',
            detailedExplanation: '申し訳ありませんが、もう一度お試しください。ネットワーク接続を確認してください。'
        }];
    }
};

export const getFollowUpAnswer = async (
  word: string,
  history: { role: 'user' | 'model'; content: string }[]
): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini AI client not initialized. Check API_KEY.");
  }

  const systemInstruction = `あなたは、親切で忍耐強い日本語の家庭教師です。ユーザーは先ほど「${word}」という単語を調べました。今から、その単語に関するユーザーの追加の質問に答えてください。説明は、引き続きN5レベルの非常に簡単な日本語のみを使用してください。フレンドリーな口調で、ユーザーの学習を助けてあげてください。挨拶や追加のコメントは不要です。括弧（）やその他の記号は絶対に使用せず、ユーザーの質問に直接答えてください。

You are a kind and patient Japanese language tutor. The user has just looked up the word "${word}". Your task is now to answer the user's follow-up questions about this word. Continue to use only very simple, N5-level Japanese in your explanations. Be friendly and help the user learn. Do not include greetings or extra comments. Absolutely do not use parentheses () or other symbols; answer the user's question directly.`;

  const contents = history.map(item => ({
    role: item.role,
    parts: [{ text: item.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching follow-up from Gemini:", error);
    return '申し訳ありませんが、エラーが発生しました。もう一度お試しください。';
  }
};