const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const requestedLimit = parseInt(query.limit, 10) || 10;

  const limit = Math.min(Math.max(requestedLimit, 1), 100);

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

const getSort = (query, allowedFields = [], defaultSort = "-createdAt") => {
  if (!query.sort) {
    return defaultSort;
  }

  const requestedFields = query.sort
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);

  const validFields = requestedFields.filter((field) => {
    const cleanField = field.replace(/^[-+]/, "");

    return allowedFields.includes(cleanField);
  });

  if (!validFields.length) {
    return defaultSort;
  }

  return validFields.join(" ");
};

const buildSearchFilter = (search, fields = []) => {
  if (!search || !fields.length) {
    return {};
  }

  const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (!escapedSearch) {
    return {};
  }

  return {
    $or: fields.map((field) => ({
      [field]: {
        $regex: escapedSearch,
        $options: "i",
      },
    })),
  };
};

const buildPaginationResponse = ({ page, limit, total }) => {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
  };
};

export { getPagination, getSort, buildSearchFilter, buildPaginationResponse };
