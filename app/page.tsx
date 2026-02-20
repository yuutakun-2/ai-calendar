import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
      redirect("/dashboard");
    } catch {
      // invalid token – fall through to login redirect
    }
  }

  redirect("/login");
}
