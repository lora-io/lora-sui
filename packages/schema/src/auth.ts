export enum UserRole {
  User = 0,
  Admin = 1,
  SuperAdmin = 2,
}

export interface JwtPayload {
  userId: string
  userRole: UserRole
}
