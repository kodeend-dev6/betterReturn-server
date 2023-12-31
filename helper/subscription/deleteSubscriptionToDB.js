const fetcher = require("../../utils/fetcher/airTableFetcher");
const config = require("../../config/config");
const { findUser } = require("../user.helper");

const deletedSubscriptionToDB = async (subscription) => {
  const user = await findUser(subscription?.customer?.email, {
    throwError: true,
  });
  const airtableURL = `${config.db.userTableUrl}/${user?.id}`;

  const data = {
    fields: {
      Subscription_id: "",
      Plan_start_date: null,
      Plan_end_date: null,
      Plan_name: "",
      FreeTier: true,
    },
  };

  const response = await fetcher.patch(airtableURL, data);

  return response;
};

module.exports = deletedSubscriptionToDB;
