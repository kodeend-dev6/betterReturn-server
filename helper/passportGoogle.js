const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const passportGoogle = async () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // callbackURL: "http://localhost:3001/api/auth/google/callback"
        callbackURL:
          "https://better-return-server.onrender.com/api/auth/google/callback",
      },
      (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });
};

module.exports = passportGoogle;
