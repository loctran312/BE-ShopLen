# BE-ShopLen

Backend API for **ShopLen** — an e-commerce platform for yarn and knitting/crochet accessories.

Built with **Node.js + Express 5 + PostgreSQL**. Features include user authentication (JWT + Google OAuth), product management, cart, orders, MoMo/COD payments, workshops, loyalty points, lucky spin, voucher/promotion system, shipper delivery management, and an admin dashboard.

## Installation

```bash
git clone https://github.com/loctran312/BE-ShopLen.git
cd BE-ShopLen
npm install
```

### Database Setup

Create a PostgreSQL database and import the schema:

```bash
createdb shoplen
psql -d shoplen -f shoplen.sql
psql -d shoplen -f sample_data.sql
```

### Configuration

Copy the environment template and fill in your credentials:

```bash
cp env.example .env
```

Key variables to configure:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `MOMO_PARTNER_CODE` / `MOMO_ACCESS_KEY` / `MOMO_SECRET_KEY` | MoMo payment credentials |
| `RESEND_API_KEY` / `RESEND_FROM` | Resend email service credentials |
| `IMGBB_API_KEY` | ImgBB image upload API key |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `FRONTEND_URL` | Frontend URL for CORS |

See `env.example` for the full list.

## Running

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:3000`.

## Documentation

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Custom HTML Docs**: `http://localhost:3000/api/docs-page`
- **OpenAPI JSON**: `http://localhost:3000/api/docs.json`
- **Full Project Specification**: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

## License

ISC

## Author

- **GitHub**: [loctran312](https://github.com/loctran312)