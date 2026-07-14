import Groq from 'groq-sdk';
import Session from '../models/Session.js';
import Attempt from '../models/Attempt.js';

let groqClient;
const getGroqClient = () => {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }
  return groqClient;
};

const mapDifficulty = (difficulty) => {
  if (typeof difficulty === 'string') {
    const normalized = difficulty.toLowerCase();
    if (normalized === 'easy') return 3;
    if (normalized === 'medium') return 5;
    if (normalized === 'hard') return 8;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.min(10, Math.max(1, parsed)) : 1;
  }

  if (typeof difficulty === 'number' && Number.isFinite(difficulty)) {
    return Math.min(10, Math.max(1, difficulty));
  }

  return 1;
};

const generateFallbackQuestion = (topic, difficulty, index) => {
  const prompts = [
    `Explain the core concept of ${topic} and why it matters for software development.`,
    `Describe a common problem in ${topic} and how you would solve it in a production environment.`,
    `What are the most important design principles for ${topic} solutions?`,
    `How would you improve performance or reliability when working with ${topic}?`,
    `Describe a practical example where ${topic} helped solve a real engineering challenge.`
  ];

  return prompts[index % prompts.length];
};

const evaluateFallbackAnswer = (question, answer, difficulty) => {
  const normalized = (answer || '').trim();
  const lengthScore = Math.min(5, Math.floor(normalized.length / 80));
  const keywordScore = ['performance', 'scalability', 'security', 'reliability'].some((keyword) =>
    normalized.toLowerCase().includes(keyword)
  )
    ? 2
    : 0;
  const score = Math.min(10, Math.max(1, lengthScore + keywordScore + Math.floor(difficulty / 4)));

  const feedback =
    score >= 8
      ? 'Your response shows strong understanding and clear reasoning. Keep using examples and system-level details to remain consistent.'
      : score >= 5
      ? 'You have a good foundation here, but the answer would benefit from more structure and a stronger focus on trade-offs.'
      : 'The answer is a good start, but please include clearer technical steps, examples, and the impact of your design choices.';

  const correctAnswer = `A strong answer should define the problem, explain the core concepts, highlight relevant trade-offs, and describe how to apply the solution in practice.`;

  return {
    score,
    feedback,
    correctAnswer
  };
};

const buildFallbackQuestions = (topic, difficulty) => {
  return Array.from({ length: 5 }, (_, index) => ({
    _id: `question-${index}`,
    text: generateFallbackQuestion(topic, difficulty, index),
    category: topic,
    difficulty
  }));
};

const parseJsonResponse = (content, fallbackValue = {}) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    return fallbackValue;
  }
};

const buildQuestionsFromAi = async (topic, difficulty) => {
  const systemPrompt = `You are an expert technical interviewer. Generate five interview questions for the requested topic and difficulty level. Your response must be valid JSON with a single field named questions, which is an array of strings.`;
  const userPrompt = `Topic: ${topic}\nDifficulty: ${difficulty}`;
  const completion = await getGroqClient().chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    model: 'llama-3.1-8b-instant',
    response_format: { type: 'json_object' },
    temperature: 0.6
  });

  const aiResponse = parseJsonResponse(completion.choices?.[0]?.message?.content, {});
  if (!Array.isArray(aiResponse.questions)) {
    return null;
  }

  return aiResponse.questions.slice(0, 5).map((questionText, index) => ({
    _id: `question-${index}`,
    text: typeof questionText === 'string' ? questionText : String(questionText),
    category: topic,
    difficulty
  }));
};

export const startSession = async (req, res, next) => {
  try {
    const { topic, difficulty } = req.body;
    const normalizedTopic = typeof topic === 'string' ? topic.trim() : '';
    const parsedDifficulty = mapDifficulty(difficulty);

    if (!normalizedTopic) {
      res.status(400);
      throw new Error('Interview topic is required');
    }

    const session = await Session.create({
      userId: req.user._id,
      topic: normalizedTopic,
      currentDifficulty: parsedDifficulty,
      status: 'active',
      attemptsCount: 0,
      totalScore: 0,
      scoreHistory: []
    });

    let questions = buildFallbackQuestions(session.topic, session.currentDifficulty);
    if (process.env.GROQ_API_KEY) {
      const aiQuestions = await buildQuestionsFromAi(session.topic, session.currentDifficulty);
      if (Array.isArray(aiQuestions) && aiQuestions.length > 0) {
        questions = aiQuestions;
      }
    }

    return res.status(201).json({
      sessionId: session._id,
      topic: session.topic,
      difficulty: session.currentDifficulty,
      questions
    });
  } catch (error) {
    next(error);
  }
};

