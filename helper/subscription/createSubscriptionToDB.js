const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const moment = require("moment");
const stripePLans = require("../../utils/stripe/stripePlans");
const config = require("../../config/config");
const { findUser } = require("../user.helper");
const fetcher = require("../../utils/fetcher/airTableFetcher");
const userTable = config.db.userTableUrl;

const createSubscriptionToDB = async (stripeData) => {
  try {
    const { subscription: subscriptionId } = stripeData;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["customer"],
    });

    const Plan_name = stripePLans.find(
      (plan) => plan.id === subscription?.plan?.id
    ).name;

    console.log(subscription);

    const newData = {
      Trial_ends_at: moment.unix(subscription.trial_end) || undefined,
      Plan_start_date: moment.unix(subscription.current_period_start),
      Plan_end_date: moment.unix(subscription.current_period_end),
      FreeTier: true,
      Plan_name: Plan_name,
      Stripe_id: subscription?.customer?.id,
      Subscription_id: subscription.id,
    };

    const user = await findUser(subscription?.customer?.email, {
      throwError: true,
    });

    // Update to airtable
    const airtableURL = `${userTable}/${user?.id}`;

    const data = { fields: newData };
    const response = await fetcher.patch(airtableURL, data);

    return response;
  } catch (error) {
    console.log(error?.response?.data?.error);
  }
};

module.exports = createSubscriptionToDB;

// ------------------ Create Subscription ------------------
// const dummy = {
//   id: "in_1OGJHNCBxfPNT5xiopuHDPnP",
//   object: "invoice",
//   account_country: "DK",
//   account_name: "BetterReturn ",
//   account_tax_ids: null,
//   amount_due: 0,
//   amount_paid: 0,
//   amount_remaining: 0,
//   amount_shipping: 0,
//   application: null,
//   application_fee_amount: null,
//   attempt_count: 0,
//   attempted: true,
//   auto_advance: false,
//   automatic_tax: { enabled: false, status: null },
//   billing_reason: "subscription_create",
//   charge: null,
//   collection_method: "charge_automatically",
//   created: 1700908805,
//   currency: "eur",
//   custom_fields: null,
//   customer: "cus_P4SBYklaNCieqc",
//   customer_address: null,
//   customer_email: "horizonsolutions.dev4@gmail.com",
//   customer_name: "Dev4",
//   customer_phone: null,
//   customer_shipping: null,
//   customer_tax_exempt: "none",
//   customer_tax_ids: [],
//   default_payment_method: null,
//   default_source: null,
//   default_tax_rates: [],
//   description: null,
//   discount: null,
//   discounts: [],
//   due_date: null,
//   effective_at: 1700908805,
//   ending_balance: 0,
//   footer: null,
//   from_invoice: null,
//   hosted_invoice_url:
//     "https://invoice.stripe.com/i/acct_1LDU3XCBxfPNT5xi/test_YWNjdF8xTERVM1hDQnhmUE5UNXhpLF9QNFNCbmVrUHJqVXRJUkpKbkZLZnRTMkZuU2xJaUZkLDkxNDQ5NjA30200dMP2vtvZ?s=ap",
//   invoice_pdf:
//     "https://pay.stripe.com/invoice/acct_1LDU3XCBxfPNT5xi/test_YWNjdF8xTERVM1hDQnhmUE5UNXhpLF9QNFNCbmVrUHJqVXRJUkpKbkZLZnRTMkZuU2xJaUZkLDkxNDQ5NjA30200dMP2vtvZ/pdf?s=ap",
//   last_finalization_error: null,
//   latest_revision: null,
//   lines: {
//     object: "list",
//     data: [[Object]],
//     has_more: false,
//     total_count: 1,
//     url: "/v1/invoices/in_1OGJHNCBxfPNT5xiopuHDPnP/lines",
//   },
//   livemode: false,
//   metadata: {},
//   next_payment_attempt: null,
//   number: "7BE8048A-0550",
//   on_behalf_of: null,
//   paid: true,
//   paid_out_of_band: false,
//   payment_intent: null,
//   payment_settings: {
//     default_mandate: null,
//     payment_method_options: {
//       acss_debit: null,
//       bancontact: null,
//       card: [Object],
//       customer_balance: null,
//       konbini: null,
//       us_bank_account: null,
//     },
//     payment_method_types: ["card"],
//   },
// };
