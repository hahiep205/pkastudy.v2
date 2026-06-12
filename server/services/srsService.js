const pool = require('../db');
const {
  getDueReviewsByUserId,
  getReviewQueueByUserId,
  getFlashcardsByIds,
  getReviewsByUserIdAndFlashcardIdsForUpdate,
  upsertReviews,
} = require('../models/srsModel');
const { calculateSM2, SM2_DEFAULT_EF } = require('../utils/sm2');

async function fetchDueReviewsByUserId(userId) {
  return getDueReviewsByUserId(userId);
}

async function fetchReviewQueueByUserId(userId) {
  return getReviewQueueByUserId(userId);
}

async function enqueueImmediateReviewBatch(userId, flashcardIds) {
  const uniqueFlashcardIds = [...new Set((flashcardIds || []).filter((id) => Number.isInteger(id) && id > 0))];
  if (uniqueFlashcardIds.length === 0) return [];

  const flashcards = await getFlashcardsByIds(uniqueFlashcardIds);
  if (flashcards.length !== uniqueFlashcardIds.length) {
    const existingIds = new Set(flashcards.map((item) => item.id));
    const missingFlashcardId = uniqueFlashcardIds.find((id) => !existingIds.has(id));
    const error = new Error(`Flashcard not found: ${missingFlashcardId}`);
    error.status = 400;
    throw error;
  }

  const today = new Date().toISOString().slice(0, 10);
  const reviewRows = uniqueFlashcardIds.map((flashcardId) => ({
    userId,
    flashcardId,
    interval: 0,
    ef: SM2_DEFAULT_EF,
    repetition: 0,
    nextReviewDate: today,
    lastReviewedAt: null,
  }));

  await upsertReviews(reviewRows);
  return flashcards;
}

async function saveReviewBatch(userId, reviewItems) {
  const flashcardIds = [...new Set(reviewItems.map((item) => item.flashcard_id))];
  const connection = await pool.getConnection();
  const lastReviewedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  try {
    await connection.beginTransaction();

    const flashcards = await getFlashcardsByIds(flashcardIds, connection);
    if (flashcards.length !== flashcardIds.length) {
      const existingIds = new Set(flashcards.map((item) => item.id));
      const missingFlashcardId = flashcardIds.find((id) => !existingIds.has(id));
      const error = new Error(`Flashcard not found: ${missingFlashcardId}`);
      error.status = 400;
      throw error;
    }

    const currentReviews = await getReviewsByUserIdAndFlashcardIdsForUpdate(
      userId,
      flashcardIds,
      connection
    );
    const flashcardMap = new Map(flashcards.map((item) => [item.id, item]));
    const reviewStateMap = new Map(
      currentReviews.map((item) => [
        item.flashcardId,
        {
          interval: Number(item.interval ?? 0),
          ef: Number(item.ef ?? SM2_DEFAULT_EF),
          repetition: Number(item.repetition ?? 0),
        },
      ])
    );

    const finalReviewMap = new Map();
    const reviewOrder = [];

    reviewItems.forEach((item) => {
      const currentState = reviewStateMap.get(item.flashcard_id) || {
        interval: 0,
        ef: SM2_DEFAULT_EF,
        repetition: 0,
      };
      const schedule = calculateSM2(
        item.quality,
        currentState.interval,
        currentState.ef,
        currentState.repetition
      );
      const nextState = {
        interval: schedule.interval,
        ef: schedule.ef,
        repetition: schedule.repetition,
      };

      reviewStateMap.set(item.flashcard_id, nextState);

      if (!finalReviewMap.has(item.flashcard_id)) {
        reviewOrder.push(item.flashcard_id);
      }

      finalReviewMap.set(item.flashcard_id, {
        userId,
        flashcardId: item.flashcard_id,
        interval: schedule.interval,
        ef: schedule.ef,
        repetition: schedule.repetition,
        nextReviewDate: schedule.nextReviewDate,
        lastReviewedAt,
        flashcard: flashcardMap.get(item.flashcard_id),
      });
    });

    const scheduledReviews = reviewOrder.map((flashcardId) => finalReviewMap.get(flashcardId));

    await upsertReviews(scheduledReviews, connection);
    await connection.commit();

    return reviewItems.map((item) => {
      const scheduledReview = finalReviewMap.get(item.flashcard_id);
      return {
        flashcardId: scheduledReview.flashcardId,
        interval: scheduledReview.interval,
        ef: scheduledReview.ef,
        repetition: scheduledReview.repetition,
        nextReviewDate: scheduledReview.nextReviewDate,
        word: scheduledReview.flashcard.word,
        mean: scheduledReview.flashcard.mean,
        transcription: scheduledReview.flashcard.transcription,
        wordtype: scheduledReview.flashcard.wordtype,
      };
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  fetchDueReviewsByUserId,
  fetchReviewQueueByUserId,
  enqueueImmediateReviewBatch,
  saveReviewBatch,
};
