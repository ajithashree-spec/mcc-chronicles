const crypto = require('crypto');
const pool = require('../config/db');
const { extractIp, logActivity } = require('../utils/logger');

/**
 * Helper to compute vote breakdown for a poll.
 */
async function computePollResults(poll, clientIpHash = null) {
  const options = Array.isArray(poll.options)
    ? poll.options
    : typeof poll.options === 'string'
    ? JSON.parse(poll.options)
    : [];

  const [voteRows] = await pool.query(
    'SELECT option_index, COUNT(*) as vote_count FROM poll_votes WHERE poll_id = ? GROUP BY option_index',
    [poll.id]
  );

  const votesMap = {};
  let totalVotes = 0;
  voteRows.forEach((row) => {
    votesMap[row.option_index] = Number(row.vote_count);
    totalVotes += Number(row.vote_count);
  });

  let hasVoted = false;
  let userVotedOption = null;

  if (clientIpHash) {
    const [userVote] = await pool.query(
      'SELECT option_index FROM poll_votes WHERE poll_id = ? AND ip_hash = ? LIMIT 1',
      [poll.id, clientIpHash]
    );
    if (userVote.length > 0) {
      hasVoted = true;
      userVotedOption = userVote[0].option_index;
    }
  }

  const results = options.map((option, idx) => {
    const count = votesMap[idx] || 0;
    const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    return {
      option_index: idx,
      option,
      votes: count,
      percentage,
    };
  });

  return {
    id: poll.id,
    question: poll.question,
    options,
    is_active: Boolean(poll.is_active),
    created_at: poll.created_at,
    expires_at: poll.expires_at,
    total_votes: totalVotes,
    has_voted: hasVoted,
    user_voted_option: userVotedOption,
    results,
  };
}

/**
 * Retrieve the currently active campus opinion poll with live vote tallies.
 * Public access.
 */
async function getActivePoll(req, res, next) {
  try {
    const [polls] = await pool.query(
      'SELECT id, question, options, is_active, created_at, expires_at FROM polls WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    );

    if (polls.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No active campus poll currently available.',
      });
    }

    const clientIp = extractIp(req) || '127.0.0.1';
    const clientIpHash = crypto.createHash('sha256').update(clientIp).digest('hex');

    const pollData = await computePollResults(polls[0], clientIpHash);

    return res.status(200).json({
      success: true,
      data: pollData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cast a vote on a campus poll.
 * Public access with IP deduplication.
 */
async function votePoll(req, res, next) {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body;

    const optIdx = parseInt(optionIndex, 10);
    if (isNaN(optIdx) || optIdx < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid optionIndex provided. Must be a non-negative integer.',
      });
    }

    const [pollRows] = await pool.query(
      'SELECT id, question, options, is_active, expires_at, created_at FROM polls WHERE id = ? LIMIT 1',
      [id]
    );

    if (pollRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found.',
      });
    }

    const poll = pollRows[0];
    if (!poll.is_active) {
      return res.status(400).json({
        success: false,
        error: 'This campus poll is currently closed.',
      });
    }

    const options = Array.isArray(poll.options)
      ? poll.options
      : typeof poll.options === 'string'
      ? JSON.parse(poll.options)
      : [];

    if (optIdx >= options.length) {
      return res.status(400).json({
        success: false,
        error: `optionIndex out of bounds. Must be between 0 and ${options.length - 1}.`,
      });
    }

    const clientIp = extractIp(req) || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex');

    // Check duplicate vote
    const [existingVote] = await pool.query(
      'SELECT id FROM poll_votes WHERE poll_id = ? AND ip_hash = ? LIMIT 1',
      [poll.id, ipHash]
    );

    if (existingVote.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'You have already voted in this campus opinion poll.',
      });
    }

    await pool.query(
      'INSERT INTO poll_votes (poll_id, option_index, ip_hash) VALUES (?, ?, ?)',
      [poll.id, optIdx, ipHash]
    );

    const updatedPollData = await computePollResults(poll, ipHash);

    return res.status(200).json({
      success: true,
      message: 'Vote recorded successfully.',
      data: updatedPollData,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'You have already voted in this campus opinion poll.',
      });
    }
    next(error);
  }
}

/**
 * Create a new campus opinion poll.
 * Protected: super_admin, editor only.
 */
async function createPoll(req, res, next) {
  try {
    const { question, options, is_active = true, expires_at = null } = req.body;

    if (!question || !String(question).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Poll question is required.',
      });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least two options are required for a campus poll.',
      });
    }

    const cleanOptions = options.map((opt) => String(opt).trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least two non-empty option strings are required.',
      });
    }

    // If new poll is marked active, deactivate any existing active polls
    if (is_active) {
      await pool.query('UPDATE polls SET is_active = 0 WHERE is_active = 1');
    }

    const [result] = await pool.query(
      'INSERT INTO polls (question, options, is_active, expires_at) VALUES (?, ?, ?, ?)',
      [String(question).trim(), JSON.stringify(cleanOptions), is_active ? 1 : 0, expires_at]
    );

    const [newPollRows] = await pool.query('SELECT * FROM polls WHERE id = ?', [result.insertId]);

    logActivity({
      action: 'POLL_CREATE',
      entityType: 'poll',
      entityId: result.insertId,
      details: { question: String(question).trim(), optionsCount: cleanOptions.length },
      req,
    });

    const pollData = await computePollResults(newPollRows[0]);

    return res.status(201).json({
      success: true,
      message: 'Campus poll created successfully.',
      data: pollData,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getActivePoll,
  votePoll,
  createPoll,
};
