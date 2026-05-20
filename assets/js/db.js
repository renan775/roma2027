'use strict';

// ─── IndexedDB wrapper ────────────────────────────────────────────────────────
// Stores:
//   workout_logs    — each completed workout session
//   exercise_logs   — each exercise set within a session
//   settings        — key/value app config

const DB_NAME    = 'roma2027';
const DB_VERSION = 1;

const STORES = {
  WORKOUT_LOGS:   'workout_logs',
  EXERCISE_LOGS:  'exercise_logs',
  SETTINGS:       'settings',
};

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // workout_logs
      if (!db.objectStoreNames.contains(STORES.WORKOUT_LOGS)) {
        const ws = db.createObjectStore(STORES.WORKOUT_LOGS, { keyPath: 'id', autoIncrement: true });
        ws.createIndex('date',         'date',         { unique: false });
        ws.createIndex('week_number',  'week_number',  { unique: false });
        ws.createIndex('block_number', 'block_number', { unique: false });
        ws.createIndex('workout_type', 'workout_type', { unique: false });
        ws.createIndex('completed',    'completed',    { unique: false });
      }

      // exercise_logs
      if (!db.objectStoreNames.contains(STORES.EXERCISE_LOGS)) {
        const es = db.createObjectStore(STORES.EXERCISE_LOGS, { keyPath: 'id', autoIncrement: true });
        es.createIndex('workout_log_id',  'workout_log_id',  { unique: false });
        es.createIndex('exercise_name',   'exercise_name',   { unique: false });
        es.createIndex('date',            'date',            { unique: false });
      }

      // settings
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };

    req.onsuccess  = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror    = (e) => reject(e.target.error);
    req.onblocked  = ()  => reject(new Error('IndexedDB blocked — close other tabs'));
  });
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

function tx(storeName, mode = 'readonly') {
  return openDB().then(db => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    return { transaction, store };
  });
}

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function getAll(storeName, indexName, query) {
  const { store } = await tx(storeName);
  const source = indexName ? store.index(indexName) : store;
  return request(query ? source.getAll(query) : source.getAll());
}

async function getById(storeName, id) {
  const { store } = await tx(storeName);
  return request(store.get(id));
}

async function add(storeName, record) {
  const { store } = await tx(storeName, 'readwrite');
  return request(store.add(record));
}

async function put(storeName, record) {
  const { store } = await tx(storeName, 'readwrite');
  return request(store.put(record));
}

async function remove(storeName, id) {
  const { store } = await tx(storeName, 'readwrite');
  return request(store.delete(id));
}

async function clear(storeName) {
  const { store } = await tx(storeName, 'readwrite');
  return request(store.clear());
}

async function count(storeName, indexName, query) {
  const { store } = await tx(storeName);
  const source = indexName ? store.index(indexName) : store;
  return request(query ? source.count(query) : source.count());
}

// ─── workout_logs ─────────────────────────────────────────────────────────────

