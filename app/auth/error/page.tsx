import Link from "next/link";

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const denied = error === "AccessDenied";
  return (
    <section className="wrap auth-error">
      <p className="eyebrow">Trinity Robotics</p>
      <h1>{denied ? "Use your Trinity Google account" : "Sign-in didn’t finish"}</h1>
      <p>
        {denied
          ? "Sign in with the Google account Trinity School gave you. Other Google accounts can’t tick things off."
          : "Something interrupted sign-in. Try again from the button in the header."}
      </p>
      <Link href="/" className="btn">
        Back home
      </Link>
    </section>
  );
}
