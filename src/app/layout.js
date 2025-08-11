import "./globals.css";

export const metadata = {
  title: "NSDC 2025",
  description:
    "A group of surveys for the National Sugar Development Council (NSDC) 2025",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="">{children}</body>
    </html>
  );
}
