const getPaginated = async (
  model,
  query,
  page,
  limit,
  sortOptions = {},
  populateOptions = null
) => {
  const skip = (page - 1) * limit;

  let findQuery = model.find(query);

  if (populateOptions) {
    findQuery = findQuery.populate(populateOptions);
  }

  const [items, totalItems] = await Promise.all([
    findQuery.sort(sortOptions).skip(skip).limit(limit),
    model.countDocuments(query),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    items,
    currentPage: page,
    totalPages,
    totalItems,
  };
};

module.exports = getPaginated;
