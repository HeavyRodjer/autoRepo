import './globals.css';

export const metadata = {
  title: 'Управління орендою авто',
  description: 'Система управління автопарком',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body className="bg-gray-100 text-gray-800 p-8 font-sans">
        {children}
      </body>
    </html>
  );
}
