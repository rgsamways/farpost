CREATE TRIGGER set_checklist_template_updated_at
BEFORE UPDATE ON "checklist_template"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
