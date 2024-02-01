import AppError from "../utils/AppError.js";
import asyncCatch from "express-async-catch";
import { User } from "./../models/signupModel.js";
import { tokenGenerator } from "../utils/tokenGenerator.js";
import crypto from "crypto";
import { sendEmailMessage } from "./emailHandler.js";
import Institution from "../models/organizationModel.js";
import Lawyer from "../models/lawyerModel.js";

export const signupHandler = asyncCatch(async (req, res, next) => {
  // const profilePicture = req.files.profilePicture;
  let userId = "";

  // if (req.body.userType === "lawyer") {
  // console.log(req.body.userType);
  // const lawyer = await Lawyer.create({});
  // console.log(lawyer, "lawyer data");
  // res.status(200).json({ message: "success" });
  // if (lawyer) userId = lawyer._id;
  // }

  // console.log(userId.toString().length, "user id");
  // if (userId.toString().length > 0) {
  const data = await User.create({
    // firstName,
    // middleName,
    // lastName,
    // userName,
    // email,
    // phone,
    // address,
    // nationality,
    // role,
    // userType,
    // userId,
    // password,
    // userType,
    ...req.body,
    // profilePicture: profilePicture
    //   ? "http://192.168.100.12:5000/uploads/" + profilePicture[0].filename
    //   : undefined,
  });
  const token = tokenGenerator(res, data._id);

  return res
    .status(200)
    .json({ message: "Account Created Successfully", token, data });
  // }
});

export const loginHandler = asyncCatch(async (req, res, next) => {
  const { userName, password } = req.body;
  if (!userName || !password)
    return next(new AppError("provide email and password", 404));
  const user = await User.findOne({ userName }).select("+password");
  if (!user)
    return next(
      new AppError(
        "there is no user found by this user name please register first",
        404
      )
    );

  const isPasswordCorrect = await user.passwordCheck(user.password, password);
  if (!isPasswordCorrect)
    return next(new AppError("Invalid user name or password", 404));
  const token = tokenGenerator(res, user._id);

  res.status(200).json({
    status: "success",
    message: "you are logged in successfully",
    data: user,
    token,
  });
});

export const forgetPassword = asyncCatch(async (req, res, next) => {
  const { email } = req.body;
  if (!email)
    return next(new AppError("please provide your email address", 404));
  const user = await User.findOne({ email });
  if (!user)
    return next(new AppError("There is no email registered by this email"));

  const resetTokenUrl = await user.createResetToken();
  await user.save({ validateBeforeSave: false });
  const passwordResetUrl = `${req.protocol}:/${req.originalUrl}/${resetTokenUrl}`; // this url will sent via email

  //email sent logic here
  sendEmailMessage(passwordResetUrl);
});

export const resetPassword = asyncCatch(async (req, res, next) => {
  const resetToken = await crypto
    .createHash("sha256")
    .update(req.query.resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetToken,
  }).select("+password");

  if (!user) return next(new AppError("Invalid Token", 404));

  const isTokenExpired = await user.isTokenExpired();
  if (isTokenExpired) return next(new AppError("Token Expired", 404));

  user.password = req.body.password;
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  user.save({ validateBeforeSave: true });

  const token = tokenGenerator(res, user._id);

  res.status(201).json({
    status: "success",
    message: "Your password changed successfully",
    token,
  });
});

export const readProfileInfo = asyncCatch(async (req, res, next) => {
  res.status(200).json({
    status: "READ",
    data: req.user,
  });
});

export const updateProfileInfo = asyncCatch(async (req, res, next) => {
  const body = { ...req.body };
  body.role && delete body["role"];
  body.password && delete body["password"];
  const data = await User.findByIdAndUpdate(req.query.id, {
    $set: { ...body },
  });

  if (!data)
    return next(new AppError("Error unable to update the profile", 404));

  res
    .status(200)
    .json({ status: "Updated", message: "Profile updated successfully", data });
});

export const updateProfilePicture = asyncCatch(async (req, res, next) => {
  if (!req.files || !req.files.profilePicture)
    return next(new AppError("please select your new profile picture", 404));

  const data = await User.findByIdAndUpdate(req.body.id, {
    $set: { profilePicture: req.files.profilePicture[0].path },
  });

  if (!data)
    return next(new AppError("Error unable to update the profile", 404));

  return res.status(200).json({
    status: "Updated",
    message: "Profile updated successfully",
    data,
  });
});

export const updatePassword = asyncCatch(async (req, res, next) => {
  const body = { ...req.body };
  body.role && delete body["role"];
  body.permission && delete body["permission"];

  const user = await User.findOne({ _id: body.id }).select("+password");

  user.password = body.newPassword;
  await user.save();

  res
    .status(200)
    .json({ status: "Changed", message: "Password changed successfully" });
});

export const getUsersHandler = asyncCatch(async (req, res, next) => {
  const data = await User.find().sort("-createdAt");
  res.status(200).json({ status: "success", length: data.length, data });
});
