function generateFollowUpQuestion(category, missedKeywords) {
  if (missedKeywords && missedKeywords.length > 0) {
    return `Could you expand on how you would integrate ${missedKeywords.slice(0, 2).join(" and ")} into your solution?`;
  }
  return "That is a solid explanation. Can you tell me what specific trade-offs or bottlenecks you might anticipate with this design?";
}

module.exports = { generateFollowUpQuestion };
