import { clerkSetup } from '@clerk/testing/playwright';
import dotenv from 'dotenv';
dotenv.config();

export default async function globalSetup(config: any) {
  await clerkSetup();
}
