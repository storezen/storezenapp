# api-server src standard

Recommended layering for backend code:

- `routes/` HTTP route wiring
- `controllers/` request/response handling
- `services/` business logic
- `repositories/` database access
- `validators/` schema validation
- `middlewares/` express middleware
- `config/`, `types/`, `utils/` support modules

Keep route files thin and move logic into services/repositories over time.
