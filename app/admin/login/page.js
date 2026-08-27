import { redirect } from "next/navigation";
import LoginForm from "../../../components/LoginForm";
import { isAdmin } from "../../../lib/auth";

export const metadata = {
  title: "Admin Login"
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return <LoginForm />;
}
