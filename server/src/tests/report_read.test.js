const { test } = require('node:test');
const assert = require('node:assert/strict');
const ai = require('../config/ai');
let aiCalls = 0;
ai.generateAiContent = async () => { aiCalls++; throw new Error('AI must not run on report reads'); };
const fixtures = {
  User: { _id: 'candidate', name: 'Candidate', projectsCount: 2, masteredQuestionsCount: 6, hasGithubScanned: true },
  CareerProfile: { targetRole: 'Developer', skillsPossessed: {}, skillsTarget: {} },
  ResumeAnalysis: { atsScore: 73, missingKeywords: [{ keyword: 'SQL' }, 'Testing'] },
  CareerAiSummary: { content: 'Saved summary', status: 'CURRENT', targetRole: 'Developer', versionNumber: 1 },
};
for (const name of ['User', 'CareerProfile', 'Resume', 'ResumeAnalysis', 'DeveloperProfile', 'GithubRepository', 'ProjectAudit', 'InterviewSession', 'InterviewMistake', 'Roadmap', 'LearningProgress', 'JobApplication', 'JobOpportunity', 'AnalyticsSnapshot', 'CareerAiSummary']) {
  const model = require(`../models/${name}`);
  const query = value => ({ select() { return this; }, sort() { return this; }, limit() { return this; }, lean() { return Promise.resolve(value); } });
  model.findById = () => query(fixtures[name] || null);
  model.findOne = () => query(fixtures[name] || null);
  model.find = () => query([]);
  model.countDocuments = async () => 0;
}
const { generateCareerIntelligenceReport } = require('../services/careerIntelligence.service');
test('repeated report reads preserve saved summary, normalize gaps and never call AI', async () => {
  for (const mode of ['shareable', 'private', 'shareable']) {
    const report = await generateCareerIntelligenceReport('candidate', mode);
    assert.equal(report.aiSummary.content, 'Saved summary');
    assert.deepEqual(report.resumeIntelligence.missingKeywords, ['SQL', 'Testing']);
    assert.ok(report.skillGapLifecycle.some(gap => gap.skill === 'SQL' && gap.isResumeGap));
    assert.ok(report.nextBestActions.some(action => action.description.includes('SQL, Testing')));
    assert.ok(Number.isFinite(report.careerScore));
  }
  assert.equal(aiCalls, 0);
});
test('missing summary stays ungenerated without AI', async () => {
  fixtures.CareerAiSummary = null;
  const report = await generateCareerIntelligenceReport('candidate');
  assert.equal(report.aiSummary.status, 'NONE');
  assert.equal(report.aiSummary.content, null);
  assert.equal(aiCalls, 0);
});
