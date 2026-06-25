export const getErrorMessage = (error: unknown, fallback?: string): string => {
  if (!error) {
    return "";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback ?? "An unknown error occurred.";
};
