import Link from 'next/link';

export default function About() {
  return (
    <div>
      <h1>About GRAPEVNE</h1>

      <div>
        <Link href="/">
          Home
        </Link>
        <Link
          href={{
            pathname: "/blog/[slug]",
            query: {
              slug: "123"
            },
          }}
        >
          My Blog Post
        </Link>
      </div>
    </div>
  );
}
