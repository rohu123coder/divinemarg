-- Widen problem_area to support comma-separated multi-select values
ALTER TABLE chat_sessions
  ALTER COLUMN problem_area TYPE TEXT;

COMMENT ON COLUMN chat_sessions.problem_area IS 'Comma-separated problem areas (career, love, marriage, health, family, finance, education, other)';
