import { RULE } from './rules.js';

/**
 * A real assignment, scoped part by part.
 *
 * This is modeled on the LIS 875 final project at UW–Madison: a team project
 * worth 40% of the course grade, submitted via GitHub, that asks for a thesis
 * supported by working code. LIS 875 is a first programming course for
 * information-science students who won't become professional programmers — so
 * the point of every part is that the student does the thinking, and AI is
 * scoped tighter or looser depending on which skill that part is protecting.
 *
 * The rules below follow the shape of Prof. Rick Wash's real course policy:
 * AI is prohibited on the reflective/understanding work, held to reasoning-only
 * where the skill is the point, and opened up where using AI as a tool is
 * itself the thing being learned (the course introduces AI in Week 9).
 *
 * Modeled on a course the author took, used with the instructor's permission.
 * See docs/POLICY_BASIS.md.
 */

export const ASSIGNMENT = {
  course: 'LIS 875 · Technical Foundations of Information Science',
  title: 'Final Project — A Thesis, Supported by Code',
  weight: '40% of course grade',
  submission: 'GitHub repository + short written thesis, submitted on Canvas',
  summary:
    'Make a claim about a dataset and defend it with code you wrote and understand. ' +
    'The grade is not the accuracy of the model — it is whether you can state a thesis, ' +
    'build something that tests it, and stand behind every line.',

  parts: [
    {
      id: 'framing',
      n: 1,
      title: 'Thesis & problem framing',
      brief:
        'State what you are claiming about your dataset and why it matters. What are you predicting or ' +
        'showing, and what would count as evidence for or against your thesis?',
      rule: RULE.ALLOWED,
      ruleNote:
        'Brainstorming the question is fair game. Use AI to pressure-test your thesis. It is recorded, not restricted.',
    },
    {
      id: 'data',
      n: 2,
      title: 'Data preparation',
      brief:
        'Load and clean your dataset. Handle missing values, choose your features, and explain the choices ' +
        'you made and what they might bias.',
      rule: RULE.LOGIC_ONLY,
      ruleNote:
        'Ask AI about the approach — how to handle missing data, what a feature choice trades off. ' +
        'It will not write the cleaning code for you. The judgement is the skill here.',
    },
    {
      id: 'model',
      n: 3,
      title: 'The model',
      brief:
        'Write the classifier that tests your thesis. It does not need to be sophisticated. It needs to be ' +
        'yours, and you need to be able to explain why every part of it is there.',
      rule: RULE.JUSTIFY_TO_EXCEED,
      ruleNote:
        'This is the part you must be able to stand behind. You can use AI, but exceeding this bound requires ' +
        'a written reason that your instructor sees — because in a viva you will be asked to defend this code.',
    },
    {
      id: 'evaluation',
      n: 4,
      title: 'Evaluation & interpretation',
      brief:
        'Report how your model did and, more importantly, what that means for your thesis. Where does it fail, ' +
        'and what would that failure mean in the real setting your data comes from?',
      rule: RULE.ALLOWED,
      ruleNote:
        'Interpreting results is analytical work where AI is a legitimate tool. Recorded, not restricted.',
    },
    {
      id: 'reflection',
      n: 5,
      title: 'Reflection (summary + question)',
      brief:
        'In your own words: what did building this teach you about what code can and cannot settle about a ' +
        'claim? Ask one real question you are left with.',
      rule: RULE.PROHIBITED,
      ruleNote:
        'This is the one part AI is turned off for entirely. The purpose is to load the ideas into your own ' +
        'head — the exact thing the course reflection has always protected. AI use here defeats the point.',
    },
  ],
};

export function getPart(id) {
  return ASSIGNMENT.parts.find((p) => p.id === id) || null;
}
