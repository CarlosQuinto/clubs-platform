export const signupPath = (email?: string) => {
  const clean = email?.trim().toLowerCase();
  return clean ? `/registro?email=${encodeURIComponent(clean)}` : "/registro";
};

export const signupUrl = (email?: string) =>
  `${window.location.origin}${signupPath(email)}`;
