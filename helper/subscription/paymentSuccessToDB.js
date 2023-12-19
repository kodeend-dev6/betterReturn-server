const { findUser } = require("../user.helper");
const config = require("../../config/config");
const fetcher = require("../../utils/fetcher/airTableFetcher");
const moment = require("moment");

const paymentSuccessToDB = async ({ subscription, customer_email }) => {
  try {
    // update Subscription_id, Plan_end_date in database
    const newData = {
      Subscription_id: subscription?.id || "",
      Plan_end_date: moment.unix(subscription?.current_period_end) || null,
      PaymentRequired: false,
      InvoiceURL: "",
    };

    const user = await findUser(customer_email, {
      throwError: false,
    });

    // Update to airtable
    const airtableURL = `${config?.db?.userTableUrl}/${user?.id}`;
    const data = { fields: newData };
    const response = await fetcher.patch(airtableURL, data);

    return response.data;
  } catch (error) {
    console.log(error?.response?.data?.error);
  }
};

module.exports = paymentSuccessToDB;
