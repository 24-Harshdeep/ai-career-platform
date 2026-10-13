# Career report loading

Report GET requests read persisted candidate data concurrently and calculate scores locally. They do not invoke generative AI or create roadmaps. Missing resume keyword objects are normalized to strings for the report contract. Learning progress is matched to the current roadmap by subSkillId.

AI summaries are read from CareerAiSummary. Only POST /api/career/report/ai-summary generates a new summary. The page invokes that endpoint from the Generate AI Summary button; snapshot views disable generation. Summary generation does not change scores.

Snapshot history loads independently of the report. A request sequence prevents older responses replacing the selected report. No database migration is required. Revert the report loading changes to roll back.

Regression check: node --test server/src/tests/report_read.test.js
