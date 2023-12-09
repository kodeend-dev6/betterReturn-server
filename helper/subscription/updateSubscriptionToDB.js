const moment = require("moment");
const { findUser } = require("../user.helper");
const config = require("../../config/config");
const fetcher = require("../../utils/fetcher/airTableFetcher");

const updateSubscriptionToDB = async ({ subscription, invoice }) => {
  try {
    // update Subscription_id, Plan_end_date in database
    const newData = {
      Subscription_id: subscription?.id || "",
      Plan_end_date: moment.unix(subscription?.current_period_end),
    };

    const user = await findUser(invoice?.customer_email, {
      throwError: true,
    });

    // Update to airtable
    const airtableURL = `${config?.db?.user}/${user?.id}`;
    const data = { fields: newData };
    const response = await fetcher.patch(airtableURL, data);

    return response.data;
  } catch (error) {
    console.log(error?.response?.data?.error);
  }
};

module.exports = updateSubscriptionToDB;

// -----------------------
// {
//   subscription: {
//     id: 'sub_1OJvq7CBxfPNT5xi6zHX9uur',
//     object: 'subscription',
//     application: null,
//     application_fee_percent: null,
//     automatic_tax: { enabled: false },
//     billing_cycle_anchor: 1701773816,
//     billing_thresholds: null,
//     cancel_at: null,
//     cancel_at_period_end: false,
//     canceled_at: null,
//     cancellation_details: { comment: null, feedback: null, reason: null },
//     collection_method: 'charge_automatically',
//     created: 1701772015,
//     currency: 'eur',
//     current_period_end: 1704452216,
//     current_period_start: 1701773816,
//     customer: 'cus_P8C7cZne0rRJqb',
//     days_until_due: null,
//     default_payment_method: null,
//     default_source: null,
//     default_tax_rates: [],
//     description: null,
//     discount: null,
//     ended_at: null,
//     items: {
//       object: 'list',
//       data: [Array],
//       has_more: false,
//       total_count: 1,
//       url: '/v1/subscription_items?subscription=sub_1OJvq7CBxfPNT5xi6zHX9uur'
//     },
//     latest_invoice: 'in_1OJwM4CBxfPNT5xiFDYq21wD',
//     livemode: true,
//     metadata: {},
//     next_pending_invoice_item_invoice: null,
//     on_behalf_of: null,
//     pause_collection: null,
//     payment_settings: {
//       payment_method_options: [Object],
//       payment_method_types: [Array],
//       save_default_payment_method: 'on_subscription'
//     },
//     pending_invoice_item_interval: null,
//     pending_setup_intent: 'seti_1OJvq8CBxfPNT5xiamYr3KtQ',
//     pending_update: null,
//     plan: {
//       id: 'price_1OJCVbCBxfPNT5xiYk4DIhfp',
//       object: 'plan',
//       active: true,
//       aggregate_usage: null,
//       amount: 100,
//       amount_decimal: '100',
//       billing_scheme: 'per_unit',
//       created: 1701597763,
//       currency: 'eur',
//       interval: 'month',
//       interval_count: 1,
//       livemode: true,
//       metadata: {},
//       nickname: null,
//       product: 'prod_P7RO8A0YdGF759',
//       tiers_mode: null,
//       transform_usage: null,
//       trial_period_days: null,
//       usage_type: 'licensed'
//     },
//     quantity: 1,
//     schedule: null,
//     start_date: 1701772015,
//     status: 'active',
//     test_clock: null,
//     transfer_data: null,
//     trial_end: 1701773816,
//     trial_settings: { end_behavior: [Object] },
//     trial_start: 1701772015
//   },
//   invoice: {
//     id: 'in_1OJwM5CBxfPNT5xiQsoN6I66',
//     object: 'invoice',
//     account_country: 'DK',
//     account_name: 'BetterReturn ',
//     account_tax_ids: null,
//     amount_due: 0,
//     amount_paid: 0,
//     amount_remaining: 0,
//     amount_shipping: 0,
//     application: null,
//     application_fee_amount: null,
//     attempt_count: 0,
//     attempted: false,
//     auto_advance: true,
//     automatic_tax: { enabled: false, status: null },
//     billing_reason: 'manual',
//     charge: null,
//     collection_method: 'charge_automatically',
//     created: 1701773997,
//     currency: 'eur',
//     custom_fields: null,
//     customer: 'cus_P8C7cZne0rRJqb',
//     customer_address: null,
//     customer_email: 'kodeend.dev1@gmail.com',
//     customer_name: 'shahnawaz jinnah',
//     customer_phone: null,
//     customer_shipping: null,
//     customer_tax_exempt: 'none',
//     customer_tax_ids: [],
//     default_payment_method: null,
//     default_source: null,
//     default_tax_rates: [],
//     description: null,
//     discount: null,
//     discounts: [],
//     due_date: null,
//     effective_at: null,
//     ending_balance: null,
//     footer: null,
//     from_invoice: null,
//     hosted_invoice_url: null,
//     invoice_pdf: null,
//     last_finalization_error: null,
//     latest_revision: null,
//     lines: {
//       object: 'list',
//       data: [],
//       has_more: false,
//       total_count: 0,
//       url: '/v1/invoices/in_1OJwM5CBxfPNT5xiQsoN6I66/lines'
//     },
//     livemode: true,
//     metadata: {},
//     next_payment_attempt: 1701777597,
//     number: null,
//     on_behalf_of: null,
//     paid: false,
//     paid_out_of_band: false,
//     payment_intent: null,
//     payment_settings: {
//       default_mandate: null,
//       payment_method_options: null,
//       payment_method_types: null
//     },
//     period_end: 1704452216,
//     period_start: 1701773816,
//     post_payment_credit_notes_amount: 0,
//     pre_payment_credit_notes_amount: 0,
//     quote: null,
//     receipt_number: null,
//     rendering: { amount_tax_display: null, pdf: [Object] },
//     rendering_options: null,
//     shipping_cost: null,
//     shipping_details: null,
//     starting_balance: 0,
//     statement_descriptor: null,
//     status: 'draft',
//     status_transitions: {
//       finalized_at: null,
//       marked_uncollectible_at: null,
//       paid_at: null,
//       voided_at: null
//     },
//     subscription: null,
//     subscription_details: { metadata: null },
//     subtotal: 0,
//     subtotal_excluding_tax: 0,
//     tax: null,
//     test_clock: null,
//     total: 0,
//     total_discount_amounts: [],
//     total_excluding_tax: 0,
//     total_tax_amounts: [],
//     transfer_data: null,
//     webhooks_delivered_at: null
//   }
// }
// -----------------------
