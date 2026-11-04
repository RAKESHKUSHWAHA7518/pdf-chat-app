import { collections } from "../db/database.js";
import { sessionService } from "./sessionService.js";
import { ApiError } from "../middleware/errorHandler.js";
export async function authorizeDocument(req, sessionId) {
  if (req.userId) {
    const doc = await collections.userDocuments().findOne({ sessionId, userId: req.userId });
    if (doc) return doc;
  }
  const session = sessionService.get(sessionId);
  if (!session?.userId && session?.guestId && session.guestId === req.guestId) return session;
  throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found or expired");
}
