import mongoose, { Document, Schema } from 'mongoose';

export interface UserDoc extends Document {
  access_token: string;
  email: string;
  picture: string;
  googleId: string;
  refresh_token: string;
  labelId?: string;
  expiry_date: string;
}

export interface IUser {
  email: string;
  picture: string;
  googleId: string;
  access_token: string;
  expiry_date: string;
  refresh_token: string;
  labelId?: string;
}

export const UserSchema: Schema = new Schema({
  email: {
    type: String,
    unique: true,
  },
  picture: String,
  name: String,
  googleId: {
    unique: true,
    type: String,
  },
  access_token: String,
  refresh_token: String,
  expiry_date: String,
  labelId: String,
});

const UserModel = mongoose.model<IUser>('User', UserSchema);

export default UserModel;
