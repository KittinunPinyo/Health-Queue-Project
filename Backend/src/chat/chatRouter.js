import { Router } from 'express';

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function mapRoomRow(row) {
  return {
    id: String(row.id),
    patientId: row.patient_id,
    adminId: row.admin_id,
    patientName: row.patient_name || '',
    lastMessage: row.last_message || '',
    lastMessageAt: row.last_message_at,
    unreadCount: Number(row.unread_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessageRow(row) {
  return {
    id: String(row.id),
    roomId: String(row.room_id),
    senderId: row.sender_id,
    senderRole: row.sender_role,
    text: row.message_text,
    isRead: Boolean(row.is_read),
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

async function findOrCreateRoom({ dbGet, dbInsert }, { roomId, patientId, adminId = null }) {
  if (roomId) {
    const byRoomId = await dbGet('SELECT * FROM chat_rooms WHERE id::text = ? LIMIT 1', [String(roomId)]);
    if (byRoomId) return byRoomId;
  }

  if (!patientId) return null;

  const existing = await dbGet('SELECT * FROM chat_rooms WHERE patient_id = ? LIMIT 1', [patientId]);
  if (existing) return existing;

  const insert = await dbInsert(
    `INSERT INTO chat_rooms (patient_id, admin_id, last_message_at, created_at, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [patientId, adminId]
  );

  return dbGet('SELECT * FROM chat_rooms WHERE id = ?', [insert.lastID]);
}

export function createChatRouter({ dbAll, dbGet, dbRun, dbInsert }) {
  const router = Router();

  // ดึงรายชื่อห้องแชท
  router.get('/rooms', async (req, res) => {
    try {
      const role = String(req.query.role || 'admin').toLowerCase();
      const userId = req.query.userId ? toPositiveInt(req.query.userId, null) : null;

      if (role === 'patient' && !userId) {
        return res.status(400).json({ error: 'userId is required for patient role' });
      }

      const whereSql = role === 'patient' ? 'WHERE r.patient_id = ?' : '';
      const params = role === 'patient' ? [userId] : [];

      const unreadRole = role === 'patient' ? 'patient' : 'admin';

      const rows = await dbAll(
        `SELECT
          r.*,
          u.name AS patient_name,
          lm.message_text AS last_message,
          (
            SELECT COUNT(*)
            FROM chat_messages cm
            WHERE cm.room_id = r.id
              AND cm.is_read = FALSE
              AND cm.sender_role <> ?
          ) AS unread_count
        FROM chat_rooms r
        LEFT JOIN users u ON u.id = r.patient_id
        LEFT JOIN LATERAL (
          SELECT message_text
          FROM chat_messages
          WHERE room_id = r.id
          ORDER BY created_at DESC, id DESC
          LIMIT 1
        ) lm ON TRUE
        ${whereSql}
        ORDER BY r.last_message_at DESC, r.id DESC`,
        [unreadRole, ...params]
      );

      return res.json(rows.map(mapRoomRow));
    } catch (error) {
      console.error('GET /api/chat/rooms error:', error);
      return res.status(500).json({ error: 'Unable to fetch chat rooms' });
    }
  });

  // ดึงข้อความในห้องแชทแบบแบ่งหน้า
  router.get('/rooms/:roomId/messages', async (req, res) => {
    try {
      const roomId = String(req.params.roomId || '').trim();
      const page = toPositiveInt(req.query.page, 1);
      const pageSize = Math.min(toPositiveInt(req.query.pageSize, 30), 100);
      const offset = (page - 1) * pageSize;

      const room = await dbGet('SELECT id FROM chat_rooms WHERE id::text = ? LIMIT 1', [roomId]);
      if (!room) {
        return res.status(404).json({ error: 'Chat room not found' });
      }

      const countRow = await dbGet('SELECT COUNT(*)::int AS total FROM chat_messages WHERE room_id = ?', [room.id]);
      const total = Number(countRow?.total || 0);

      const rows = await dbAll(
        `SELECT *
         FROM chat_messages
         WHERE room_id = ?
         ORDER BY created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        [room.id, pageSize, offset]
      );

      const messages = rows.map(mapMessageRow).reverse();

      return res.json({
        roomId: String(room.id),
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        messages,
      });
    } catch (error) {
      console.error('GET /api/chat/rooms/:roomId/messages error:', error);
      return res.status(500).json({ error: 'Unable to fetch chat messages' });
    }
  });

  // ส่งข้อความใหม่ (สร้างห้องอัตโนมัติหากยังไม่มี)
  router.post('/messages', async (req, res) => {
    try {
      const {
        roomId,
        patientId,
        adminId = null,
        senderId = null,
        senderRole,
        text,
      } = req.body || {};

      const role = String(senderRole || '').toLowerCase();
      if (!['patient', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'senderRole must be patient or admin' });
      }

      const messageText = String(text || '').trim();
      if (!messageText) {
        return res.status(400).json({ error: 'text is required' });
      }

      const parsedPatientId = patientId ? toPositiveInt(patientId, null) : null;
      const room = await findOrCreateRoom(
        { dbGet, dbInsert },
        { roomId, patientId: parsedPatientId, adminId: adminId ? toPositiveInt(adminId, null) : null }
      );

      if (!room) {
        return res.status(400).json({ error: 'roomId or patientId is required' });
      }

      const inserted = await dbInsert(
        `INSERT INTO chat_messages (
          room_id,
          sender_id,
          sender_role,
          message_text,
          is_read,
          created_at
        ) VALUES (?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP)`,
        [room.id, senderId ? toPositiveInt(senderId, null) : null, role, messageText]
      );

      await dbRun(
        `UPDATE chat_rooms
         SET last_message_at = CURRENT_TIMESTAMP,
             admin_id = COALESCE(?, admin_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [adminId ? toPositiveInt(adminId, null) : null, room.id]
      );

      const messageRow = await dbGet('SELECT * FROM chat_messages WHERE id = ?', [inserted.lastID]);
      return res.status(201).json({
        message: 'Chat message sent',
        roomId: String(room.id),
        chatMessage: mapMessageRow(messageRow),
      });
    } catch (error) {
      console.error('POST /api/chat/messages error:', error);
      return res.status(500).json({ error: 'Unable to send chat message' });
    }
  });

  // อัปเดตสถานะอ่านข้อความแล้ว
  router.patch('/rooms/:roomId/read', async (req, res) => {
    try {
      const roomId = String(req.params.roomId || '').trim();
      const readerRole = String(req.body?.readerRole || '').toLowerCase();

      if (!['patient', 'admin'].includes(readerRole)) {
        return res.status(400).json({ error: 'readerRole must be patient or admin' });
      }

      const room = await dbGet('SELECT id FROM chat_rooms WHERE id::text = ? LIMIT 1', [roomId]);
      if (!room) {
        return res.status(404).json({ error: 'Chat room not found' });
      }

      const updateResult = await dbRun(
        `UPDATE chat_messages
         SET is_read = TRUE,
             read_at = CURRENT_TIMESTAMP
         WHERE room_id = ?
           AND is_read = FALSE
           AND sender_role <> ?`,
        [room.id, readerRole]
      );

      return res.json({
        message: 'Read status updated',
        roomId: String(room.id),
        updatedCount: updateResult.rowCount || 0,
      });
    } catch (error) {
      console.error('PATCH /api/chat/rooms/:roomId/read error:', error);
      return res.status(500).json({ error: 'Unable to update read status' });
    }
  });

  return router;
}
