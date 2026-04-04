export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

export type AppTabParamList = {
  Calendar: undefined;
  Recipes: undefined;
  Scan: undefined;
  Shopping: undefined;
  Profile: undefined;
};

export type RecipeStackParamList = {
  RecipeSearch: undefined;
  RecipeDetail: { recipeId?: string; recipe?: any };
};

export type HouseholdStackParamList = {
  HouseholdSetup: undefined;
  CreateHousehold: undefined;
  JoinHousehold: undefined;
};
