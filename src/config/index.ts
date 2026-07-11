import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
    port: process.env.PORT,
    database_url: process.env.DATABASE_URL,
    app_frontend_url: process.env.FRONTEND_URL,

    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

    // jwt
    jwt_access_token_secret: process.env.JWT_ACCESS_TOKEN_SECRET!,
    jwt_refresh_token_secret: process.env.JWT_REFRESH_TOKEN_SECRET!,
    jwt_expires_in: process.env.JWT_EXPIRES_IN!,
    jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,

    // stripe
    stripe_secret_key: process.env.STRIPE_SECRET_KEY!,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET!,

    // sslcommerz
    sslcommerz_store_id: process.env.SSLCOMMERZ_STORE_ID!,
    sslcommerz_store_password: process.env.SSLCOMMERZ_STORE_PASSWORD!,
    sslcommerz_is_live: process.env.SSLCOMMERZ_IS_LIVE === "true",

    // seed admin
    admin_email: process.env.ADMIN_EMAIL!,
    admin_password: process.env.ADMIN_PASSWORD!,
};
