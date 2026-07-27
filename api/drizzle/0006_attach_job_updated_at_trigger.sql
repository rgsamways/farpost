CREATE TRIGGER set_job_updated_at
BEFORE UPDATE ON "job"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
