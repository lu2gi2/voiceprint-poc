/* The assessment catalogue (PRD §3 and §5.1).
 *
 * Each track is a real interview shape rather than a quiz: a handful of
 * questions, each with a target length, because conciseness is one of the
 * dimensions being scored and a question with no time expectation cannot
 * measure it.
 *
 * `measures` names the dimensions a track actually exercises — an impromptu
 * round says nothing useful about vocabulary depth, so it does not claim to.
 * Tracks the PRD defers to later phases are listed with status 'soon' so the
 * roadmap is visible without pretending they work.
 */

export const DIMENSIONS = ['Fluency', 'Clarity', 'Structure', 'Conciseness', 'Vocabulary'];

export const assessments = [
  {
    id: 'hr',
    title: 'HR Interview',
    kind: 'THE OPENING ROUND',
    icon: 'users',
    c: 'var(--b)',
    rot: -1.8,
    pin: '#3E6FA0',
    desc: 'The questions every panel opens with. Judged on whether you sound prepared rather than rehearsed.',
    measures: ['Fluency', 'Clarity', 'Conciseness'],
    status: 'ready',
    resumeDriven: true,
    questions: [],
  },
  {
    id: 'technical',
    title: 'Technical Interview',
    kind: 'EXPLAIN YOUR WORK',
    icon: 'layers',
    c: 'var(--g)',
    rot: 1.4,
    tape: true,
    desc: 'Talk through what you built and why. Tests whether you can make a technical decision legible to someone who was not there.',
    measures: ['Clarity', 'Structure', 'Vocabulary'],
    status: 'ready',
    questions: [
      { prompt: 'Walk me through a project you built end to end.', guidance: 'Problem → what you chose → what it cost you.', target: 120 },
      { prompt: 'What was the hardest bug you have debugged? How did you find it?', guidance: 'The method matters more than the bug.', target: 90 },
      { prompt: 'Explain a technical concept you know well to someone non-technical.', guidance: 'Plain words first. Analogy second. Jargon last, if at all.', target: 60 },
      { prompt: 'Describe a trade-off you made and what you gave up.', guidance: 'A real trade-off has a loser. Name it.', target: 90 },
      { prompt: 'What would you build differently if you started again?', guidance: 'Specific regret, specific reason.', target: 75 },
    ],
  },
  {
    id: 'technical-resume',
    title: 'Technical Interview (Resume)',
    kind: 'FROM YOUR RESUME',
    icon: 'layers',
    c: 'var(--g)',
    rot: -1.4,
    pin: '#4E8A5B',
    desc: 'Upload your resume and the questions are drawn from what you actually built — the projects and skills you listed, not a generic bank.',
    measures: ['Clarity', 'Structure', 'Vocabulary'],
    status: 'ready',
    resumeDriven: true,
    questions: [],
  },
  {
    id: 'behavioral',
    title: 'Behavioural Round',
    kind: 'STAR FRAMEWORK',
    icon: 'spark',
    c: 'var(--y)',
    rot: -2.2,
    pin: '#C0483E',
    desc: 'Situation, Task, Action, Result. The round where good stories get lost in setup and never reach the outcome.',
    measures: ['Structure', 'Conciseness', 'Clarity'],
    status: 'ready',
    resumeDriven: true,
    questions: [],
  },
  {
    id: 'placement',
    title: 'Placement Mock',
    kind: 'FULL LOOP',
    icon: 'briefcase',
    c: 'var(--l)',
    rot: 2,
    tape: true,
    desc: 'A mixed round that moves between HR, technical and behavioural without warning — closest to a real campus loop.',
    measures: DIMENSIONS,
    status: 'ready',
    questions: [
      { prompt: 'Tell me about yourself.', guidance: 'Ninety seconds. Present, past, why here.', target: 90 },
      { prompt: 'Walk me through the project you are proudest of.', guidance: 'Your contribution, not the team’s.', target: 120 },
      { prompt: 'Tell me about a time something went wrong on that project.', guidance: 'STAR. Do not stop before the Result.', target: 105 },
      { prompt: 'Why should we pick you over someone with the same marks?', guidance: 'Evidence, not adjectives.', target: 75 },
      { prompt: 'Explain your final-year work to a non-technical interviewer.', guidance: 'No jargon without a plain-English setup.', target: 90 },
      { prompt: 'Where do you want to be by the end of your first year here?', guidance: 'Concrete and modest beats grand and vague.', target: 60 },
    ],
  },
  {
    id: 'impromptu',
    title: 'Impromptu Speaking',
    kind: 'NO PREPARATION',
    icon: 'clock',
    c: 'var(--p)',
    rot: -1.2,
    pin: '#D9A72E',
    desc: 'A topic you have not seen, sixty seconds to answer. The round that exposes filler words and thinking-out-loud habits.',
    measures: ['Fluency', 'Conciseness'],
    status: 'ready',
    questions: [
      { prompt: 'Should every student learn to code? Take a side.', guidance: 'Pick a side in the first sentence.', target: 60 },
      { prompt: 'What is one thing your college should change tomorrow?', guidance: 'One thing. One reason. One outcome.', target: 60 },
      { prompt: 'Is remote work better for early-career engineers?', guidance: 'Commit, then justify. Do not hedge both ways.', target: 60 },
      { prompt: 'Describe your hometown to someone who will never visit.', guidance: 'Three concrete details beat ten adjectives.', target: 60 },
      { prompt: 'What is the most useful thing you learned outside a classroom?', guidance: 'A story, then the lesson. Not the reverse.', target: 60 },
    ],
  },
  {
    id: 'presentation',
    title: 'Presentation Simulation',
    kind: 'TO A PANEL',
    icon: 'trend',
    c: 'var(--b)',
    rot: 1.8,
    pin: '#4E8A5B',
    desc: 'Open, structure and close a short talk. Scored on whether a listener could repeat your point afterwards.',
    measures: ['Structure', 'Clarity', 'Vocabulary'],
    status: 'ready',
    questions: [
      { prompt: 'Open your project presentation. First thirty seconds only.', guidance: 'Hook, then what it is, then why it matters.', target: 30 },
      { prompt: 'Present your approach and the alternatives you rejected.', guidance: 'Signpost it: "three options, I chose the second".', target: 120 },
      { prompt: 'Present your results to a room that has not seen the data.', guidance: 'The headline number first, the method after.', target: 90 },
      { prompt: 'A panellist interrupts: "why should we believe this?" Answer.', guidance: 'Answer the question asked, then return to your thread.', target: 60 },
      { prompt: 'Close the presentation. Last thirty seconds.', guidance: 'Restate the one thing you want remembered.', target: 30 },
    ],
  },

  /* PRD phase 2 and 5 — listed so the direction is visible, not yet built. */
  {
    id: 'gd',
    title: 'Group Discussion',
    kind: 'MULTI-SPEAKER',
    icon: 'messageSquare',
    c: 'var(--g)',
    rot: -1.6,
    tape: true,
    desc: 'A placement GD room with AI peers. Needs speaker separation to score floor-share and interruption timing.',
    measures: ['Fluency', 'Clarity'],
    status: 'soon',
    soonWhy: 'Needs speaker diarisation — PRD phase 2.',
    questions: [],
  },
  {
    id: 'workplace',
    title: 'Workplace Scenarios',
    kind: 'ON THE JOB',
    icon: 'briefcase',
    c: 'var(--l)',
    rot: 1.2,
    pin: '#3E6FA0',
    desc: 'Client meetings, negotiations and difficult conversations — communication after you are hired, not to get hired.',
    measures: ['Clarity', 'Structure'],
    status: 'soon',
    soonWhy: 'Corporate simulation — PRD phase 5.',
    questions: [],
  },
];

export const byId = (id) => assessments.find((a) => a.id === id);
