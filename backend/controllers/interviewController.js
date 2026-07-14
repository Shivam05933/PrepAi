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

const generateFallbackQuestion = (topic, difficulty) => {
  const templates = [
    `Explain the core concept of ${topic} and why it is important in modern engineering.`,
    `Describe a common challenge in ${topic} and how you would solve it.`,
    `What are the most important principles when designing ${topic} solutions?`,
    `How would you approach a complex ${topic} problem in a production environment?`
  ];

  const index = Math.min(templates.length - 1, Math.max(0, difficulty - 1));
  return templates[index] || `Explain your approach to ${topic} with respect to system design and reliability.`;
};

const evaluateFallbackAnswer = (question, answer, difficulty) => {
  const normalized = (answer || '').trim();
  const lengthScore = Math.min(5, Math.floor(normalized.length / 80));
  const higherScoreOnKeywords = ['performance', 'scalability', 'security', 'reliability'];
  const keywordScore = higherScoreOnKeywords.some((keyword) => normalized.toLowerCase().includes(keyword)) ? 2 : 0;
  const score = Math.min(10, Math.max(1, lengthScore + keywordScore + Math.floor(difficulty / 4)));

  const feedback = score >= 8
    ? 'Your response shows strong understanding and clear reasoning. Keep using examples and system-level details to remain consistent.'
    : score >= 5
      ? 'You have a good foundation here, but the answer would benefit from more structure and a stronger focus on trade-offs.'
      : 'The answer is a good start, but please include clearer technical steps, examples, and the impact of your design choices.';

  const correctAnswer = `A strong answer should define the problem, explain the core concepts, highlight relevant trade-offs, and describe how to apply the solution in practice.`;
  const nextQuestion = `Describe how you would improve ${topic} performance when the system is under heavy load.`;

  return {
    score,
    feedback,
    correctAnswer,
    nextQuestion
  };
};

const parseJsonResponse = (content, fallbackValue = {}) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    return fallbackValue;
  }
};

export const startSession = async (req, res, next) => {
  try {
    const { topic, difficulty } = req.body;
    const normalizedTopic = typeof topic === 'string' ? topic.trim() : '';
    let parsedDifficulty = Number(difficulty);

    if (!normalizedTopic) {
      res.status(400);
      throw new Error('Interview topic is required');
    }

    if (!parsedDifficulty || parsedDifficulty < 1 || parsedDifficulty > 10) {
      parsedDifficulty = 1;
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

    let questionText = generateFallbackQuestion(session.topic, session.currentDifficulty);
    if (process.env.GROQ_API_KEY) {
      const systemPrompt = `You are an expert technical interviewer. Generate a technical interview question for the requested topic and difficulty level. Your response must be valid JSON with a single field named question.`;
      const userPrompt = `Topic: ${session.topic}\nDifficulty: ${session.currentDifficulty}`;
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
      questionText = aiResponse.question || questionText;
    }

    return res.status(201).json({
      sessionId: session._id,
      topic: session.topic,
      difficulty: session.currentDifficulty,
      questions: [
        {
          _id: session._id,
          text: questionText,
          category: session.topic
        }
      ]
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

    let totalScore = 0;
    const createdAttempts = [];

    for (const answerItem of answers) {
      const { question, userAnswer } = answerItem;
      if (!question || typeof userAnswer !== 'string') {
        continue;
      }

      let evaluation;
      if (process.env.GROQ_API_KEY) {
        const systemPrompt = `You are a strict but constructive technical interviewer. Evaluate the user's answer to the given question and provide a score from 0 to 10, short feedback, the ideal correct answer, and a new follow-up question. Your response must be valid JSON.`;
        const userPrompt = `Topic: ${session.topic}\nDifficulty: ${session.currentDifficulty}\nQuestion: ${question}\nUser Answer: ${userAnswer}`;
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
        evaluation = evaluateFallbackAnswer(question, userAnswer, session.currentDifficulty);
      }

      const score = Number(evaluation.score ?? 0);
      const feedback = evaluation.feedback || 'No feedback was generated.';
      const correctAnswer = evaluation.correct_answer || evaluation.correctAnswer || 'No answer available.';
      const nextQuestion = evaluation.next_question || evaluation.nextQuestion || generateFallbackQuestion(session.topic, session.currentDifficulty);

      const attempt = await Attempt.create({
        sessionId: session._id,
        userId: req.user._id,
        question,
        userAnswer,
        score,
        feedback,
        correctAnswer,
        difficulty: session.currentDifficulty
      });

      createdAttempts.push(attempt);
      totalScore += score;
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

    const averageScore = session.attemptsCount ? Number((session.totalScore / session.attemptsCount).toFixed(1)) : 0;

    return res.status(200).json({
      score: averageScore,
      feedback: createdAttempts.map((attempt) => attempt.feedback).join(' '),
      correctAnswer: createdAttempts.map((attempt) => attempt.correctAnswer).join(' '),
      nextQuestion: createdAttempts.length > 0 ? createdAttempts[createdAttempts.length - 1].question : null,
      difficulty: session.currentDifficulty,
      completed: session.status === 'completed',
      attemptsCount: session.attemptsCount,
      sessionId: session._id
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
