import * as userRepo from "../repositories/userRepository";

export async function createUser(data: userRepo.CreateUserData) {
  return await userRepo.createUser(data);
}

export async function getUser(id: string) {
  return await userRepo.getUserById(id);
}
