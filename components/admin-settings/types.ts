// An administrator account as returned by /api/auth/me and /api/admins.
export type AdminAccount = {
  id: number;

  username: string | null;

  firstName: string | null;
  middleName: string | null;
  lastName: string | null;

  fullName: string | null;

  email: string | null;
  contactNumber: string | null;

  role: string | null;

  accountStatus: string | null;

  isVerified: boolean;

  profilePictureUri: string | null;

  createdAt: string | null;
  updatedAt: string | null;

  // Only on /api/admins rows.
  isCurrentUser?: boolean;
  hasHistory?: boolean;
  canDelete?: boolean;
};