const WorkoutLogs = {
  /** Save a new completed workout. Returns the new id. */
  async add(entry) {
    return add(STORES.WORKOUT_LOGS, {
      date:             entry.date || new Date().toISOString(),
      week_number:      entry.week_number,
      block_number:     entry.block_number,
      workout_type:     entry.workout_type,
      completed:        entry.completed ?? true,
      duration_minutes: entry.duration_minutes || 0,
      exercises_done:   entry.exercises_done || [],
      notes:            entry.notes || '',
    });
  },

  async getById(id) {
    return getById(STORES.WORKOUT_LOGS, id);
  },

  async getAll() {
    const rows = await getAll(STORES.WORKOUT_LOGS);
    return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async getByWeek(weekNumber) {
    // week 0 = before plan start; no records exist yet
    if (!weekNumber || weekNumber < 1) return [];
    return getAll(STORES.WORKOUT_LOGS, 'week_number', IDBKeyRange.only(weekNumber));
  },

  async getByBlock(blockNumber) {
    if (!blockNumber) return [];
    return getAll(STORES.WORKOUT_LOGS, 'block_number', IDBKeyRange.only(blockNumber));
  },

  async getByType(workoutType) {
    if (!workoutType) return [];
    return getAll(STORES.WORKOUT_LOGS, 'workout_type', IDBKeyRange.only(workoutType));
  },

  async getCompleted() {
    // Booleans are not valid IDB key types — filter in JS instead
    const all = await getAll(STORES.WORKOUT_LOGS);
    return all.filter(r => r.completed);
  },

  async update(id, patch) {
    const existing = await getById(STORES.WORKOUT_LOGS, id);
    if (!existing) throw new Error(`workout_log ${id} not found`);
    return put(STORES.WORKOUT_LOGS, { ...existing, ...patch, id });
  },

  async delete(id) {
    return remove(STORES.WORKOUT_LOGS, id);
  },

  async count() {
    return count(STORES.WORKOUT_LOGS);
  },

  async countCompleted() {
    // Boolean index not reliable across browsers — filter in JS
    const all = await getAll(STORES.WORKOUT_LOGS);
    return all.filter(r => r.completed).length;
  },

  /** Returns a map of weekNumber → list of workout types completed that week */
  async getCompletedByWeekMap() {
    const all = await getAll(STORES.WORKOUT_LOGS);
    return all.filter(r => r.completed).reduce((acc, row) => {
      if (!acc[row.week_number]) acc[row.week_number] = [];
      acc[row.week_number].push(row.workout_type);
      return acc;
    }, {});
  },

  /** Check if a specific workout type was done this week */
  async isDoneThisWeek(weekNumber, workoutType) {
    if (!weekNumber || weekNumber < 1) return false;
    const rows = await getAll(STORES.WORKOUT_LOGS, 'week_number', IDBKeyRange.only(weekNumber));
    return rows.some(r => r.workout_type === workoutType && r.completed);
  },

  /** Returns adherence % per week: { weekNumber: pct } */
  async getWeeklyAdherence(totalWeeks = 42) {
    const map = await this.getCompletedByWeekMap();
    // A "full week" has: superior_a, inferior_a, superior_b, inferior_b (4 gym sessions + rest days don't count)
    const GYM_SESSIONS_PER_WEEK = 4;
    const result = {};
    for (let w = 1; w <= totalWeeks; w++) {
      const done = (map[w] || []).length;
      result[w] = Math.min(100, Math.round((done / GYM_SESSIONS_PER_WEEK) * 100));
    }
    return result;
  },
};

// ─── exercise_logs ────────────────────────────────────────────────────────────

const ExerciseLogs = {
  /** Save all sets for one exercise within a workout. */
  async add(entry) {
    return add(STORES.EXERCISE_LOGS, {
      workout_log_id: entry.workout_log_id,
      exercise_name:  entry.exercise_name,
      date:           entry.date || new Date().toISOString(),
      sets: (entry.sets || []).map(s => ({
        reps:      s.reps || 0,
        weight_kg: s.weight_kg || 0,
        completed: s.completed ?? true,
      })),
    });
  },

  async getByWorkout(workoutLogId) {
    return getAll(STORES.EXERCISE_LOGS, 'workout_log_id', IDBKeyRange.only(workoutLogId));
  },

  /** All historical logs for a specific exercise name */
  async getByExercise(exerciseName) {
    const rows = await getAll(STORES.EXERCISE_LOGS, 'exercise_name', IDBKeyRange.only(exerciseName));
    return rows.sort((a, b) => new Date(a.date) - new Date(b.date));
  },

  async getAll() {
    return getAll(STORES.EXERCISE_LOGS);
  },

  async delete(id) {
    return remove(STORES.EXERCISE_LOGS, id);
  },

  async deleteByWorkout(workoutLogId) {
    const rows = await this.getByWorkout(workoutLogId);
    await Promise.all(rows.map(r => remove(STORES.EXERCISE_LOGS, r.id)));
  },

  /** Returns max weight ever lifted for an exercise */
  async getMaxWeight(exerciseName) {
    const rows = await this.getByExercise(exerciseName);
    let max = 0;
    for (const log of rows) {
      for (const s of log.sets || []) {
        if (s.weight_kg > max) max = s.weight_kg;
      }
    }
    return max;
  },

  /** Returns total number of times an exercise was performed */
  async getExerciseCount(exerciseName) {
    return count(STORES.EXERCISE_LOGS, 'exercise_name', IDBKeyRange.only(exerciseName));
  },

  /** Returns [{date, maxWeight}] for charting load progression */
  async getProgressionData(exerciseName) {
    const rows = await this.getByExercise(exerciseName);
    return rows.map(log => ({
      date:      log.date,
      maxWeight: Math.max(0, ...(log.sets || []).map(s => s.weight_kg || 0)),
      avgWeight: log.sets && log.sets.length
        ? log.sets.reduce((sum, s) => sum + (s.weight_kg || 0), 0) / log.sets.length
        : 0,
      totalReps: (log.sets || []).reduce((sum, s) => sum + (s.reps || 0), 0),
    }));
  },
};

// ─── settings ─────────────────────────────────────────────────────────────────

const Settings = {
  async get(key, defaultValue = null) {
    const row = await getById(STORES.SETTINGS, key);
    return row ? row.value : defaultValue;
  },

  async set(key, value) {
    return put(STORES.SETTINGS, { key, value });
  },

  async getAll() {
    const rows = await getAll(STORES.SETTINGS);
    return rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
  },

  async delete(key) {
    return remove(STORES.SETTINGS, key);
  },
};

// ─── Backup / Restore ─────────────────────────────────────────────────────────

const Backup = {
  async export() {
    const [workouts, exercises, settings] = await Promise.all([
      WorkoutLogs.getAll(),
      ExerciseLogs.getAll(),
      Settings.getAll(),
    ]);
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'Roma2027',
      data: { workouts, exercises, settings },
    };
  },

  async import(json) {
    let payload;
    try {
      payload = typeof json === 'string' ? JSON.parse(json) : json;
    } catch {
      throw new Error('Backup inválido — não é um JSON válido');
    }

    if (payload.appName !== 'Roma2027' || !payload.data) {
      throw new Error('Backup inválido — formato não reconhecido');
    }

    const { workouts = [], exercises = [], settings = {} } = payload.data;

    // Clear and restore
    await Promise.all([
      clear(STORES.WORKOUT_LOGS),
      clear(STORES.EXERCISE_LOGS),
      clear(STORES.SETTINGS),
    ]);

    for (const w of workouts) {
      const { id: _id, ...rest } = w;
      await add(STORES.WORKOUT_LOGS, rest);
    }
    for (const e of exercises) {
      const { id: _id, ...rest } = e;
      await add(STORES.EXERCISE_LOGS, rest);
    }
    for (const [key, value] of Object.entries(settings)) {
      await Settings.set(key, value);
    }
  },
};

// ─── Full reset ───────────────────────────────────────────────────────────────

async function resetAll() {
  await Promise.all([
    clear(STORES.WORKOUT_LOGS),
    clear(STORES.EXERCISE_LOGS),
    clear(STORES.SETTINGS),
  ]);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function initDB() {
  await openDB();
  // Seed default settings if not present
  const theme = await Settings.get('theme');
  if (theme === null) await Settings.set('theme', 'dark');
  const startDate = await Settings.get('plan_start_date');
  if (startDate === null) await Settings.set('plan_start_date', '2026-05-25');
}

// ─── Exports ─────────────────────────────────────────────────────────────────

window.DB = {
  init: initDB,
  WorkoutLogs,
  ExerciseLogs,
  Settings,
  Backup,
  resetAll,
};
