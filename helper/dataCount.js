const config = require("../config/config");
const ApiError = require("../utils/errors/ApiError");
const fetcher = require("../utils/fetcher/airTableFetcher");

const dataCount = async ({ tableName }) => {
  try {
    const response = await fetcher.get(`${config.db.dbSummaryTableUrl}`);

    const data = response?.data?.records.find(
      (item) => item.fields?.TableName === tableName
    );

    return { total: data?.fields?.Total };
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
};

module.exports = dataCount;