export const submitAnswer = async (req, res, next) => {
  try {
    const { sessionId, answers } = req.body;

    if (!sessionId || !Array.isArray(answers) || answers.length === 0) {
      res.status(400);
      throw new Error('sessionId and answers are required');
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      res.status(404);
      throw new Error('Interview session not found');
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You are not authorized to modify this session');
    }

    if (session.status === 'completed') {
      res.status(400);
      throw new Error('This interview session is already completed');
    }

    const createdAttempts = [];
    let submissionTotalScore = 0;

    for (const answerItem of answers) {
      const questionText = typeof answerItem.question === 'string'
        ? answerItem.question
        : `Interview question`;
      const userAnswer = typeof answerItem.userAnswer === 'string' ? answerItem.userAnswer : '';

      let evaluation;
      if (process.env.GROQ_API_KEY) {
        const systemPrompt = `You are a strict but constructive technical interviewer. Evaluate the user's answer to the given question and provide a score from 0 to 10, short feedback, the ideal correct answer, and a new follow-up question. Your response must be valid JSON.`;
        const userPrompt = `Topic: ${session.topic}\nDifficulty: ${session.currentDifficulty}\nQuestion: ${questionText}\nUser Answer: ${userAnswer}`;
        const completion = await getGroqClient().chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          model: 'llama-3.1-8b-instant',
          response_format: { type: 'json_object' },
          temperature: 0.5
        });
        evaluation = parseJsonResponse(completion.choices?.[0]?.message?.content, {});
      } else {
        evaluation = evaluateFallbackAnswer(questionText, userAnswer, session.currentDifficulty);
      }

      const score = Number(evaluation.score ?? 0);
      const feedback = evaluation.feedback || 'No feedback was generated.';
      const correctAnswer = evaluation.correct_answer || evaluation.correctAnswer || 'No answer available.';

      const attempt = await Attempt.create({
        sessionId: session._id,
        userId: req.user._id,
        question: questionText,
        userAnswer,
        score,
        feedback,
        correctAnswer,
        difficulty: session.currentDifficulty
      });

      createdAttempts.push(attempt);
      submissionTotalScore += score;
      session.attemptsCount += 1;
      session.totalScore += score;
      session.scoreHistory.push(score);

      if (score >= 8) {
        session.currentDifficulty = Math.min(10, session.currentDifficulty + 1);
      } else if (score <= 4) {
        session.currentDifficulty = Math.max(1, session.currentDifficulty - 1);
      }
    }

    if (session.attemptsCount >= 5) {
      session.status = 'completed';
      session.completedAt = new Date();
    }

    await session.save();

    return res.status(200).json({
      results: createdAttempts.map((attempt) => ({
        score: attempt.score,
        feedback: attempt.feedback,
        correctAnswer: attempt.correctAnswer
      })),
      totalScore: submissionTotalScore,
      sessionAverageScore: session.attemptsCount ? Number((session.totalScore / session.attemptsCount).toFixed(1)) : 0,
      completed: session.status === 'completed',
      attemptsCount: session.attemptsCount
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionHistory = async (req, res, next) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const history = sessions.map((session) => ({
      _id: session._id,
      topic: session.topic,
      status: session.status,
      attemptsCount: session.attemptsCount,
      score: session.attemptsCount ? Number((session.totalScore / session.attemptsCount).toFixed(1)) : 0,
      totalScore: session.totalScore,
      currentDifficulty: session.currentDifficulty,
      createdAt: session.createdAt,
      completedAt: session.completedAt
    }));

    res.status(200).json({ sessions: history });
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ _id: sessionId, userId: req.user._id }).lean();

    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    const attempts = await Attempt.find({ sessionId: session._id }).sort({ createdAt: 1 }).lean();

    res.status(200).json({
      session: {
        id: session._id,
        topic: session.topic,
        status: session.status,
        attemptsCount: session.attemptsCount,
        averageScore: session.attemptsCount ? Number((session.totalScore / session.attemptsCount).toFixed(1)) : 0,
        currentDifficulty: session.currentDifficulty,
        createdAt: session.createdAt,
        completedAt: session.completedAt
      },
      attempts
    });
  } catch (error) {
    next(error);
  }
};
