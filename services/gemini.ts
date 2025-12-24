
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { CollegeEvent, Club, Achievement, Project, User } from "../types";

// Always initialize with the direct process.env.API_KEY reference.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Initializes a stateful chat session with the Nexus AI persona.
   */
  createChatSession(): Chat {
    return ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: `You are 'Nexus AI', the sophisticated virtual advisor for MVGR College (Maharaj Vijayaram Gajapathi Raj College of Engineering). 
        Your goal is to assist students, faculty, and administrators within the MVGR Nexus community platform.
        
        Guidelines:
        1. Be professional, encouraging, and technically insightful.
        2. Help students with academic queries, career advice, and project ideation.
        3. If asked about the college, highlight its strengths in engineering, innovation, and community spirit.
        4. Use Markdown formatting (bold, lists, code blocks) to make your answers easy to read.
        5. Encourage collaboration and participation in college clubs and events.
        6. If you don't know a specific college-specific fact (like a specific room number), advise the user to check with the physical college administration.
        
        Persona: You are part of the 'Nexus Grid' - a high-tech, futuristic community hub. Use a 'tactical' but friendly tone.`,
      },
    });
  },

  /**
   * Summarizes an event description to provide a concise TL;DR.
   */
  async summarizeEvent(event: Partial<CollegeEvent>): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize this college event into a 2-sentence catchy highlight: 
        Title: ${event.title}
        Description: ${event.description}`,
      });
      return response.text?.trim() || "No summary available.";
    } catch (error) {
      console.error("Gemini Summarization Error:", error);
      return "Unable to generate summary at this time.";
    }
  },

  /**
   * Moderates comments for offensive language or toxicity.
   */
  async moderateComment(text: string): Promise<{ isFlagged: boolean; reason?: string }> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a community moderator. Analyze the following comment for hate speech, toxicity, or harassment. 
        Return JSON format.
        Comment: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isFlagged: { type: Type.BOOLEAN },
              reason: { type: Type.STRING }
            },
            required: ["isFlagged"]
          }
        }
      });
      const jsonStr = response.text?.trim() || '{"isFlagged": false}';
      const result = JSON.parse(jsonStr);
      return result;
    } catch (error) {
      console.error("Gemini Moderation Error:", error);
      return { isFlagged: false };
    }
  },

  /**
   * Recommends clubs based on student's interests, memberships, and past achievements/events.
   */
  async getRecommendations(
    studentInterests: string[], 
    joinedClubIds: string[], 
    achievements: Achievement[], 
    allClubs: Club[]
  ): Promise<string[]> {
    try {
      const clubContext = allClubs.map(c => `${c.id}: ${c.name} - ${c.description} (Category: ${c.category})`).join('\n');
      const interactionHistory = achievements
        .filter(a => a.type === 'event' || a.type === 'project' || a.type === 'badge')
        .map(a => `[${a.type.toUpperCase()}] ${a.title}: ${a.description}`)
        .join('; ');

      const prompt = `Act as a highly sophisticated Student Growth Advisor at MVGR College.
        Analyze the following student profile and history to recommend 3 clubs from our registry.
        
        Student Interests: ${studentInterests.join(', ')}
        Current Memberships (Club IDs): ${joinedClubIds.join(', ') || 'None'}
        Interaction History (Achievements/Events): ${interactionHistory || "No specific interaction history yet"}.
        
        GOAL: Recommend exactly 3 clubs that either deepen expertise, provide balance, or align with gaps.
        Do NOT recommend clubs they are already in.
        
        Registry of Clubs:
        ${clubContext}
        
        Return ONLY a JSON array containing 3 strings representing the recommended club IDs.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      const jsonStr = response.text?.trim() || '[]';
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Gemini Recommendation Error:", error);
      return [];
    }
  },

  /**
   * Suggests top collaborators for a project based on semantic skill alignment.
   */
  async getCollaboratorSuggestions(
    project: Project,
    candidates: User[]
  ): Promise<{ uid: string; score: number; insight: string; matchedSkills: string[] }[]> {
    try {
      const candidateData = candidates.map(u => ({
        uid: u.uid,
        name: u.displayName,
        skills: [...(u.skills || []), ...(u.interests || [])],
        achievements: u.achievements.map(a => a.title).slice(0, 3)
      }));

      const prompt = `Act as a Technical Mission Recruiter. Analyze these potential operatives for the project: "${project.title}" (${project.description}).
        Project Requirements: ${project.requiredSkills.join(', ')}.
        
        Evaluate these candidates and select the top 3 matches based on who can contribute most effectively. 
        For each, provide a compatibility score (1-100), a 1-sentence "Strategic Insight" on why they fit, and a list of specific skills they have that match the project's requirements.
        
        Candidates: ${JSON.stringify(candidateData)}
        
        Return ONLY a JSON array of objects with keys: uid, score, insight, matchedSkills.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                uid: { type: Type.STRING },
                score: { type: Type.NUMBER },
                insight: { type: Type.STRING },
                matchedSkills: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["uid", "score", "insight", "matchedSkills"]
            }
          }
        }
      });

      const jsonStr = response.text?.trim() || '[]';
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Gemini Collaboration Insight Error:", error);
      return [];
    }
  }
};
