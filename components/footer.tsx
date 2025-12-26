import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-blue-50 py-5">
      <div className="container mx-auto px-4 text-center text-gray-600">
        <p>
          {`Developed by `}
          <Link
            href="https://maruf-bepary.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Maruf Bepary
          </Link>
        </p>
      </div>
    </footer>
  );
}
