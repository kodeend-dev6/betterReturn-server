const moment = require("moment");
const config = require("../../config/config");
const { findUser } = require("../user.helper");
const fetcher = require("../../utils/fetcher/airTableFetcher");
const userTable = config.db.userTableUrl;

const createSubscriptionToDB = async (subscription) => {
  try {
    const result = await fetcher.get(config.db.planTableUrl);
    const stripePLans = result?.data?.records;

    const plan = stripePLans?.find(
      (plan) => plan?.fields?.planId === subscription?.plan?.id
    );

    const newData = {
      Trial_ends_at: subscription?.trial_end
        ? moment.unix(subscription.trial_end)
        : "",
      Plan_start_date: subscription?.current_period_start
        ? moment.unix(subscription.current_period_start)
        : "",
      Plan_end_date: subscription?.current_period_end
        ? moment.unix(subscription.current_period_end)
        : "",
      FreeTier: true,
      Plan_name: plan?.fields?.nickName || "",
      Stripe_id: subscription?.customer?.id || "",
      Subscription_id: subscription?.id || "",
    };

    const user = await findUser(subscription?.customer?.email, {
      throwError: true,
    });

    // Update to airtable
    const airtableURL = `${userTable}/${user?.id}`;

    const data = { fields: newData };

    const response = await fetcher.patch(airtableURL, data);

    return response.data;
  } catch (error) {
    console.log(error?.response?.data?.error);
  }
};

module.exports = createSubscriptionToDB;

// ------------------ Create Subscription ------------------
// const dummy = {
//   id: "sub_1OGxCMCBxfPNT5xixlcBY0Nc",
//   object: "subscription",
//   application: null,
//   application_fee_percent: null,
//   automatic_tax: { enabled: false },
//   billing_cycle_anchor: 1701062254,
//   billing_thresholds: null,
//   cancel_at: null,
//   cancel_at_period_end: false,
//   canceled_at: null,
//   cancellation_details: { comment: null, feedback: null, reason: null },
//   collection_method: "charge_automatically",
//   created: 1701062254,
//   currency: "usd",
//   current_period_end: 1703654254,
//   current_period_start: 1701062254,
//   customer: "cus_P57RKsbsxZQLWa",
//   days_until_due: null,
//   default_payment_method: null,
//   default_source: null,
//   default_tax_rates: [],
//   description: null,
//   discount: null,
//   ended_at: null,
//   items: {
//     object: "list",
//     data: [[Object]],
//     has_more: false,
//     total_count: 1,
//     url: "/v1/subscription_items?subscription=sub_1OGxCMCBxfPNT5xixlcBY0Nc",
//   },
//   latest_invoice: "in_1OGxCMCBxfPNT5xiVQX9taTc",
//   livemode: false,
//   metadata: {},
//   next_pending_invoice_item_invoice: null,
//   on_behalf_of: null,
//   pause_collection: null,
//   payment_settings: {
//     payment_method_options: null,
//     payment_method_types: null,
//     save_default_payment_method: null,
//   },
//   pending_invoice_item_interval: null,
//   pending_setup_intent: null,
//   pending_update: null,
//   plan: {
//     id: "price_1OGxCMCBxfPNT5xiBvBRSGn5",
//     object: "plan",
//     active: true,
//     aggregate_usage: null,
//     amount: 1500,
//     amount_decimal: "1500",
//     billing_scheme: "per_unit",
//     created: 1701062254,
//     currency: "usd",
//     interval: "month",
//     interval_count: 1,
//     livemode: false,
//     metadata: {},
//     nickname: null,
//     product: "prod_P57RP1vhboVxbE",
//     tiers_mode: null,
//     transform_usage: null,
//     trial_period_days: null,
//     usage_type: "licensed",
//   },
//   quantity: 1,
//   schedule: "sub_sched_1OGxCMCBxfPNT5xiOOjXqS64",
//   start_date: 1701062254,
//   status: "active",
//   test_clock: null,
//   transfer_data: null,
//   trial_end: null,
//   trial_settings: {
//     end_behavior: { missing_payment_method: "create_invoice" },
//   },
//   trial_start: null,
// };
