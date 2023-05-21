import UserModel, { IUser, UserDoc } from '../schema/User';

export const findByGoogleId = async (googleId: string) => {
  const user = await UserModel.findOne({ googleId });

  return user;
};

export const createUser = async (UserInput: IUser) => {
  const user = await UserModel.create(UserInput);

  return user;
};

export const updateTokens = async (
  access_token: string,
  refresh_token: string,
  userId: string,
  expiry_date: string,
) => {
  const user = await UserModel.findByIdAndUpdate(userId, { $set: { access_token, refresh_token, expiry_date } });

  return user;
};

export const updateLabel = async (label_id: string, userId: string) => {
  const user = await UserModel.findByIdAndUpdate(userId, { $set: { labelId: label_id } });

  return user;
};

export const findUserByEmail = async (email: string) => {
  return await UserModel.findOne({ email });
};

export const findAll = async (): Promise<UserDoc[]> => {
  return await UserModel.find({});
};
