// Login form rules, shared by the login screen and its tests.

bool isValidEmail(String email) => email.contains('@');

bool isValidPassword(String password) => password.length >= 8;

bool isValidLogin(String email, String password) =>
    isValidEmail(email) && isValidPassword(password);
