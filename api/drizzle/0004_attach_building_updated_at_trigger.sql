CREATE TRIGGER set_building_updated_at
BEFORE UPDATE ON "building"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
