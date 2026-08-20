const authService = require("./auth.service");
const { successResponse } = require("../../shared/utils/response");
const { parseDurationMs } = require("../../shared/utils/parse-duration");
const config = require("../../config/env");

// Computed once at startup — config.env is fixed for the process lifetime.
const isProduction = config.env === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
};

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { admin, accessToken } = await authService.login({
        email,
        password,
      });

      // Set Access Token cookie — maxAge aligned to JWT expiry
      res.cookie("accessToken", accessToken, {
        ...baseCookieOptions,
        maxAge: parseDurationMs(config.jwt.accessExpiresIn),
      });

      return successResponse(res, { admin });
    } catch (error) {
      next(error);
    }
  }


  async logout(req, res, next) {
    try {
      res.clearCookie("accessToken", baseCookieOptions);
      return successResponse(res, null);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      return successResponse(res, { admin: req.admin });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
