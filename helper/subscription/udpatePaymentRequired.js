const { findUser } = require("../user.helper");
const config = require("../../config/config");
const fetcher = require("../../utils/fetcher/airTableFetcher");

const updatePaymentRequired = async ({ invoice }) => {
  try {
    const { customer_email, hosted_invoice_url } = invoice;

    const user = await findUser(customer_email, { throwError: true });
    const airtableURL = `${config?.db?.user}/${user?.id}`;
    const data = {
      fields: {
        PaymentRequired: true,
        InvoiceURL: hosted_invoice_url,
      },
    };
    const response = await fetcher.patch(airtableURL, data);
    
  } catch (error) {
    console.log(error?.message);
  }
};

module.exports = {
  updatePaymentRequired,
};
