const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)) //requestHandler will call here.
      .catch((error) => next());
  };
};

export { asyncHandler };

// here we are returning a middleware function which has (req, res, next) req, res comes from requestHandler
// so inside that returned middleware our requestHandler is called.

/*

for example: 

app.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await User.find();
    res.json(users);
  })
);

so we passing our function to the asyncHandler
then our asyncHandler return a function which has (req, res, next)
then our actual function will run and after that
any error occurs then it will passed to catch block.
  
*/
