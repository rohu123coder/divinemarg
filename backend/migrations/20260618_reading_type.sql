-- Split palm_face_readings into distinct reading types (palm / face)
ALTER TABLE palm_face_readings ADD COLUMN reading_type TEXT NOT NULL DEFAULT 'combined';
ALTER TABLE palm_face_readings ALTER COLUMN reading_type DROP DEFAULT;

COMMENT ON COLUMN palm_face_readings.reading_type IS 'Reading type: palm, face, or combined (legacy rows before split)';
