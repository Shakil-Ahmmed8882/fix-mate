import Stripe from "stripe";
import config from "../config/index.js";

const stripe = new Stripe(config.stripe_secret_key);

export { stripe };
