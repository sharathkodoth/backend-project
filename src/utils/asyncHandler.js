const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// another method

// const asyncHandler = (requstHandler) => async (req, res, next) => {
//   try {
//     await requstHandler(req, res, next);
//   } catch (err) {
//     res.status(err.code || 500).json({
//       sucess: false,
//       message: err.message,
//     });
//   }
// };
// export { asyncHandler };
