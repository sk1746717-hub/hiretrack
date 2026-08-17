/**
 * Ethical Blind Screening Service
 * Redacts Personally Identifiable Information (PII) to eliminate unconscious bias in recruitment.
 */

// Regex patterns for detecting PII
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/g;
const LINKEDIN_URL_REGEX = /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi;

/**
 * Anonymize raw text string by redacting email addresses, phone numbers, and social links.
 * @param {string} text - Input text
 * @returns {string} - Anonymized text with masked PII
 */
export const anonymizeText = (text) => {
  if (!text || typeof text !== "string") {
    return text || "";
  }

  try {
    let sanitized = text;
    sanitized = sanitized.replace(EMAIL_REGEX, "[ANONYMIZED_EMAIL]");
    sanitized = sanitized.replace(PHONE_REGEX, "[ANONYMIZED_PHONE]");
    sanitized = sanitized.replace(LINKEDIN_URL_REGEX, "[ANONYMIZED_LINKEDIN_URL]");
    return sanitized;
  } catch (error) {
    console.error("Anonymize text error:", error.message);
    return text || "";
  }
};

/**
 * Generates a blind screening view of a candidate profile by masking identifying details.
 * Ensures original database records remain intact.
 * @param {Object} candidate - Candidate document or plain object
 * @returns {Object} - Anonymized candidate profile
 */
export const anonymizeCandidate = (candidate) => {
  if (!candidate) {
    return null;
  }

  try {
    const rawObj = typeof candidate.toObject === "function" ? candidate.toObject() : { ...candidate };

    const candidateId = rawObj._id ? rawObj._id.toString() : "0000";
    const anonymousId = `Candidate #${candidateId.slice(-4).toUpperCase()}`;

    return {
      ...rawObj,
      isAnonymized: true,
      fullName: anonymousId,
      email: "[ANONYMIZED_EMAIL]",
      phone: "[ANONYMIZED_PHONE]",
      linkedinUrl: rawObj.linkedinUrl ? "[ANONYMIZED_LINKEDIN_URL]" : "",
      currentCompany: rawObj.currentCompany ? "[COMPANY_REDACTED]" : "",
      currentLocation: rawObj.currentLocation ? "[LOCATION_REDACTED]" : "",
      resumeFileName: rawObj.resumeFileName ? "Anonymized_Resume.pdf" : "",
      notes: anonymizeText(rawObj.notes),
      aiSummary: rawObj.aiSummary
        ? {
            ...rawObj.aiSummary,
            textSummary: anonymizeText(rawObj.aiSummary.textSummary),
          }
        : rawObj.aiSummary,
    };
  } catch (error) {
    console.error("Anonymize candidate error:", error.message);
    // Graceful degradation fallback object
    return {
      _id: candidate?._id,
      isAnonymized: true,
      fullName: "Candidate [Anonymized]",
      email: "[ANONYMIZED_EMAIL]",
      phone: "[ANONYMIZED_PHONE]",
      skills: candidate?.skills || [],
      experience: candidate?.experience || "",
      roleApplied: candidate?.roleApplied || "",
      matchAnalysis: candidate?.matchAnalysis || [],
      matchScore: candidate?.matchScore || 0,
    };
  }
};

export default {
  anonymizeText,
  anonymizeCandidate,
};
